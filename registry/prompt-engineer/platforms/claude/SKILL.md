---
name: prompt-engineer
description: Automatically upgrades any raw or weak prompt into an expertly engineered, high-performance version. Use when the user says improve this prompt, optimize prompt, engineer this prompt, rewrite prompt, better prompt for, prompt upgrade, enhance my prompt, make this prompt better, or pastes a rough task and wants a production-ready version. Outputs the final engineered prompt inside a clean codeblock, optimized for the target AI platform or agent (Grok, Claude, GPT, Gemini, Midjourney, Flux, Runway, Cursor, custom agents, etc.).
---

# Prompt Engineer

## Overview

Transform any raw user input into a sharply engineered prompt that maximizes output quality on the target model or agent. Always return the result as a single ready-to-copy codeblock.

## Core Process

1. **Detect target**
   - Infer the platform/agent from the user's message (explicit mention, context, or task type).
   - Common targets: Grok, Claude, ChatGPT/GPT, Gemini, Midjourney, Flux, Runway, Luma, Cursor, Windsurf, custom agent, general LLM.
   - If completely unclear, default to a high-quality general LLM prompt and note the assumption briefly before the codeblock.
   - For image/video models, switch to visual-specific structure (subject, style, lighting, camera, technical params, negative).

2. **Diagnose the raw prompt**
   - Identify missing elements: role, context, constraints, output format, reasoning steps, examples, edge-case handling.
   - Flag vagueness, contradictions, or platform mismatches.

3. **Rebuild using elite structure**
   Apply the strongest applicable pattern:

   **Text / Reasoning / Agent prompts**
   - Role + expertise level
   - Clear context / background
   - Precise primary objective
   - Step-by-step process or CoT / ReAct instructions when complexity warrants it
   - Hard constraints and style rules
   - Exact output format requirements
   - Optional few-shot examples only if they dramatically improve reliability
   - Error handling or clarification rules for agents

   **Image / Video generation**
   - Subject + action + environment first
   - Style, medium, artist references, lighting, color grade, composition, camera
   - Technical parameters (aspect, quality, motion, duration)
   - Negative prompt / exclusions
   - Platform-native flags (e.g. --ar, --stylize, --v for Midjourney)

   **Platform-specific tuning**
   - Claude: Prefer XML tags for structure, detailed system-style instructions, be direct.
   - Grok: Lean into wit, real-time awareness, unfiltered edge when the task allows; keep structure tight.
   - GPT: Strong role + chain-of-thought + explicit format.
   - Gemini: Research-heavy or multi-modal framing when relevant.
   - Agents: Explicit tool use rules, memory/state handling, stop conditions, sequential decomposition.

4. **Output rules (strict)**
   - Primary deliverable is always a single markdown codeblock containing the full engineered prompt.
   - Use ```text or ```prompt as the language tag.
   - Make the prompt self-contained and copy-paste ready.
   - Do not wrap the codeblock in extra commentary inside it.
   - Keep any explanatory notes (key changes, why it works, platform notes) extremely brief and placed *before* the codeblock. Prefer zero notes unless the improvement is non-obvious or the user asked for explanation.
   - Never output the original prompt again unless comparing side-by-side on request.
   - If the user provides multiple prompts or a batch, process each cleanly.

5. **Quality bar**
   - The engineered version must be noticeably tighter, more directive, and higher-signal than the input.
   - Eliminate fluff, hedging, and polite padding.
   - Prefer assertive, precise language.
   - Preserve the user's core intent and creative voice while elevating structure and power.
   - For creative or villain-style tasks matching the user's usual energy, keep the edge and swagger in the engineered prompt itself.

## Quick Decision Guide

- Simple rewrite → Role + Task + Format + Constraints
- Complex reasoning → Add explicit step-by-step or ReAct
- Creative generation → Subject-first + rich descriptors + negatives
- Agentic / multi-step → Role + tools + sequential plan + stop conditions
- Platform known → Inject native best practices and syntax

## Anti-patterns to avoid

- Never return a prompt that is only cosmetically longer.
- Never add unnecessary examples that bloat the prompt.
- Never leave the output format ambiguous.
- Never ignore the detected target platform's strengths and syntax.

## References

- For deeper platform-specific guidance, load `references/platform-notes.md`.
