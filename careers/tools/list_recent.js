// tools/list_recent.js — MCP tool: roles added/updated in last N days

import { getRecentRoles } from '../database.js';
import { computeTechnicalIntensityScore, isHighPriority } from '../config.js';

export const definition = {
  name: 'list_recent_roles',
  description: 'List xAI remote roles added or updated in the last N days. Returns roles sorted by most recently seen, with new/updated flags.',
  inputSchema: {
    type: 'object',
    properties: {
      days: {
        type: 'number',
        description: 'Number of days to look back (default 7)',
        default: 7
      }
    }
  }
};

export async function handler(args, db) {
  try {
    const days = args.days || 7;
    const roles = getRecentRoles(days);

    const results = roles.map(role => ({
      id: role.id,
      title: role.title,
      department: role.department,
      location: role.location,
      employment_type: role.employment_type,
      role_url: role.role_url,
      is_new: !!role.is_new,
      is_updated: !!role.is_updated,
      technicalIntensityScore: computeTechnicalIntensityScore(role),
      highPriority: isHighPriority(role),
      first_seen: role.first_seen,
      last_seen: role.last_seen
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          period_days: days,
          total: results.length,
          new_roles: results.filter(r => r.is_new).length,
          updated_roles: results.filter(r => r.is_updated).length,
          roles: results
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error listing recent roles: ${error.message}` }]
    };
  }
}
