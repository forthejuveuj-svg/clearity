import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY on server" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const model = typeof body.model === "string" ? body.model : "gpt-4o-mini";
    const temperature =
      typeof body.temperature === "number" ? body.temperature : 0.3;
    const maxTokens = typeof body.maxTokens === "number" ? body.maxTokens : 2000;

    if (!prompt.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });

    const completion = await client.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (err) {
    const message =
      err?.message ||
      (typeof err === "string" ? err : "Unknown error calling OpenAI");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

