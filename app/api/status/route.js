import { groqEnabled, groqModel } from "../../../lib/groq";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ai: groqEnabled(), provider: "groq", model: groqEnabled() ? groqModel() : null });
}
