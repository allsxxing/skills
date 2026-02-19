// scraper.js — Playwright-based xAI careers page scraper
// Standalone executable AND importable module.
// Usage: node scraper.js  (standalone)
// Usage: import { runScrape } from './scraper.js'  (module)

import { chromium } from 'playwright';
import slugify from 'slugify';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  TARGET_URL, SNAPSHOTS_DIR, SCRAPE_TIMEOUT_MS,
  computeTechnicalIntensityScore, isHighPriority
} from './config.js';
import {
  initDB, upsertRole, logScrapeRun, resetFlags, getRoleCount
} from './database.js';

/**
 * Generate a deterministic role ID from title + department.
 * @param {string} title
 * @param {string} [department]
 * @returns {string}
 */
function generateRoleId(title, department) {
  const raw = `${title}-${department || 'general'}`;
  return slugify(raw, { lower: true, strict: true });
}

/**
 * Extract role listings from the careers page.
 * Uses multiple selector strategies for resilience.
 * @param {import('playwright').Page} page
 * @returns {Promise<Array<Object>>}
 */
async function extractRolesFromPage(page) {
  return await page.evaluate(() => {
    const roles = [];

    // Strategy 1: Look for links containing /careers/ path patterns that point to job detail pages
    const careerLinks = Array.from(document.querySelectorAll('a[href*="/careers/"]'))
      .filter(a => {
        const href = a.getAttribute('href') || '';
        // Filter out navigation links — we want links to individual role pages
        return href !== '/careers' && href !== '/careers/' &&
               !href.endsWith('/open-roles') &&
               !href.includes('?location=') &&
               href.split('/').length > 2;
      });

    if (careerLinks.length > 0) {
      for (const link of careerLinks) {
        const href = link.getAttribute('href') || '';
        const fullUrl = href.startsWith('http') ? href : `https://x.ai${href}`;

        // The link element or its parent card may contain structured role info
        const card = link.closest('[class*="card"], [class*="role"], [class*="job"], [class*="listing"], [class*="position"], article, li') || link;

        // Try to extract title from the most prominent text element
        const titleEl = card.querySelector('h2, h3, h4, [class*="title"], [class*="name"]') || link;
        const title = (titleEl.textContent || '').trim();

        // Try to extract department
        const deptEl = card.querySelector('[class*="department"], [class*="dept"], [class*="team"], [class*="category"], [class*="tag"]');
        const department = deptEl ? deptEl.textContent.trim() : null;

        // Try to extract location
        const locEl = card.querySelector('[class*="location"], [class*="loc"], [class*="place"]');
        const location = locEl ? locEl.textContent.trim() : null;

        if (title && title.length > 2 && title.length < 200) {
          roles.push({ title, department, location, role_url: fullUrl });
        }
      }
    }

    // Strategy 2: Look for repeated structural patterns (job cards in a list)
    if (roles.length === 0) {
      const containers = document.querySelectorAll('[class*="jobs"], [class*="roles"], [class*="listings"], [class*="openings"], [class*="positions"]');
      for (const container of containers) {
        const items = container.querySelectorAll('a, [class*="item"], [class*="card"], [class*="row"], li');
        for (const item of items) {
          const linkEl = item.tagName === 'A' ? item : item.querySelector('a');
          if (!linkEl) continue;

          const href = linkEl.getAttribute('href') || '';
          if (!href || href === '#') continue;
          const fullUrl = href.startsWith('http') ? href : `https://x.ai${href}`;

          const title = (item.querySelector('h2, h3, h4, strong, [class*="title"]') || item).textContent.trim();
          const department = item.querySelector('[class*="dept"], [class*="team"], [class*="category"]')?.textContent.trim() || null;
          const location = item.querySelector('[class*="location"]')?.textContent.trim() || null;

          if (title && title.length > 2 && title.length < 200) {
            roles.push({ title, department, location, role_url: fullUrl });
          }
        }
      }
    }

    // Strategy 3: Broad link scan — any internal links that look like job detail pages
    if (roles.length === 0) {
      const allLinks = Array.from(document.querySelectorAll('a'));
      for (const link of allLinks) {
        const href = link.getAttribute('href') || '';
        const text = link.textContent.trim();
        // Heuristic: links with non-trivial text that go to deep paths
        if (text.length > 5 && text.length < 200 && href.length > 10 &&
            !href.startsWith('#') && !href.includes('mailto:')) {
          const fullUrl = href.startsWith('http') ? href : `https://x.ai${href}`;
          // Only include if URL path has 3+ segments (like /careers/role-name)
          const pathParts = new URL(fullUrl).pathname.split('/').filter(Boolean);
          if (pathParts.length >= 2) {
            roles.push({ title: text, department: null, location: null, role_url: fullUrl });
          }
        }
      }
    }

    // Deduplicate by URL
    const seen = new Set();
    return roles.filter(r => {
      if (seen.has(r.role_url)) return false;
      seen.add(r.role_url);
      return true;
    });
  });
}

