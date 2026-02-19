// config.js — Constants, field maps, xAI context layer
// Provides domain intelligence about xAI for enriching MCP tool responses.

import 'dotenv/config';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const TARGET_URL = process.env.XAI_CAREERS_URL || 'https://x.ai/careers/open-roles?location=remote';
export const DB_PATH = process.env.XAI_DB_PATH || join(__dirname, 'db', 'xai_careers.sqlite');
export const SNAPSHOTS_DIR = join(__dirname, 'data', 'snapshots');
export const SCRAPE_TIMEOUT_MS = 30000;

export const XAI_CONTEXT = {
  company: 'xAI',
  founder: 'Elon Musk',
  flagship_product: 'Grok',
  mission: 'Accelerate human scientific discovery via AI',
  competitors: ['OpenAI', 'Anthropic', 'Google DeepMind', 'Meta AI'],
  platform_integrations: ['X (Twitter)', 'Tesla', 'SpaceX'],
  known_departments: [
    'Research', 'Engineering', 'Infrastructure', 'Product',
    'Security', 'Operations', 'Legal', 'Finance', 'Recruiting'
  ],
  tech_stack_signals: [
    'CUDA', 'PyTorch', 'JAX', 'Rust', 'C++', 'Python', 'Go',
    'Kubernetes', 'Terraform', 'distributed training', 'RLHF',
    'transformer architecture', 'inference optimization',
    'post-training', 'fine-tuning', 'multimodal', 'LLM'
  ],
  hiring_pattern_notes: [
    'Roles open and close rapidly — often within days',
    'Heavy emphasis on senior IC hires with published research',
    'Infrastructure and training infra roles consistently open',
    'Strong preference for candidates with frontier model experience',
    'Remote roles often US-only or global depending on department',
    'Compensation signals: equity-heavy, competing with top labs'
  ],
  priority_signals: [
    'Grok', 'inference', 'post-training', 'safety', 'multimodal',
    'training infrastructure', 'distributed systems', 'RLHF'
  ]
};

/**
 * Compute a technicalIntensityScore (1–10) for a role by counting matches
 * against XAI_CONTEXT.tech_stack_signals in the role's title, description,
 * and requirements.
 * @param {Object} role — { title, description, requirements }
 * @returns {number} score from 1 to 10
 */
export function computeTechnicalIntensityScore(role) {
  const text = [
    role.title || '',
    role.description || '',
    typeof role.requirements === 'string' ? role.requirements : JSON.stringify(role.requirements || []),
    typeof role.nice_to_have === 'string' ? role.nice_to_have : JSON.stringify(role.nice_to_have || [])
  ].join(' ').toLowerCase();

  let matches = 0;
  for (const signal of XAI_CONTEXT.tech_stack_signals) {
    if (text.includes(signal.toLowerCase())) {
      matches++;
    }
  }

  // Scale: 0 matches = 1, 17 matches (all) = 10
  const maxSignals = XAI_CONTEXT.tech_stack_signals.length;
  return Math.max(1, Math.min(10, Math.round((matches / maxSignals) * 9) + 1));
}

/**
 * Check if a role should be flagged HIGH_PRIORITY.
 * Returns true if 3+ priority_signals match in role text.
 * @param {Object} role — { title, description, requirements }
 * @returns {boolean}
 */
export function isHighPriority(role) {
  const text = [
    role.title || '',
    role.description || '',
    typeof role.requirements === 'string' ? role.requirements : JSON.stringify(role.requirements || [])
  ].join(' ').toLowerCase();

  let matches = 0;
  for (const signal of XAI_CONTEXT.priority_signals) {
    if (text.includes(signal.toLowerCase())) {
      matches++;
    }
  }
  return matches >= 3;
}
