#!/usr/bin/env node

// index.js — MCP server entry point (stdio transport)
// xAI Careers MCP Server: real-time knowledge base for remote roles at x.ai

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TARGET_URL, SNAPSHOTS_DIR, XAI_CONTEXT } from './config.js';
import { initDB, getAllRoles, getScrapeLogs, getRoleCount, closeDB } from './database.js';

// Import tool modules
import * as searchRoles from './tools/search_roles.js';
import * as getRoleDetail from './tools/get_role_detail.js';
import * as listRecent from './tools/list_recent.js';
import * as analyzeTrends from './tools/analyze_trends.js';
import * as compareRoles from './tools/compare_roles.js';
import * as triggerScrape from './tools/trigger_scrape.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Safety: redirect console.log to console.error (stdout is reserved for MCP protocol)
const originalLog = console.log;
console.log = (...args) => console.error('[LOG]', ...args);

// Initialize database
const db = initDB();

// Create MCP server
const server = new McpServer({
  name: 'xai-careers',
  version: '1.0.0'
});

// ──────────────────────────────────────────
// Register all 6 tools via server.tool()
// ──────────────────────────────────────────
const tools = [searchRoles, getRoleDetail, listRecent, analyzeTrends, compareRoles, triggerScrape];

for (const tool of tools) {
  const { name, description, inputSchema } = tool.definition;
  server.tool(name, description, inputSchema, async (args) => {
    return await tool.handler(args, db);
  });
}

console.error(`[xai-careers] Registered ${tools.length} tools`);

// ──────────────────────────────────────────
// Register 3 MCP resources
// ──────────────────────────────────────────

// Resource 1: xai://careers/all — all roles as JSON
server.resource(
  'all-roles',
  'xai://careers/all',
  async (uri) => {
    const roles = getAllRoles();
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ count: roles.length, roles }, null, 2)
      }]
    };
  }
);

// Resource 2: xai://careers/snapshot/latest — most recent JSON snapshot
server.resource(
  'latest-snapshot',
  'xai://careers/snapshot/latest',
  async (uri) => {
    try {
      const files = readdirSync(SNAPSHOTS_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length === 0) {
        return {
          contents: [{
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: 'No snapshots available. Run trigger_scrape first.' })
          }]
        };
      }

      const latestPath = join(SNAPSHOTS_DIR, files[0]);
      const content = readFileSync(latestPath, 'utf-8');
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: content
        }]
      };
    } catch (error) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: `Failed to read snapshot: ${error.message}` })
        }]
      };
    }
  }
);

// Resource 3: xai://careers/scrape-log — scrape history
server.resource(
  'scrape-log',
  'xai://careers/scrape-log',
  async (uri) => {
    const logs = getScrapeLogs(10);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({ count: logs.length, logs }, null, 2)
      }]
    };
  }
);

console.error('[xai-careers] Registered 3 resources');

// ──────────────────────────────────────────
// Start server
// ──────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[xai-careers] MCP server running via stdio');
  console.error(`[xai-careers] Target: ${TARGET_URL}`);
  console.error(`[xai-careers] Roles in DB: ${getRoleCount()}`);

  // Auto-scrape on cold start if DB is empty
  if (getRoleCount() === 0) {
    console.error('[xai-careers] Database empty — triggering initial scrape...');
    try {
      const { runScrape } = await import('./scraper.js');
      const stats = await runScrape();
      console.error(`[xai-careers] Initial scrape: ${stats.roles_total} roles (${stats.status})`);
    } catch (error) {
      console.error(`[xai-careers] Initial scrape failed: ${error.message}`);
    }
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.error('[xai-careers] Shutting down...');
  closeDB();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('[xai-careers] Shutting down...');
  closeDB();
  process.exit(0);
});

main().catch(error => {
  console.error(`[xai-careers] Fatal error: ${error.message}`);
  closeDB();
  process.exit(1);
});
