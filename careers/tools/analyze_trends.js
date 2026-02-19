// tools/analyze_trends.js — MCP tool: skill/dept/keyword frequency analysis

import { getAllRoles } from '../database.js';
import { XAI_CONTEXT, computeTechnicalIntensityScore, isHighPriority } from '../config.js';

export const definition = {
  name: 'analyze_trends',
  description: 'Analyze patterns and frequency across all current xAI remote roles. Dimensions: skills, departments, keywords, role_types, priority_flags.',
  inputSchema: {
    type: 'object',
    properties: {
      dimension: {
        type: 'string',
        enum: ['skills', 'departments', 'keywords', 'role_types', 'priority_flags'],
        description: 'What dimension to analyze frequency for'
      }
    },
    required: ['dimension']
  }
};

export async function handler(args, db) {
  try {
    const roles = getAllRoles();
    const total = roles.length;

    if (total === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ message: 'No roles in database. Run trigger_scrape first.', total: 0 }, null, 2)
        }]
      };
    }

    let analysis;

    switch (args.dimension) {
      case 'skills': {
        // Count tech_stack_signals across all roles
        const counts = {};
        for (const signal of XAI_CONTEXT.tech_stack_signals) {
          counts[signal] = 0;
        }
        for (const role of roles) {
          const text = [role.title, role.description, role.requirements, role.nice_to_have]
            .filter(Boolean).join(' ').toLowerCase();
          for (const signal of XAI_CONTEXT.tech_stack_signals) {
            if (text.includes(signal.toLowerCase())) {
              counts[signal]++;
            }
          }
        }
        analysis = Object.entries(counts)
          .map(([skill, count]) => ({ skill, count, percentage: ((count / total) * 100).toFixed(1) + '%' }))
          .sort((a, b) => b.count - a.count);
        break;
      }

      case 'departments': {
        const counts = {};
        for (const role of roles) {
          const dept = role.department || 'Unknown';
          counts[dept] = (counts[dept] || 0) + 1;
        }
        analysis = Object.entries(counts)
          .map(([department, count]) => ({ department, count, percentage: ((count / total) * 100).toFixed(1) + '%' }))
          .sort((a, b) => b.count - a.count);
        break;
      }

      case 'keywords': {
        // Extract top keywords from all titles and descriptions
        const stopWords = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'will', 'you', 'our', 'have', 'has', 'been', 'can', 'all', 'your', 'not', 'but']);
        const wordCounts = {};
        for (const role of roles) {
          const text = [role.title, role.description].filter(Boolean).join(' ');
          const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
          const seen = new Set();
          for (const word of words) {
            if (!stopWords.has(word) && !seen.has(word)) {
              seen.add(word);
              wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
          }
        }
        analysis = Object.entries(wordCounts)
          .map(([keyword, count]) => ({ keyword, count, percentage: ((count / total) * 100).toFixed(1) + '%' }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 30);
        break;
      }

      case 'role_types': {
        const counts = {};
        for (const role of roles) {
          const type = role.employment_type || 'Unknown';
          counts[type] = (counts[type] || 0) + 1;
        }
        analysis = Object.entries(counts)
          .map(([type, count]) => ({ employment_type: type, count, percentage: ((count / total) * 100).toFixed(1) + '%' }))
          .sort((a, b) => b.count - a.count);
        break;
      }

      case 'priority_flags': {
        let highPriorityCount = 0;
        const scoreDistribution = { '1-3': 0, '4-6': 0, '7-10': 0 };
        for (const role of roles) {
          if (isHighPriority(role)) highPriorityCount++;
          const score = computeTechnicalIntensityScore(role);
          if (score <= 3) scoreDistribution['1-3']++;
          else if (score <= 6) scoreDistribution['4-6']++;
          else scoreDistribution['7-10']++;
        }
        analysis = {
          high_priority_roles: highPriorityCount,
          high_priority_percentage: ((highPriorityCount / total) * 100).toFixed(1) + '%',
          technical_intensity_distribution: scoreDistribution,
          priority_signals_tracked: XAI_CONTEXT.priority_signals
        };
        break;
      }

      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown dimension: ${args.dimension}. Use: skills, departments, keywords, role_types, priority_flags` }]
        };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          dimension: args.dimension,
          total_roles: total,
          analysis
        }, null, 2)
      }]
    };
  } catch (error) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error analyzing trends: ${error.message}` }]
    };
  }
}
