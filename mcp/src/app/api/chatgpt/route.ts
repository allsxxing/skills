// /api/chatgpt: the registry plus the "search" and "fetch" tools ChatGPT connectors require.
// Those two names are deliberately generic, so they live here instead of crowding the tool list
// that Claude, Gemini, Grok and Perplexity see on /api/mcp. Key handling is identical.
import { preflight, serve } from "@/lib/handler";

const handle = (request: Request) => serve(request, { chatgpt: true });

export const OPTIONS = preflight;

export function HEAD(): Response {
  return new Response(null, { status: 200 });
}

export { handle as GET, handle as POST, handle as DELETE };
