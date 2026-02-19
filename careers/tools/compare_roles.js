// tools/compare_roles.js — MCP tool: side-by-side role diff

import { getRoleById, searchRoles } from '../database.js';
import { computeTechnicalIntensityScore, isHighPriority } from '../config.js';

export const definition = {
  name: 'compare_roles',
  description: 'Side-by-side structured comparison of two xAI roles. Shows shared requirements, unique qualifications, department differences, and technical intensity scores.',
  inputSchema: {
    type: 'object',
    properties: {
      role_a: {
        type: 'string',
        description: 'Title or ID of the first role'
      },
      role_b: {
        type: 'string',
        description: 'Title or ID of the second role'
      }
    },
    required: ['role_a', 'role_b']
  }
};

function findRole(identifier) {
  // Try by ID first, then fuzzy title match
  let role = getRoleById(identifier);
  if (!role) {
    const results = searchRoles(identifier, { limit: 1 });
    if (results.length > 0) role = results[0];
  }
  return role;
}

function parseRequirements(role) {
  try {
    return role.requirements ? JSON.parse(role.requirements) : [];
  } catch {
    return [];
  }
}

function parseNiceToHave(role) {
  try {
    return role.nice_to_have ? JSON.parse(role.nice_to_have) : [];
  } catch {
    return [];
  }
}

export async function handler(args, db) {
  try {
    const roleA = findRole(args.role_a);
    const roleB = findRole(args.role_b);

    if (!roleA) {
      return { isError: true, content: [{ type: 'text', text: `Role A not found: "${args.role_a}". Use search_roles to find valid IDs.` }] };
    }
    if (!roleB) {
      return { isError: true, content: [{ type: 'text', text: `Role B not found: "${args.role_b}". Use search_roles to find valid IDs.` }] };
    }

    const reqsA = parseRequirements(roleA);
    const reqsB = parseRequirements(roleB);
    const niceA = parseNiceToHave(roleA);
    const niceB = parseNiceToHave(roleB);

    // Find shared and unique requirements (normalized comparison)
    const normalizeReq = (r) => r.toLowerCase().trim();
    const setA = new Set(reqsA.map(normalizeReq));
    const setB = new Set(reqsB.map(normalizeReq));

    const shared_requirements = reqsA.filter(r => setB.has(normalizeReq(r)));
    const unique_to_a = reqsA.filter(r => !setB.has(normalizeReq(r)));
    const unique_to_b = reqsB.filter(r => !setA.has(normalizeReq(r)));

    const scoreA = computeTechnicalIntensityScore(roleA);
    const scoreB = computeTechnicalIntensityScore(roleB);

    const comparison = {
      role_a: {
        id: roleA.id,
        title: roleA.title,
        department: roleA.department,
        location: roleA.location,
        employment_type: roleA.employment_type,
        technicalIntensityScore: scoreA,
        highPriority: isHighPriority(roleA),
        first_seen: roleA.first_seen
      },
      role_b: {
        id: roleB.id,
        title: roleB.title,
        department: roleB.department,
        location: roleB.location,
        employment_type: roleB.employment_type,
        technicalIntensityScore: scoreB,
        highPriority: isHighPriority(roleB),
        first_seen: roleB.first_seen
      },
      diff: {
        dept_diff: roleA.department !== roleB.department,
        score_diff: scoreA - scoreB,
        shared_requirements,
        unique_to_a,
        unique_to_b,
        nice_to_have_a: niceA,
        nice_to_have_b: niceB
      }
    };

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(comparison, null, 2)
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error comparing roles: ${error.message}` }]
    };
  }
}
