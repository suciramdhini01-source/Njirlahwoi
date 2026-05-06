import { NextRequest, NextResponse } from "next/server";

// Lucide icon keyword map — lightweight static registry
const LUCIDE_ICONS: Record<string, string[]> = {
  home: ["Home", "House"],
  user: ["User", "UserCircle", "UserRound"],
  settings: ["Settings", "Settings2", "SlidersHorizontal"],
  search: ["Search", "SearchCode", "SearchCheck"],
  chat: ["MessageCircle", "MessageSquare", "MessagesSquare"],
  mail: ["Mail", "MailOpen", "Send"],
  bell: ["Bell", "BellRing", "BellOff"],
  heart: ["Heart", "HeartHandshake"],
  star: ["Star", "StarHalf"],
  check: ["Check", "CheckCircle", "CheckCircle2", "CheckSquare"],
  x: ["X", "XCircle", "XSquare"],
  plus: ["Plus", "PlusCircle", "PlusSquare"],
  minus: ["Minus", "MinusCircle"],
  edit: ["Pencil", "PenLine", "Edit3", "Edit"],
  delete: ["Trash", "Trash2"],
  upload: ["Upload", "UploadCloud"],
  download: ["Download", "DownloadCloud"],
  link: ["Link", "Link2", "ExternalLink"],
  lock: ["Lock", "LockKeyhole", "Unlock"],
  image: ["Image", "ImagePlus", "Images"],
  file: ["File", "FileText", "FileCode", "FilePlus"],
  folder: ["Folder", "FolderOpen", "FolderPlus"],
  calendar: ["Calendar", "CalendarDays", "CalendarCheck"],
  clock: ["Clock", "Clock3", "Clock10", "Timer"],
  map: ["Map", "MapPin", "Navigation"],
  cart: ["ShoppingCart", "ShoppingBag", "Package"],
  chart: ["BarChart", "BarChart2", "LineChart", "PieChart", "TrendingUp"],
  code: ["Code", "Code2", "Terminal", "CodeXml"],
  database: ["Database", "DatabaseZap", "Server"],
  cloud: ["Cloud", "CloudUpload", "CloudDownload"],
  globe: ["Globe", "Globe2"],
  play: ["Play", "PlayCircle"],
  pause: ["Pause", "PauseCircle"],
  arrow: ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "ChevronRight"],
  dashboard: ["LayoutDashboard", "LayoutGrid", "Gauge"],
  profile: ["UserCircle", "UserRound", "CircleUser"],
  logout: ["LogOut", "LogIn"],
  share: ["Share", "Share2"],
  filter: ["Filter", "SlidersHorizontal"],
  sort: ["ArrowUpDown", "ListOrdered"],
  eye: ["Eye", "EyeOff"],
  alert: ["AlertCircle", "AlertTriangle", "AlertOctagon"],
  info: ["Info"],
  help: ["HelpCircle", "CircleHelp"],
};

