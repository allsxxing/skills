// tools/get_role_detail.js — MCP tool: full role by title or ID

import { getRoleById, searchRoles } from '../database.js';
import { computeTechnicalIntensityScore, isHighPriority, XAI_CONTEXT } from '../config.js';

export const definition = {
  name: 'get_role_detail',
  description: 'Return full details of a specific xAI role by title or ID. Includes description, requirements, nice-to-have qualifications, technical intensity score, and priority flags.',
  inputSchema: {
    type: 'object',
    properties: {
      role_id: {
        type: 'string',
        description: 'The role ID (slugified title-department). Use search_roles to find IDs.'
      },
      title: {
        type: 'string',
        description: 'Fuzzy match by role title if exact ID is not known'
      }
    }
  }
};

export async function handler(args, db) {
  try {
    let role = null;

    // Try by ID first
    if (args.role_id) {
      role = getRoleById(args.role_id);
    }

    // Fall back to title search
    if (!role && args.title) {
      const results = searchRoles(args.title, { limit: 1 });
      if (results.length > 0) {
        role = results[0];
      }
    }

    if (!role) {
      return {
        isError: true,
        content: [{
          type: 'text',
          text: `Role not found. Searched by ${args.role_id ? 'ID: ' + args.role_id : ''}${args.title ? 'title: ' + args.title : ''}. Use search_roles to browse available roles.`
        }]
      };
    }

    // Parse JSON fields
    const parsedRole = {
      ...role,
      requirements: role.requirements ? JSON.parse(role.requirements) : [],
      nice_to_have: role.nice_to_have ? JSON.parse(role.nice_to_have) : [],
      technicalIntensityScore: computeTechnicalIntensityScore(role),
      highPriority: isHighPriority(role),
      is_new: !!role.is_new,
      is_updated: !!role.is_updated,
      xai_context: {
        company: XAI_CONTEXT.company,
        mission: XAI_CONTEXT.mission,
        flagship_product: XAI_CONTEXT.flagship_product
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(parsedRole, null, 2)
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error getting role detail: ${error.message}` }]
    };
  }
}
