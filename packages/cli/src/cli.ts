#!/usr/bin/env node

import { Command } from "commander";
import { build } from "./commands/build.js";
import { serve } from "./commands/serve.js";

const program = new Command();

program
  .name("njirlah")
  .description("NJIRLAH AI - Generate code from prompts")
  .version("1.0.0");

program
  .command("build <prompt>")
  .description("Generate code from a prompt")
  .option("-m, --model <model>", "AI model (anthropic|gemini|replit|openrouter|cloudflare)", "anthropic")
  .option("-o, --output <path>", "Output directory", "./generated")
  .option("--api-key <key>", "API key for BYOK providers")
  .option("--base-url <url>", "NJIRLAH API base URL", "https://njirlah.ai")
  .action(build);

program
  .command("serve")
  .description("Start local preview server (requires running NJIRLAH instance)")
  .option("-p, --port <port>", "Port to listen on", "3000")
  .action(serve);

program.parse(process.argv);
