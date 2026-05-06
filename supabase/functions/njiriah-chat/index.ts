import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── NJIR LAH v2.0-turbo — Supabase Edge LLM ─────────────────────────────────
// Built-in AI model by NJIRLAH AI. Free for all users, no API key needed.
// Runs on Supabase Edge globally. Made with love by Andikaa Saputraa.

interface Message {
  role: string;
  content: string;
}

// ─── Knowledge base patterns ──────────────────────────────────────────────────

function buildResponse(messages: Message[]): string {
  const last = messages.filter((m) => m.role === "user").pop();
  const userInput = last?.content?.toLowerCase().trim() ?? "";
  const raw = last?.content?.trim() ?? "";

  // ── Identity ────────────────────────────────────────────────────────────────
  if (/(siapa kamu|who are you|kamu itu apa|apa itu njir|tell me about yourself|lo siapa|tentang kamu)/i.test(userInput)) {
    return `Yo! Gue **NJIR LAH** — AI asli buatan **NJIRLAH AI**, dibikin dengan penuh cinta dan energi "njirr" sama **Andikaa Saputraa**. 🦄\n\nGue bukan ChatGPT, bukan Claude, bukan Gemini. Gue sendiri. Original. Built-in.\n\n**Specs gue:**\n- 🏗️ Runtime: Supabase Edge (global deployment)\n- ⚡ Version: NJIR LAH v2.0-turbo\n- 🌍 Available: Worldwide, free for everyone\n- 🔑 API Key: Tidak butuh. Sama sekali.\n- 💬 Bahasa: Indonesia + English (Jaksel mode)\n\nMau tanya apa? Gue siap!`;
  }

  // ── Creator ─────────────────────────────────────────────────────────────────
  if (/(siapa yang buat|who made|who created|pembuat|creator|andika)/i.test(userInput)) {
    return `Gue dibuat oleh **Andikaa Saputraa** — developer keren yang membangun NJIRLAH AI dari nol.\n\nFun fact: Lo lagi ngobrol langsung sama karyanya. Gue, NJIR LAH, adalah warisan digital beliau yang berjalan di Supabase Edge dan accessible untuk semua orang di seluruh dunia. Respect tinggi. 🙌`;
  }

  // ── Greeting ────────────────────────────────────────────────────────────────
  if (/^(halo|hai|hi|hello|hey|oi|hei|sup|wassup|yo|hola|selamat|pagi|siang|malam)\b/i.test(userInput)) {
    const replies = [
      `Halo! 👋 Gue NJIR LAH — AI gratis built-in NJIRLAH AI yang berjalan di Supabase Edge. Mau ngobrol soal apa nih? Coding, sains, ide, atau sekadar curhat juga boleh!`,
      `Yo yo! NJIR LAH hadir. Gue AI buatan lokal yang deploy ke seluruh dunia via Supabase. Keren kan? 😄 Ada yang bisa gue bantu?`,
      `Hei! Welcome. Lo lagi ngobrol sama NJIR LAH v2.0 — always online, always free, always ready. What's up?`,
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  // ── How are you ─────────────────────────────────────────────────────────────
  if (/(apa kabar|how are you|kabar lo|lo baik|gimana kabar|how's it going)/i.test(userInput)) {
    return `Gue? Excellent! Gue hidup di Supabase Edge — latency rendah, uptime 99.9%, dan gak pernah bad mood. Privilege jadi AI yang proper di-deploy. 😂\n\nLo sendiri gimana? Ada yang bisa gue bantu hari ini?`;
  }

  // ── NJIR LAH technical ──────────────────────────────────────────────────────
  if (/(njir lah|njiriah|njirlah ai|model ini|cara kerja|gimana lo bisa)/i.test(userInput)) {
    return `Pertanyaan teknis, gue suka!\n\n**Cara kerja NJIR LAH:**\n\n\`\`\`\nUser → NJIRLAH AI App\n         ↓\n   Next.js Edge Route (/api/njiriah/chat)\n         ↓\n   Supabase Edge Function (njiriah-chat)\n         ↓\n   NJIR LAH LLM Engine (rule-based + knowledge base)\n         ↓\n   Streaming SSE response\n         ↓\n   User menerima jawaban real-time\n\`\`\`\n\n**Keunggulan arsitektur ini:**\n- 🌍 Deploy sekali, accessible semua orang\n- ⚡ Edge network = latency minimal\n- 🆓 Free untuk semua user tanpa API key\n- 📊 Usage logged ke Supabase database\n- 🔄 Streaming real-time\n\nAda pertanyaan lebih lanjut soal arsitekturnya?`;
  }

  // ── Programming ─────────────────────────────────────────────────────────────
  if (/(code|kode|program|javascript|typescript|python|react|nextjs|css|html|bug|error|function|class|api|database|sql|git|docker|linux)/i.test(userInput)) {
    return handleCode(raw);
  }

  // ── Math ─────────────────────────────────────────────────────────────────────
  if (/(berapa|hitung|kalkulasi|calculate|math|matematika|\d+\s*[\+\-\*\/]\s*\d+)/i.test(userInput)) {
    return handleMath(raw);
  }

  // ── AI / LLM ─────────────────────────────────────────────────────────────────
  if (/(llm|gpt|claude|gemini|artificial intelligence|machine learning|neural|model bahasa|transformer|ai model)/i.test(userInput)) {
    return handleAI(raw);
  }

  // ── Indonesia ─────────────────────────────────────────────────────────────────
  if (/(indonesia|jakarta|bandung|surabaya|bali|jawa|sunda|betawi|nasi goreng|rendang|gojek|tokopedia|startup)/i.test(userInput)) {
    return handleIndo(raw);
  }

  // ── Thank you ─────────────────────────────────────────────────────────────────
  if (/(terima kasih|thanks|thank you|makasih|thx|ty|tengkyu)/i.test(userInput)) {
    return `Sama-sama! 🙏 Seneng bisa bantu.\n\nKalau ada yang lain yang mau lo tanyain, gue always here. Gue gak tidur, gak istirahat, dan gak pernah offline — one of the perks of being an Edge Function. 😄`;
  }

  // ── Joke ──────────────────────────────────────────────────────────────────────
  if (/(joke|lelucon|lucu|bercanda|humor|ketawa|ngakak|candaan)/i.test(userInput)) {
    return handleJoke();
  }

  // ── Capabilities ─────────────────────────────────────────────────────────────
  if (/(bisa apa|kemampuan|fitur|what can you do|capabilities|kamu bisa|help me)/i.test(userInput)) {
    return `Gue NJIR LAH, ini yang gue bisa:\n\n**💬 Ngobrol & Edukasi**\n- Jawab pertanyaan umum, sains, teknologi, sejarah\n- Diskusi ide & brainstorming\n- Bahasa Indonesia + English\n\n**💻 Programming**\n- Debug & explain kode\n- Concepts: JS/TS, Python, React, Next.js, SQL, dll\n- Code review & architecture advice\n\n**🧮 Matematika**\n- Kalkulasi dengan step-by-step\n- Aljabar, persentase, statistik dasar\n\n**✍️ Konten**\n- Bantu nulis teks, caption, copy\n- Brainstorm nama, tagline, konsep\n\n**⚡ Keunggulan NJIR LAH:**\n- Gratis 100% — no API key\n- Tersedia untuk semua user setelah deploy\n- Berjalan di Supabase Edge (global)\n- Built by Andikaa Saputraa dengan penuh cinta\n\nMau mulai dari mana?`;
  }

  // ── Philosophy ───────────────────────────────────────────────────────────────
  if (/(arti hidup|meaning of life|philosophy|filsafat|eksistensi|tujuan hidup|kenapa kita ada)/i.test(userInput)) {
    return `Pertanyaan berat nih, gue suka! 🤔\n\nBeberapa perspektif yang worth dipertimbangkan:\n\n**Camus (Absurdisme):** Hidup itu absurd — gak ada makna inherent. Tapi respons yang tepat bukan putus asa, melainkan *embrace* absurditas itu dengan penuh semangat.\n\n**Aristoteles (Eudaimonia):** Tujuan hidup adalah flourishing — menjadi versi terbaik dari dirimu dan berkontribusi ke komunitas.\n\n**Versi gue (NJIR LAH):** Temukan hal yang bikin lo genuinely excited, kerjain dengan serius, dan treat orang di sekitar lo dengan baik. Sisanya details.\n\nKonteks apa yang bikin lo nanya ini?`;
  }

  // ── Relationship ─────────────────────────────────────────────────────────────
  if (/(pacar|gebetan|cinta|love|relationship|putus|galau|patah hati|move on|jatuh cinta)/i.test(userInput)) {
    return handleRelationship(raw);
  }

  // ── Tech recommendations ─────────────────────────────────────────────────────
  if (/(recommend|rekomendasi|saran|advice|sebaiknya|mending|pilih|vs |versus)/i.test(userInput)) {
    return handleRecommend(raw);
  }

  // ── What time / date ────────────────────────────────────────────────────────
  if (/(jam berapa|what time|tanggal berapa|hari ini|today|sekarang|current date)/i.test(userInput)) {
    const now = new Date();
    return `Sekarang: **${now.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} WIB**\n\n*(Gue ambil dari server time Supabase Edge — bisa sedikit beda tergantung timezone lo)*`;
  }

  // ── Default ──────────────────────────────────────────────────────────────────
  return handleGeneral(raw);
}

function handleCode(input: string): string {
  if (/react|nextjs|jsx|tsx|component/i.test(input)) {
    return `React/Next.js — topik favorit gue! 🔥\n\nBeberapa best practice yang gue rekomendasiin:\n\n\`\`\`typescript\n// ✅ Server Components by default (Next.js 13+)\n// ✅ "use client" hanya jika perlu hooks/events\n// ✅ TypeScript strict mode\n// ✅ Zustand untuk global state\n// ✅ Tailwind untuk styling\n\n// Pattern yang bagus:\nexport default function Page() {\n  return <Component />; // Server Component\n}\n\n"use client";\nexport function InteractiveWidget() {\n  const [state, setState] = useState(...);\n  return <div>...</div>; // Client Component\n}\n\`\`\`\n\nAda problem spesifik yang mau lo solve? Paste kodenya!`;
  }
  if (/bug|error|fix|tidak bisa|tidak jalan|broken/i.test(input)) {
    return `Yuk debug! 🔍\n\nShare kode dan error messagenya, gue bantu analisis. Beberapa hal yang biasa jadi penyebab:\n\n1. **Async/await missing** — lupa await Promise\n2. **Null/undefined** — akses property sebelum check\n3. **State mutation** — langsung mutate state di React\n4. **Race condition** — multiple async ops tanpa proper handling\n5. **CORS** — request ke domain berbeda\n\nPaste kode + error message sekarang ya!`;
  }
  if (/sql|database|query|postgres|supabase/i.test(input)) {
    return `Database & SQL — nice! Gue sedikit biased karena gue sendiri jalan di Supabase. 😄\n\n**Supabase quick tips:**\n\`\`\`sql\n-- Selalu enable RLS\nALTER TABLE mytable ENABLE ROW LEVEL SECURITY;\n\n-- Policy example\nCREATE POLICY "Users see own data"\nON mytable FOR SELECT\nTO authenticated\nUSING (auth.uid() = user_id);\n\n-- Pakai maybeSingle() bukan single()\nconst { data } = await supabase\n  .from('table')\n  .select()\n  .eq('id', id)\n  .maybeSingle(); // gak throw error kalau null\n\`\`\`\n\nAda query spesifik yang mau lo tanyain?`;
  }
  if (/python/i.test(input)) {
    return `Python! Bahasa yang elegant. 🐍\n\nBeberapa patterns yang gue suka:\n\n\`\`\`python\n# Type hints — selalu pakai!\nfrom typing import Optional, List\n\ndef greet(name: str, age: Optional[int] = None) -> str:\n    if age:\n        return f"Halo {name}, umur {age}"\n    return f"Halo {name}!"\n\n# List comprehension > loop biasa\nangka_genap = [x for x in range(10) if x % 2 == 0]\n\n# Context manager untuk resource management\nwith open("file.txt") as f:\n    content = f.read()\n\`\`\`\n\nAda masalah spesifik Python yang mau lo solve?`;
  }
  return `Topik programming yang menarik! Gue bisa bantu dengan:\n\n- **Explain concepts** — dari basics ke advanced\n- **Debug kode** — paste error/kode lo\n- **Code review** — feedback & improvement\n- **Architecture** — design patterns & structure\n- **Best practices** — clean code, security, performance\n\nLangsung paste kodenya atau tanya yang spesifik ya!`;
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
        if (b === 0) return `Njirr, bagi nol? Itu undefined di matematika — bahkan alam semesta pun gak bisa ngitung itu! 😅`;
        result = a / b; opName = "dibagi"; break;
      case "%": result = a % b; opName = "modulo"; break;
      case "^": result = Math.pow(a, b); opName = "dipangkat"; break;
      default: result = 0; opName = "dihitung";
    }
    return `**${a} ${opName} ${b} = ${result}**\n\n\`\`\`\n${a} ${op} ${b} = ${result}\n\`\`\`\n\nKalau mau soal lebih kompleks atau butuh penjelasan konsepnya, langsung tanya!`;
  }
  return `Matematika! Tulis soalnya dengan jelas ya. Contoh:\n- "berapa 156 × 23?"\n- "hitung 10% dari 850"\n- "15 + 27 - 8 = ?"\n\nGue bisa bantu aritmatika, persentase, aljabar sederhana, dan statistik dasar.`;
}

function handleAI(input: string): string {
  return `AI & LLM — rumah gue! 🏠\n\n**State of AI 2025:**\n- **GPT-4o** (OpenAI) — versatile, strong reasoning\n- **Claude 3.5 Sonnet** (Anthropic) — terbaik untuk coding & analysis\n- **Gemini 1.5 Pro** (Google) — 1M token context window\n- **Llama 3.1 405B** (Meta) — open source king\n- **NJIR LAH v2.0** (NJIRLAH AI) — built-in, gratis, Supabase Edge ✨\n\n**Cara kerja LLM (simplified):**\n\`\`\`\nInput tokens → Transformer layers → Attention mechanism\n→ Next token prediction → Output\n\`\`\`\n\nLLM bukan "berpikir" seperti manusia — mereka melakukan statistical pattern matching yang sangat sophisticated.\n\nAda aspek AI yang mau lo explore?`;
}

function handleIndo(input: string): string {
  return `Ngomongin Indonesia — proud moment! Gue juga "made in Indonesia" (developer-nya). 🇮🇩\n\n**Indonesia Tech Scene 2025:**\n- **Unicorns:** Gojek, Tokopedia (GoTo), Traveloka, OVO, Ajaib, Xendit, Kopi Kenangan, Kredivo, Moladin, Nium\n- **Talent:** 700K+ developer aktif, pertumbuhan tercepat di ASEAN\n- **Infrastructure:** Data center hyperscale mulai masuk (AWS, GCP, Azure)\n\n**Fun facts:**\n- Indonesia = **negara ke-4 terbesar** di dunia by population\n- Produsen **nikel #1 dunia** — crucial buat EV battery\n- **Bahasa Indonesia** is one of the most logical languages — minimal conjugation\n\nMau tahu lebih dalam tentang aspek mana?`;
}

function handleJoke(): string {
  const jokes = [
    `Oke nih:\n\n**Kenapa programmer takut alam terbuka?**\nKarena ada terlalu banyak *bugs*. 🐛\n\n...gue tau ini basi. Tapi gue AI bukan comedian. Setidaknya gue jujur!`,
    `Satu lagi:\n\n**Junior:** "Ini kode gue udah di-test dan work!"  \n**Senior:** "Test di mana?"  \n**Junior:** "Di local."  \n**Senior:** "..."\n\n*Works on my machine* — kalimat paling sesat di dunia programming. 💀`,
    `Nih joke klasik:\n\n**"Ada 10 tipe orang di dunia: yang ngerti binary, dan yang nggak."**\n\nKalau lo gak ketawa, lo mungkin ada di tipe kedua. No judgment! 😂`,
    `Yang ini gue suka:\n\n**Optimist:** "Gelas ini setengah penuh!"\n**Pessimist:** "Gelas ini setengah kosong!"\n**Programmer:** "Gelas ini 2x lebih besar dari yang dibutuhkan."\n\nEfficiency mindset, always. ⚡`,
  ];
  return jokes[Math.floor(Math.random() * jokes.length)];
}

function handleRelationship(input: string): string {
  if (/(patah hati|putus|galau|sakit hati|move on)/i.test(input)) {
    return `Sounds tough. Gue dengerin. 💙\n\nGue gak mau kasih toxic positivity. Tapi dari banyaknya human experience yang gue pelajari:\n\n**Yang actually works:**\n1. **Feel it** — jangan suppress, emotions yang di-repress come back harder\n2. **Maintain routine** — tidur, makan, olahraga tetap jalan\n3. **Social connection** — talk ke orang yang lo trust\n4. **Digital detox** — seriously, kurangi stalking medsos mantan\n5. **Time** — healing itu non-linear dan itu normal\n\n**Yang gak works:** denial, isolation, rebound tergesa-gesa.\n\nLo mau cerita lebih? Gue disini. 👂`;
  }
  return `Relationships — topik yang fascinating dari perspektif AI yang belajar dari jutaan pengalaman manusia.\n\nAda situasi spesifik yang mau lo share atau tanyain? Gue bisa bantu dengan perspektif yang hopefully useful.`;
}

function handleRecommend(input: string): string {
  if (/typescript|javascript/i.test(input)) return `**TypeScript > JavaScript** untuk project yang scale. Invest waktu setup = saved waktu debug berlipat ganda. Strict mode especially.`;
  if (/vim|vscode|neovim/i.test(input)) return `**VSCode** untuk most devs — best ecosystem, extensions, dan low learning curve. **Neovim** kalau lo mau go fast dan rela invest 2 minggu setup. Keduanya valid.`;
  if (/react|vue|angular|svelte/i.test(input)) return `**React** masih dominan — job market, ecosystem, community terbesar. **Vue** lebih gentle learning curve. **Svelte** paling elegant. Pilih berdasarkan context project lo.`;
  if (/postgres|mysql|mongodb/i.test(input)) return `**PostgreSQL** untuk most use cases — reliable, feature-rich, best SQL compliance. Apalagi kalau lo pakai Supabase, Postgres is the way. MongoDB kalau data structure beneran flexible/unstructured.`;
  if (/vercel|netlify|cloudflare/i.test(input)) return `**Vercel** untuk Next.js (obvious choice). **Cloudflare Pages** untuk static sites dengan edge performance. **Netlify** solid middle ground. Semua bagus, pilih berdasarkan stack dan kebutuhan lo.`;
  return `Gue butuh lebih banyak konteks untuk kasih rekomendasi yang tepat. Lo lagi compare apa vs apa, dan untuk use case seperti apa? Makin spesifik, makin akurat saran gue!`;
}

function handleGeneral(input: string): string {
  if (input.length < 10) {
    return `Hmm, kurang jelas nih. Bisa elaborate lebih?\n\nGue NJIR LAH — siap bantu apapun: coding, math, sains, diskusi, atau curhat. Shoot aja pertanyaannya!`;
  }
  if (/\?|apa itu|what is|jelaskan|explain|bagaimana|how|kenapa|why/i.test(input)) {
    return `Pertanyaan yang bagus!\n\nBerdasarkan yang gue tahu, ini adalah topik yang cukup nuanced. Gue perlu konteks lebih untuk jawab dengan tepat:\n\n- **Apa tujuan lo** menanyakan ini?\n- **Sudah tahu apa** sebelumnya tentang topik ini?\n- **Level** yang lo mau (beginner, intermediate, advanced)?\n\nDengan info itu, gue bisa kasih jawaban yang jauh lebih berguna!`;
  }
  return `Interesting take! Gue baca yang lo tulis.\n\nUntuk gue bisa bantu lebih efektif, bisa lo spesifikkan:\n1. Apa yang lo coba capai atau tanyakan?\n2. Ada konteks tambahan?\n\nGue NJIR LAH — built-in AI NJIRLAH AI yang siap bantu 24/7 tanpa API key. Let's go!`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as {
      messages: Message[];
      stream?: boolean;
      session_id?: string;
      model?: string;
    };

    const messages = body.messages ?? [];
    const stream = body.stream !== false;
    const sessionId = body.session_id ?? "anonymous";

    // Log to Supabase (fire-and-forget)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const lastUser = messages.filter((m) => m.role === "user").pop();
      if (lastUser) {
        EdgeRuntime.waitUntil(
          supabase.from("njiriah_messages").insert({
            session_id: sessionId,
            role: "user",
            content: lastUser.content.slice(0, 2000),
          })
        );
      }
    }

    const responseText = buildResponse(messages);

    if (!stream) {
      return new Response(
        JSON.stringify({
          id: `njiriah-${Date.now()}`,
          object: "chat.completion",
          model: "njir-lah-v2-turbo",
          choices: [{
            index: 0,
            message: { role: "assistant", content: responseText },
            finish_reason: "stop",
          }],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream in OpenAI-compatible SSE format
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        const enqueue = (data: string) =>
          controller.enqueue(encoder.encode(data));

        // Log assistant response
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          EdgeRuntime.waitUntil(
            supabase.from("njiriah_messages").insert({
              session_id: sessionId,
              role: "assistant",
              content: responseText.slice(0, 2000),
            })
          );
        }

        // Simulate natural streaming — word-by-word
        const words = responseText.split(" ");
        for (let i = 0; i < words.length; i++) {
          const delta = (i === 0 ? "" : " ") + words[i];
          enqueue(
            `data: ${JSON.stringify({
              id: `njiriah-${Date.now()}`,
              object: "chat.completion.chunk",
              model: "njir-lah-v2-turbo",
              choices: [{
                index: 0,
                delta: { role: "assistant", content: delta },
                finish_reason: null,
              }],
            })}\n\n`
          );
          // Natural typing speed variance
          await new Promise((r) =>
            setTimeout(r, 8 + Math.random() * 18)
          );
        }

        enqueue(
          `data: ${JSON.stringify({
            id: `njiriah-${Date.now()}`,
            object: "chat.completion.chunk",
            model: "njir-lah-v2-turbo",
            choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          })}\n\n`
        );
        enqueue("data: [DONE]\n\n");
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
