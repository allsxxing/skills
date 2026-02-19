// tools/search_roles.js — MCP tool: keyword/dept/skill search

import { searchRoles } from '../database.js';
import { computeTechnicalIntensityScore, isHighPriority } from '../config.js';

export const definition = {
  name: 'search_roles',
  description: 'Search xAI remote roles by keyword, department, employment type, or required skill. Returns matching roles with relevance data and technical intensity scores.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Keyword to match against title, description, requirements'
      },
      department: {
        type: 'string',
        description: 'Filter by department name (e.g., Research, Engineering, Infrastructure)'
      },
      employment_type: {
        type: 'string',
        description: 'Filter by employment type (e.g., Full-time, Contract)'
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results to return (default 10, max 100)',
        default: 10
      }
    },
    required: ['query']
  }
};

export async function handler(args, db) {
  try {
    const roles = searchRoles(args.query, {
      department: args.department,
      employment_type: args.employment_type,
      limit: args.limit || 10
    });

    const results = roles.map(role => ({
      id: role.id,
      title: role.title,
      department: role.department,
      location: role.location,
      employment_type: role.employment_type,
      role_url: role.role_url,
      requirements_snippet: role.requirements
        ? JSON.parse(role.requirements).slice(0, 3).join('; ')
        : null,
      technicalIntensityScore: computeTechnicalIntensityScore(role),
      highPriority: isHighPriority(role),
      is_new: !!role.is_new,
      is_updated: !!role.is_updated,
      first_seen: role.first_seen,
      last_seen: role.last_seen
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query: args.query,
          filters: { department: args.department, employment_type: args.employment_type },
          total: results.length,
          roles: results
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error searching roles: ${error.message}` }]
    };
  }
}
