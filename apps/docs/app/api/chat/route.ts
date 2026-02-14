import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { convertToModelMessages, streamText } from "ai";

import { ProvideLinksToolSchema } from "@/lib/inkeep-qa-schema";

export const runtime = "edge";

export async function POST(req: Request) {
  const apiKey = process.env.INKEEP_API_KEY;
  if (!apiKey) {
    return new Response(null, { status: 204 });
  }

  const openai = createOpenAICompatible({
    name: "inkeep",
    apiKey,
    baseURL: "https://api.inkeep.com/v1",
  });

  const reqJson = await req.json();

  const result = streamText({
    model: openai("inkeep-qa-sonnet-4"),
    tools: {
      provideLinks: {
        inputSchema: ProvideLinksToolSchema,
      },
    },
    messages: await convertToModelMessages(reqJson.messages, {
      ignoreIncompleteToolCalls: true,
    }),
    toolChoice: "auto",
  });

  return result.toUIMessageStreamResponse();
}