/**
 * Extract full role detail from an individual role page.
 * @param {import('playwright').Page} page
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function extractRoleDetail(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: SCRAPE_TIMEOUT_MS });
    await page.waitForTimeout(1000);

    return await page.evaluate(() => {
      const getText = (selectors) => {
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.trim()) return el.textContent.trim();
        }
        return null;
      };

      // Extract description — look for main content area
      const descEl = document.querySelector(
        '[class*="description"], [class*="content"], [class*="body"], article, main, [class*="detail"]'
      );
      const description = descEl ? descEl.innerText.trim() : document.body.innerText.trim().substring(0, 5000);

      // Extract requirement bullets
      const extractBullets = (headerPatterns) => {
        const bullets = [];
        const allElements = document.querySelectorAll('h2, h3, h4, h5, strong, b, p');
        for (const el of allElements) {
          const text = el.textContent.toLowerCase();
          if (headerPatterns.some(p => text.includes(p))) {
            // Get the next sibling list
            let sibling = el.nextElementSibling;
            while (sibling) {
              if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
                const items = sibling.querySelectorAll('li');
                items.forEach(li => bullets.push(li.textContent.trim()));
                break;
              }
              if (['H2', 'H3', 'H4', 'H5'].includes(sibling.tagName)) break;
              sibling = sibling.nextElementSibling;
            }
          }
        }
        return bullets;
      };

      const requirements = extractBullets(['requirement', 'qualif', 'what you', 'must have', 'need to have', 'experience']);
      const nice_to_have = extractBullets(['nice to have', 'preferred', 'bonus', 'plus', 'ideal']);

      // Extract employment type
      const employment_type = getText([
        '[class*="employment"], [class*="type"], [class*="contract"]'
      ]);

      // Extract posted date
      const posted_date = getText([
        '[class*="date"], [class*="posted"], time'
      ]);

      // Extract department from detail page
      const department = getText([
        '[class*="department"], [class*="team"], [class*="category"]'
      ]);

      // Extract location from detail page
      const location = getText([
        '[class*="location"], [class*="place"]'
      ]);

      return { description, requirements, nice_to_have, employment_type, posted_date, department, location };
    });
  } catch (error) {
    console.error(`[scraper] Failed to extract detail from ${url}: ${error.message}`);
    return { description: null, requirements: [], nice_to_have: [], employment_type: null, posted_date: null };
  }
}

/**
 * Save a JSON snapshot of the scrape run.
 * @param {Array<Object>} roles
 * @returns {string} snapshot filename
 */
function saveSnapshot(roles) {
  mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
  const filename = `${ts}.json`;
  const filepath = join(SNAPSHOTS_DIR, filename);
  writeFileSync(filepath, JSON.stringify({
    scraped_at: now.toISOString(),
    roles_total: roles.length,
    roles
  }, null, 2));
  console.error(`[scraper] Snapshot saved: ${filepath}`);
  return filename;
}

