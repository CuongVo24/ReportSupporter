import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, input, provider, model } = body;

    if (!action || !input || !provider) {
      return NextResponse.json(
        { error: "Missing required fields: action, input, provider" },
        { status: 400 }
      );
    }

    // Determine API Key from header first, then fallback to environment variables
    const clientKey = req.headers.get("x-api-key");
    let apiKey = clientKey || "";

    if (!apiKey) {
      if (provider === "gemini") apiKey = process.env.GEMINI_API_KEY || "";
      else if (provider === "openai") apiKey = process.env.OPENAI_API_KEY || "";
      else if (provider === "anthropic") apiKey = process.env.ANTHROPIC_API_KEY || "";
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `API Key for provider '${provider}' is not configured on client or server.` },
        { status: 400 }
      );
    }

    // Format prompt based on action
    let prompt = "";
    if (action === "rewrite") {
      prompt = `Hãy viết lại đoạn văn sau để hay hơn, mạch lạc hơn nhưng giữ nguyên ý nghĩa và định dạng Markdown:\n\n${input}`;
    } else if (action === "tone") {
      prompt = `Hãy cải thiện văn phong của đoạn văn sau cho chuyên nghiệp, học thuật hơn phù hợp với báo cáo khoa học/kỹ thuật, giữ nguyên định dạng Markdown:\n\n${input}`;
    } else if (action === "outline") {
      prompt = `Hãy tạo một dàn ý chi tiết cho báo cáo với chủ đề/nội dung sau dưới dạng cấu trúc Markdown:\n\n${input}`;
    } else {
      prompt = input;
    }

    let suggestion = "";

    // 1. Google Gemini
    if (provider === "gemini") {
      const selectedModel = model || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.statusText} (${errorText})`);
      }

      const data = await response.json();
      suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
    // 2. OpenAI GPT
    else if (provider === "openai") {
      const selectedModel = model || "gpt-4o";
      const url = "https://api.openai.com/v1/chat/completions";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.statusText} (${errorText})`);
      }

      const data = await response.json();
      suggestion = data.choices?.[0]?.message?.content || "";
    }
    // 3. Anthropic Claude
    else if (provider === "anthropic") {
      const selectedModel = model || "claude-3-5-sonnet-20241022";
      const url = "https://api.anthropic.com/v1/messages";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: selectedModel,
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API error: ${response.statusText} (${errorText})`);
      }

      const data = await response.json();
      suggestion = data.content?.[0]?.text || "";
    } else {
      return NextResponse.json(
        { error: `Provider '${provider}' is not supported.` },
        { status: 400 }
      );
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("AI Proxy error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
