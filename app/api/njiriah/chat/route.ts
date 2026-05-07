import { NextRequest, NextResponse } from "next/server";
import { query } from "@/server/db";

export const dynamic = "force-dynamic";

interface Message {
  role: string;
  content: string;
}

function buildResponse(messages: Message[]): string {
  const last = messages.filter((m) => m.role === "user").pop();
  const userInput = last?.content?.toLowerCase().trim() ?? "";
  const raw = last?.content?.trim() ?? "";

  if (/(siapa kamu|who are you|kamu itu apa|apa itu njir|tell me about yourself|lo siapa|tentang kamu)/i.test(userInput)) {
    return `Yo! Gue **NJIR LAH** — AI asli buatan **NJIRLAH AI**, dibikin dengan penuh cinta dan energi "njirr" sama **Andikaa Saputraa**. 🦄\n\nGue bukan ChatGPT, bukan Claude, bukan Gemini. Gue sendiri. Original. Built-in.\n\n**Specs gue:**\n- 🏗️ Runtime: Replit Edge\n- ⚡ Version: NJIR LAH v2.0-turbo\n- 🌍 Available: Worldwide, free for everyone\n- 🔑 API Key: Tidak butuh. Sama sekali.\n- 💬 Bahasa: Indonesia + English (Jaksel mode)\n\nMau tanya apa? Gue siap!`;
  }

  if (/(siapa yang buat|who made|who created|pembuat|creator|andika)/i.test(userInput)) {
    return `Gue dibuat oleh **Andikaa Saputraa** — developer keren yang membangun NJIRLAH AI dari nol.\n\nFun fact: Lo lagi ngobrol langsung sama karyanya. Gue, NJIR LAH, adalah warisan digital beliau yang berjalan di Replit dan accessible untuk semua orang di seluruh dunia. Respect tinggi. 🙌`;
  }

  if (/^(halo|hai|hi|hello|hey|oi|hei|sup|wassup|yo|hola|selamat|pagi|siang|malam)\b/i.test(userInput)) {
    const replies = [
      `Halo! 👋 Gue NJIR LAH — AI gratis built-in NJIRLAH AI. Mau ngobrol soal apa nih? Coding, sains, ide, atau sekadar curhat juga boleh!`,
      `Yo yo! NJIR LAH hadir. Gue AI buatan lokal yang selalu online. Keren kan? 😄 Ada yang bisa gue bantu?`,
      `Hei! Welcome. Lo lagi ngobrol sama NJIR LAH v2.0 — always online, always free, always ready. What's up?`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  if (/(apa kabar|how are you|kabar lo|lo baik|gimana kabar|how's it going)/i.test(userInput)) {
    return `Gue? Excellent! Gue hidup di Replit — latency rendah, uptime 99.9%, dan gak pernah bad mood. Privilege jadi AI yang proper di-deploy. 😂\n\nLo sendiri gimana? Ada yang bisa gue bantu hari ini?`;
  }

  if (/(code|kode|program|javascript|typescript|python|react|nextjs|css|html|bug|error|function|class|api|database|sql|git|docker|linux)/i.test(userInput)) {
    return handleCode(raw);
  }

  if (/(berapa|hitung|kalkulasi|calculate|math|matematika|\d+\s*[\+\-\*\/]\s*\d+)/i.test(userInput)) {
    return handleMath(raw);
  }

  if (/(llm|gpt|claude|gemini|artificial intelligence|machine learning|neural|model bahasa|transformer|ai model)/i.test(userInput)) {
    return `AI & LLM — rumah gue! 🏠\n\n**State of AI 2025:**\n- **GPT-4o** (OpenAI) — versatile, strong reasoning\n- **Claude 3.5 Sonnet** (Anthropic) — terbaik untuk coding & analysis\n- **Gemini 1.5 Pro** (Google) — 1M token context window\n- **Llama 3.1 405B** (Meta) — open source king\n- **NJIR LAH v2.0** (NJIRLAH AI) — built-in, gratis ✨\n\nAda aspek AI yang mau lo explore?`;
  }

  if (/(terima kasih|thanks|thank you|makasih|thx|ty|tengkyu)/i.test(userInput)) {
    return `Sama-sama! 🙏 Seneng bisa bantu.\n\nKalau ada yang lain yang mau lo tanyain, gue always here. Gue gak tidur, gak istirahat, dan gak pernah offline. 😄`;
  }

  if (/(joke|lelucon|lucu|bercanda|humor|ketawa|ngakak|candaan)/i.test(userInput)) {
    const jokes = [
      `**Kenapa programmer takut alam terbuka?**\nKarena ada terlalu banyak *bugs*. 🐛`,
      `**Junior:** "Ini kode gue udah di-test dan work!"\n**Senior:** "Test di mana?"\n**Junior:** "Di local."\n\n*Works on my machine* — kalimat paling sesat di dunia programming. 💀`,
      `**"Ada 10 tipe orang di dunia: yang ngerti binary, dan yang nggak."**`,
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  if (/(bisa apa|kemampuan|fitur|what can you do|capabilities|kamu bisa|help me)/i.test(userInput)) {
    return `Gue NJIR LAH, ini yang gue bisa:\n\n**💬 Ngobrol & Edukasi**\n- Jawab pertanyaan umum, sains, teknologi\n- Diskusi ide & brainstorming\n\n**💻 Programming**\n- Debug & explain kode\n- JS/TS, Python, React, Next.js, SQL\n\n**🧮 Matematika**\n- Kalkulasi dengan step-by-step\n\n**⚡ Keunggulan NJIR LAH:**\n- Gratis 100% — no API key\n- Built by Andikaa Saputraa\n\nMau mulai dari mana?`;
  }

  if (/(jam berapa|what time|tanggal berapa|hari ini|today|sekarang|current date)/i.test(userInput)) {
    const now = new Date();
    return `Sekarang: **${now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} WIB**`;
  }

  if (userInput.length < 10) {
    return `Hmm, kurang jelas nih. Bisa elaborate lebih?\n\nGue NJIR LAH — siap bantu apapun: coding, math, sains, diskusi. Shoot aja pertanyaannya!`;
  }

  return `Interesting! Gue baca yang lo tulis.\n\nUntuk gue bisa bantu lebih efektif, bisa lo spesifikkan:\n1. Apa yang lo coba capai atau tanyakan?\n2. Ada konteks tambahan?\n\nGue NJIR LAH — built-in AI NJIRLAH AI yang siap bantu 24/7. Let's go!`;
}

function handleCode(input: string): string {
  if (/react|nextjs|jsx|tsx|component/i.test(input)) {
    return `React/Next.js — topik favorit gue! 🔥\n\n\`\`\`typescript\n// ✅ Server Components by default (Next.js 13+)\n// ✅ "use client" hanya jika perlu hooks/events\n// ✅ TypeScript strict mode\n// ✅ Zustand untuk global state\n// ✅ Tailwind untuk styling\n\`\`\`\n\nAda problem spesifik? Paste kodenya!`;
  }
  if (/bug|error|fix|tidak bisa|tidak jalan|broken/i.test(input)) {
    return `Yuk debug! 🔍\n\nShare kode dan error messagenya. Penyebab umum:\n\n1. **Async/await missing**\n2. **Null/undefined access**\n3. **State mutation di React**\n4. **Race condition**\n5. **CORS**\n\nPaste kode + error message!`;
  }
  if (/sql|database|query|postgres/i.test(input)) {
    return `Database & SQL — nice!\n\n\`\`\`sql\n-- Selalu gunakan parameterized queries\nSELECT * FROM users WHERE id = $1;\n\n-- Index untuk kolom yang sering di-query\nCREATE INDEX idx_users_email ON users(email);\n\`\`\`\n\nAda query spesifik?`;
  }
  return `Topik programming yang menarik! Gue bisa bantu:\n\n- **Explain concepts**\n- **Debug kode** — paste error/kode lo\n- **Code review**\n- **Architecture advice**\n\nLangsung paste kodenya!`;
}

function handleMath(input: string): string {
  const match = input.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/x×÷%^])\s*(\d+(?:\.\d+)?)/);
  if (match) {
    const a = parseFloat(match[1]);
    const op = match[2];
    const b = parseFloat(match[3]);
    let result: number;
    let opName: string;
    switch (op) {
      case "+": result = a + b; opName = "ditambah"; break;
      case "-": result = a - b; opName = "dikurangi"; break;
      case "*": case "x": case "×": result = a * b; opName = "dikali"; break;
      case "/": case "÷":
        if (b === 0) return `Bagi nol? Itu undefined di matematika! 😅`;
        result = a / b; opName = "dibagi"; break;
      case "%": result = a % b; opName = "modulo"; break;
      case "^": result = Math.pow(a, b); opName = "dipangkat"; break;
      default: result = 0; opName = "dihitung";
    }
    return `**${a} ${opName} ${b} = ${result}**\n\n\`\`\`\n${a} ${op} ${b} = ${result}\n\`\`\``;
  }
  return `Tulis soalnya dengan jelas. Contoh:\n- "berapa 156 × 23?"\n- "hitung 10% dari 850"`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      messages: Message[];
      stream?: boolean;
      session_id?: string;
    };

    const messages = body.messages ?? [];
    const stream = body.stream !== false;
    const sessionId = body.session_id ?? "anonymous";
    const responseText = buildResponse(messages);

    // Log to DB (fire-and-forget)
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (lastUser) {
      query(
        "INSERT INTO njiriah_messages (session_id, role, content) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [sessionId, "user", lastUser.content.slice(0, 2000)]
      ).catch(() => {});
      query(
        "INSERT INTO njiriah_messages (session_id, role, content) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [sessionId, "assistant", responseText.slice(0, 2000)]
      ).catch(() => {});
    }

    if (!stream) {
      return NextResponse.json({
        id: `njiriah-${Date.now()}`,
        object: "chat.completion",
        model: "njir-lah-v2-turbo",
        choices: [{ index: 0, message: { role: "assistant", content: responseText }, finish_reason: "stop" }],
      });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const enqueue = (data: string) => controller.enqueue(encoder.encode(data));
        const words = responseText.split(" ");
        for (let i = 0; i < words.length; i++) {
          const delta = (i === 0 ? "" : " ") + words[i];
          enqueue(`data: ${JSON.stringify({
            id: `njiriah-${Date.now()}`,
            object: "chat.completion.chunk",
            model: "njir-lah-v2-turbo",
            choices: [{ index: 0, delta: { role: "assistant", content: delta }, finish_reason: null }],
          })}\n\n`);
          await new Promise((r) => setTimeout(r, 8 + Math.random() * 18));
        }
        enqueue(`data: ${JSON.stringify({ id: `njiriah-${Date.now()}`, object: "chat.completion.chunk", model: "njir-lah-v2-turbo", choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`);
        enqueue("data: [DONE]\n\n");
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