// Minimal shadcn component registry — canonical usage snippets
const COMPONENT_SNIPPETS: Record<string, string> = {
  Button: `import { Button } from "@/components/ui/button"\n// Usage:\n<Button variant="default">Click me</Button>\n// Variants: default | destructive | outline | secondary | ghost | link\n// Sizes: default | sm | lg | icon`,
  Input: `import { Input } from "@/components/ui/input"\n// Usage:\n<Input type="email" placeholder="Email" />`,
  Dialog: `import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"\n// Usage:\n<Dialog>\n  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>\n  <DialogContent>\n    <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>\n    Content here\n  </DialogContent>\n</Dialog>`,
  Card: `import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"\n// Usage:\n<Card>\n  <CardHeader>\n    <CardTitle>Title</CardTitle>\n    <CardDescription>Description</CardDescription>\n  </CardHeader>\n  <CardContent>Content</CardContent>\n  <CardFooter>Footer</CardFooter>\n</Card>`,
  Tabs: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"\n// Usage:\n<Tabs defaultValue="tab1">\n  <TabsList><TabsTrigger value="tab1">Tab 1</TabsTrigger></TabsList>\n  <TabsContent value="tab1">Content</TabsContent>\n</Tabs>`,
  Select: `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"\n// Usage:\n<Select>\n  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>\n  <SelectContent><SelectItem value="a">Option A</SelectItem></SelectContent>\n</Select>`,
  Badge: `import { Badge } from "@/components/ui/badge"\n// Usage: <Badge variant="default">New</Badge>\n// Variants: default | secondary | destructive | outline`,
  Separator: `import { Separator } from "@/components/ui/separator"\n// Usage: <Separator orientation="horizontal" />`,
  Textarea: `import { Textarea } from "@/components/ui/textarea"\n// Usage: <Textarea placeholder="Type here..." />`,
  Label: `import { Label } from "@/components/ui/label"\n// Usage: <Label htmlFor="email">Email</Label>`,
  Checkbox: `import { Checkbox } from "@/components/ui/checkbox"\n// Usage: <Checkbox id="terms" />`,
  Switch: `import { Switch } from "@/components/ui/switch"\n// Usage: <Switch id="airplane-mode" />`,
  Tooltip: `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"\n// Usage:\n<TooltipProvider>\n  <Tooltip>\n    <TooltipTrigger>Hover</TooltipTrigger>\n    <TooltipContent>Tooltip text</TooltipContent>\n  </Tooltip>\n</TooltipProvider>`,
  Avatar: `import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"\n// Usage:\n<Avatar>\n  <AvatarImage src="/avatar.png" alt="User" />\n  <AvatarFallback>CN</AvatarFallback>\n</Avatar>`,
  Progress: `import { Progress } from "@/components/ui/progress"\n// Usage: <Progress value={60} className="w-full" />`,
  Skeleton: `import { Skeleton } from "@/components/ui/skeleton"\n// Usage: <Skeleton className="h-4 w-[250px]" />`,
  Sheet: `import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"\n// Usage:\n<Sheet>\n  <SheetTrigger asChild><Button>Open</Button></SheetTrigger>\n  <SheetContent side="right">Content</SheetContent>\n</Sheet>`,
};

async function toolWebSearch(args: { query: string; max_results?: number }) {
  const { TAVILY_API_KEY } = process.env;
  if (!TAVILY_API_KEY) {
    return { error: "webSearch not configured (no TAVILY_API_KEY)", results: [] };
  }
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query: args.query,
      max_results: args.max_results ?? 5,
      include_answer: true,
    }),
  });
  if (!res.ok) return { error: `Tavily ${res.status}`, results: [] };
  const data = await res.json();
  return {
    answer: data.answer,
    results: (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 300),
    })),
  };
}

async function toolFetchDocs(args: { url: string }) {
  try {
    const res = await fetch(args.url, {
      headers: { Accept: "text/html,text/plain", "User-Agent": "NJIRLAH-AI/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{3,}/g, "\n")
      .slice(0, 4000);
    return { url: args.url, text };
  } catch (e: any) {
    return { error: e.message };
  }
}

function toolIconSearch(args: { concept: string }) {
  const concept = args.concept.toLowerCase();
  const results: string[] = [];
  for (const [key, icons] of Object.entries(LUCIDE_ICONS)) {
    if (concept.includes(key) || key.includes(concept)) {
      results.push(...icons);
    }
  }
  if (results.length === 0) {
    results.push("Circle", "Square", "LayoutDashboard");
  }
  const dedupedIcons = Array.from(new Set(results)).slice(0, 8);
  return {
    concept: args.concept,
    icons: dedupedIcons,
    importNote: `import { ${dedupedIcons.slice(0, 3).join(", ")} } from "lucide-react"`,
  };
}

function toolComponentRegistry(args: { name: string }) {
  const key = Object.keys(COMPONENT_SNIPPETS).find(
    (k) => k.toLowerCase() === args.name.toLowerCase()
  );
  if (!key) {
    return {
      name: args.name,
      found: false,
      available: Object.keys(COMPONENT_SNIPPETS),
    };
  }
  return { name: key, found: true, snippet: COMPONENT_SNIPPETS[key] };
}

export async function POST(req: NextRequest) {
  let body: { tool: string; args: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tool, args } = body;
  if (!tool || typeof tool !== "string") {
    return NextResponse.json({ error: "Missing tool name" }, { status: 400 });
  }

  try {
    let result: unknown;
    switch (tool) {
      case "webSearch":
        result = await toolWebSearch(args as { query: string; max_results?: number });
        break;
      case "fetchDocs":
        result = await toolFetchDocs(args as { url: string });
        break;
      case "iconSearch":
        result = toolIconSearch(args as { concept: string });
        break;
      case "componentRegistry":
        result = toolComponentRegistry(args as { name: string });
        break;
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }
    return NextResponse.json({ tool, result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
