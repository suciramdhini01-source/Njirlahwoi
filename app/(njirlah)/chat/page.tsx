'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Plus, ChevronDown, Settings, Trash2, MessageSquare, Paperclip, Mic, Code, Lightbulb, BookOpen, Globe, Cpu, Zap } from 'lucide-react';

const PRESET_MODELS = [
  { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', color: '#c96442', badge: 'Rekomendasi' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', color: '#10a37f', badge: '' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', color: '#4285f4', badge: '' },
  { id: 'llama-3.1-8b-free', name: 'Llama 3.1 8B', provider: 'Meta (gratis)', color: '#0866ff', badge: 'Gratis' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', color: '#4d6bfe', badge: 'Baru' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', color: '#f7a130', badge: '' },
];

const PROMPT_SUGGESTIONS = [
  { icon: <Code className="w-4 h-4" />, text: 'Buat komponen React untuk tabel data', category: 'Kode' },
  { icon: <Lightbulb className="w-4 h-4" />, text: 'Jelaskan quantum computing dengan bahasa sederhana', category: 'Belajar' },
  { icon: <BookOpen className="w-4 h-4" />, text: 'Rangkum artikel ini untuk saya', category: 'Rangkum' },
  { icon: <Globe className="w-4 h-4" />, text: 'Terjemahkan teks ini ke bahasa Inggris', category: 'Terjemah' },
  { icon: <Cpu className="w-4 h-4" />, text: 'Debug fungsi Python ini', category: 'Kode' },
  { icon: <MessageSquare className="w-4 h-4" />, text: 'Bantu saya tulis email profesional', category: 'Tulis' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
        isUser ? 'bg-[#6467F2] text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {isUser ? 'K' : <Zap className="w-3.5 h-3.5" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isUser ? 'bg-[#6467F2] text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
      }`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.model && !isUser && (
          <p className="text-[10px] text-gray-400 mt-1">{message.model}</p>
        )}
      </div>
    </div>
  );
}

export default function NJChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(PRESET_MODELS[0]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createChat = () => {
    const id = crypto.randomUUID();
    const chat: Chat = { id, title: 'Chat baru', messages: [], createdAt: new Date() };
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(id);
    setShowPresets(true);
    return id;
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input.trim();
    setInput('');

    let chatId = activeChatId;
    if (!chatId) chatId = createChat();

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date() };

    setChats((prev) => prev.map((c) =>
      c.id === chatId
        ? { ...c, title: c.messages.length === 0 ? content.slice(0, 40) : c.title, messages: [...c.messages, userMsg] }
        : c
    ));
    setShowPresets(false);
    setIsStreaming(true);

    await new Promise((r) => setTimeout(r, 900));

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Ini adalah tampilan demo NJIRLAH AI Chat. Untuk menggunakan AI sungguhan, masukkan API key OpenRouter atau Cloudflare Workers AI kamu di pengaturan.\n\nModel yang dipilih: **${selectedModel.name}** oleh ${selectedModel.provider}\n\nBuka halaman utama aplikasi di "/" untuk mulai chat dengan model AI sesungguhnya menggunakan kunci API milikmu sendiri.`,
      model: selectedModel.name,
      timestamp: new Date(),
    };

    setChats((prev) => prev.map((c) =>
      c.id === chatId ? { ...c, messages: [...c.messages, assistantMsg] } : c
    ));
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px'; }
  };

  return (
    <div className="pt-14 h-[calc(100vh-56px)] flex bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-gray-200 bg-white shrink-0">
        <div className="p-3">
          <button
            onClick={createChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Chat baru
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {chats.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-gray-400">
              Belum ada percakapan.<br />Mulai chat baru di atas.
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => { setActiveChatId(chat.id); setShowPresets(chat.messages.length === 0); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors group ${activeChatId === chat.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="flex-1 text-xs text-gray-700 truncate">{chat.title}</span>
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-500 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    setChats((prev) => prev.filter((c) => c.id !== chat.id));
                    if (activeChatId === chat.id) setActiveChatId(null);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
            ))
          )}
        </div>

        {/* Model selector */}
        <div className="p-3 border-t border-gray-100">
          <div className="relative">
            <button
              onClick={() => setModelPickerOpen(!modelPickerOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-700 hover:border-gray-300 transition-colors bg-white"
            >
              <div className="w-4 h-4 rounded flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{ backgroundColor: selectedModel.color }}>
                {selectedModel.provider[0]}
              </div>
              <span className="flex-1 text-left truncate">{selectedModel.name}</span>
              <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
            </button>
            {modelPickerOpen && (
              <div className="absolute bottom-full mb-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                {PRESET_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m); setModelPickerOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${selectedModel.id === m.id ? 'bg-[#6467F2]/5' : ''}`}
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{ backgroundColor: m.color }}>
                      {m.provider[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 truncate">{m.name}</div>
                      <div className="text-[10px] text-gray-400">{m.provider}</div>
                    </div>
                    {m.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        m.badge === 'Gratis' ? 'bg-green-100 text-green-700' :
                        m.badge === 'Baru' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{m.badge}</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 p-2">
                  <Link href="/" className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#6467F2] hover:bg-[#6467F2]/5 rounded-md transition-colors">
                    <Zap className="w-3 h-3" />
                    Buka NJIRLAH AI penuh (BYOK)
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200 shrink-0">
          <span className="text-sm font-medium text-gray-900 truncate">
            {activeChat?.title ?? 'Chat baru'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModelPickerOpen(!modelPickerOpen)}
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:border-gray-300 transition-colors"
            >
              <div className="w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: selectedModel.color }}>
                {selectedModel.provider[0]}
              </div>
              {selectedModel.name}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {showPresets || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-8">
              <div className="w-12 h-12 rounded-2xl bg-[#6467F2]/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#6467F2]" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Ada yang bisa dibantu?</h2>
              <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">
                Menggunakan <span className="font-medium text-gray-700">{selectedModel.name}</span> oleh {selectedModel.provider}
              </p>

              {/* Model presets */}
              <div className="w-full max-w-xl mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 text-center">Pilih model cepat</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedModel(m)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${
                        selectedModel.id === m.id ? 'border-[#6467F2] bg-[#6467F2]/5 ring-1 ring-[#6467F2]/20' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.color }}>
                        {m.provider[0]}
                      </div>
                      <span className="text-[9px] text-gray-600 text-center leading-tight line-clamp-2">
                        {m.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="w-full max-w-xl">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 text-center">Coba tanyakan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => setInput(s.text)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-gray-200 text-left hover:border-[#6467F2]/40 hover:bg-[#6467F2]/5 transition-all group"
                    >
                      <span className="text-gray-400 group-hover:text-[#6467F2] transition-colors shrink-0">{s.icon}</span>
                      <span className="text-xs text-gray-600 group-hover:text-gray-900 transition-colors leading-snug">{s.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-5">
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
              {isStreaming && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 shrink-0">
                    <Zap className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 px-4 py-3 bg-white shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 p-3 rounded-2xl border border-gray-200 focus-within:border-[#6467F2] focus-within:ring-2 focus-within:ring-[#6467F2]/20 transition-all bg-white shadow-sm">
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 mb-0.5">
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                placeholder={`Kirim pesan ke ${selectedModel.name}...`}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed min-h-[24px] max-h-[200px]"
              />
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 mb-0.5">
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming}
                className={`p-2 rounded-xl transition-all mb-0.5 shrink-0 ${
                  input.trim() && !isStreaming ? 'bg-[#6467F2] text-white hover:bg-[#5558e8] shadow-sm' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              AI dapat membuat kesalahan. Verifikasi informasi penting.{' '}
              <Link href="/" className="text-[#6467F2] hover:underline">Gunakan NJIRLAH AI penuh</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
