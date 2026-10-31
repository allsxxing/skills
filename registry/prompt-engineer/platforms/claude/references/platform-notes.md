# Platform-Specific Prompt Notes

## Grok
- Strong real-time and X awareness when relevant.
- Responds well to direct, high-agency, witty, or irreverent framing.
- Use clear structure; Grok handles long context well.
- For creative/meme/DFS tasks, lean into swagger and precision.

## Claude
- Excel with XML-tagged sections: <role>, <task>, <constraints>, <output_format>.
- Prefers detailed, explicit instructions and long coherent context.
- Strong at following complex multi-step and ethical/constraint rules.

## GPT / ChatGPT
- Classic role + task + steps + format works extremely well.
- Explicit "think step by step" or structured reasoning still helps on harder tasks.
- JSON mode or clear schema instructions when structured output is needed.

## Gemini
- Benefits from research-oriented framing and multi-modal awareness.
- Good with long context and factual grounding instructions.

## Midjourney / Flux / Image models
- Front-load subject and key visual descriptors.
- Separate style, lighting, composition, camera.
- Always consider negatives / what to avoid.
- Use platform parameters natively (--ar, --stylize, --v, --q, etc.).

## Agentic systems (Cursor, custom agents, ReAct)
- Define available tools and when to use them.
- Require explicit reasoning before action.
- Include stop conditions and clarification rules.
- Maintain state / memory instructions if multi-turn.
