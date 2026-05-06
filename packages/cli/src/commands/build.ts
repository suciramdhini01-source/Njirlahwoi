import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import chalk from "chalk";
import ora from "ora";

interface BuildOptions {
  model: string;
  output: string;
  apiKey?: string;
  baseUrl: string;
}

export async function build(prompt: string, options: BuildOptions) {
  const spinner = ora("Generating code...").start();

  try {
    const requestBody = {
      prompt,
      modelSource: options.model,
      modelId: undefined,
      filePath: "generated.ts",
      apiKey: options.apiKey,
    };

    // Call public API
    const response = await fetch(`${options.baseUrl}/api/public/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    // Create output directory
    await fs.mkdir(options.output, { recursive: true });

    // Read SSE stream
    let code = "";
    let error = "";

    const reader = response.body?.getReader?.();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("event:")) {
          const event = line.slice(6).trim();
          if (event === "error") {
            spinner.fail("Generation failed");
            return;
          }
        }
        if (line.startsWith("data:")) {
          const data = JSON.parse(line.slice(5).trim());
          if (data.chunk) {
            code += data.chunk;
            spinner.text = `Generated ${code.length} chars...`;
          }
        }
      }
    }

    // Write output
    const outputFile = path.join(options.output, "generated.ts");
    await fs.writeFile(outputFile, code);

    spinner.succeed(chalk.green(`Code generated to ${outputFile}`));
    console.log(chalk.gray(`\n${code.slice(0, 200)}...\n`));
  } catch (e) {
    spinner.fail(chalk.red((e as Error).message));
    process.exit(1);
  }
}