/**
 * Run the full scrape pipeline.
 * @returns {Promise<Object>} stats object
 */
export async function runScrape() {
  const startTime = Date.now();
  let browser = null;
  const stats = {
    run_at: new Date().toISOString(),
    roles_total: 0,
    roles_new: 0,
    roles_updated: 0,
    roles_removed: 0,
    status: 'failed'
  };

  try {
    initDB();
    resetFlags();

    console.error('[scraper] Launching browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    // Navigate to careers page
    console.error(`[scraper] Navigating to ${TARGET_URL}...`);
    const response = await page.goto(TARGET_URL, {
      waitUntil: 'networkidle',
      timeout: SCRAPE_TIMEOUT_MS
    });

    if (!response || response.status() >= 400) {
      throw new Error(`Page returned status ${response?.status() || 'unknown'}`);
    }

    // Wait for dynamic content to render
    await page.waitForTimeout(3000);
    console.error('[scraper] Page loaded. Extracting roles...');

    // Extract role listings from the page
    const rawRoles = await extractRolesFromPage(page);
    console.error(`[scraper] Found ${rawRoles.length} role cards on page`);

    if (rawRoles.length === 0) {
      console.error('[scraper] WARNING: No roles found. Page structure may have changed.');
      stats.status = 'partial';
      logScrapeRun(stats);
      return stats;
    }

    // Process each role
    const processedRoles = [];
    for (let i = 0; i < rawRoles.length; i++) {
      const raw = rawRoles[i];
      console.error(`[scraper] Processing role ${i + 1}/${rawRoles.length}: ${raw.title}`);

      // Navigate to detail page for full info
      const detail = await extractRoleDetail(page, raw.role_url);

      // Add a small delay to avoid rate limiting
      if (i < rawRoles.length - 1) {
        await page.waitForTimeout(500);
      }

      const role = {
        id: generateRoleId(raw.title, raw.department || detail.department),
        title: raw.title,
        department: raw.department || detail.department || null,
        location: raw.location || detail.location || null,
        employment_type: detail.employment_type || null,
        description: detail.description || null,
        requirements: detail.requirements.length > 0 ? JSON.stringify(detail.requirements) : null,
        nice_to_have: detail.nice_to_have.length > 0 ? JSON.stringify(detail.nice_to_have) : null,
        posted_date: detail.posted_date || null,
        role_url: raw.role_url
      };

      // Compute enrichment scores
      role.technicalIntensityScore = computeTechnicalIntensityScore(role);
      role.highPriority = isHighPriority(role);

      // Upsert into database
      const result = upsertRole(role);
      if (result.action === 'inserted') stats.roles_new++;
      if (result.action === 'updated') stats.roles_updated++;

      processedRoles.push(role);
    }

    stats.roles_total = processedRoles.length;
    stats.status = 'success';

    // Save snapshot
    saveSnapshot(processedRoles);

    // Log scrape run
    logScrapeRun(stats);

    const durationMs = Date.now() - startTime;
    console.error(`[scraper] Complete in ${(durationMs / 1000).toFixed(1)}s`);
    console.error(`[scraper] Total: ${stats.roles_total} | New: ${stats.roles_new} | Updated: ${stats.roles_updated}`);

    return stats;
  } catch (error) {
    console.error(`[scraper] Error: ${error.message}`);
    stats.status = 'failed';
    try { logScrapeRun(stats); } catch (_) { /* ignore logging errors */ }
    return stats;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

// Standalone execution
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith('scraper.js') ||
  process.argv[1].endsWith('scraper')
);

if (isMainModule) {
  console.error('[scraper] Starting standalone scrape...');
  runScrape()
    .then(result => {
      console.error('[scraper] Final stats:', JSON.stringify(result, null, 2));
      process.exit(result.status === 'failed' ? 1 : 0);
    })
    .catch(err => {
      console.error(`[scraper] Fatal: ${err.message}`);
      process.exit(1);
    });
}
