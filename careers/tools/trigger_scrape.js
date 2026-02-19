// tools/trigger_scrape.js — MCP tool: manually fire a fresh scrape + sync

import { runScrape } from '../scraper.js';

export const definition = {
  name: 'trigger_scrape',
  description: 'Manually trigger a fresh scrape of x.ai/careers and sync the knowledge base. Returns scrape statistics including total roles found, new roles, updated roles, and status.',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

export async function handler(args, db) {
  try {
    console.error('[trigger_scrape] Starting manual scrape...');
    const stats = await runScrape();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          message: stats.status === 'success'
            ? `Scrape completed successfully. Found ${stats.roles_total} roles.`
            : `Scrape finished with status: ${stats.status}`,
          ...stats
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error triggering scrape: ${error.message}` }]
    };
  }
}
