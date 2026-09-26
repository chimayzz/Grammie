import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  loadModel,
  completion,
  unloadModel,
  LLAMA_3_2_1B_INST_Q4_0
} from "@qvac/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
let modelId = null;

// =========================
// LOAD QVAC
// =========================

async function startQVAC() {
  console.log("🎀 Loading Grammie AI...");

  modelId = await loadModel({
    modelSrc: LLAMA_3_2_1B_INST_Q4_0,
    modelConfig: {
      device: "cpu",
      gpu_layers: 0,
      ctx_size: 2048
    }
  });

  console.log("✨ Grammie AI is ready!");
}

// =========================
// FRONTEND
// =========================

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);

    const types = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript"
    };

    res.writeHead(200, {
      "Content-Type": types[ext] || "text/plain"
    });

    res.end(data);
  });
}

// =========================
// SIMPLE JSON EXTRACTION
// =========================

function extractJSON(answer) {
  if (!answer) return null;

  // Try complete response first
  try {
    return JSON.parse(answer.trim());
  } catch {}

  // Try extracting the largest JSON object
  const start = answer.indexOf("{");
  const end = answer.lastIndexOf("}");

  if (start !== -1 && end !== -1 && end > start) {
    const possibleJSON = answer.slice(start, end + 1);

    try {
      return JSON.parse(possibleJSON);
    } catch {}
  }

  return null;
}

// =========================
// BUILD CORRECTED TEXT
// =========================

function buildCorrectedText(originalText, changes) {
  let corrected = originalText;

  if (!Array.isArray(changes)) {
    return corrected;
  }

  for (const change of changes) {
    if (
      change &&
      typeof change.original === "string" &&
      typeof change.corrected === "string" &&
      change.original.trim()
    ) {
      corrected = corrected.replace(
        change.original,
        change.corrected
      );
    }
  }

  return corrected;
}

// =========================
// SERVER
// =========================

const server = http.createServer(async (req, res) => {

  // =========================
  // FRONTEND
  // =========================

  if (req.method === "GET") {

    let filePath;

    if (req.url === "/") {
      filePath = path.join(
        __dirname,
        "public",
        "index.html"
      );
    } else {
      filePath = path.join(
        __dirname,
        "public",
        req.url
      );
    }

    serveFile(res, filePath);
    return;
  }

  // =========================
  // GRAMMAR API
  // =========================

  if (
    req.method === "POST" &&
    req.url === "/api/check"
  ) {

    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {

      try {

        const { text } = JSON.parse(body);

        if (!text || !text.trim()) {

          res.writeHead(400, {
            "Content-Type": "application/json"
          });

          res.end(
            JSON.stringify({
              error: "Please enter some text first."
            })
          );

          return;
        }

        // =========================
        // PROMPT
        // =========================

        const prompt = `
You are Grammie, an offline grammar and writing assistant.

Correct the user's writing.

Return ONLY a JSON object.

The JSON must have exactly these fields:

{
  "corrected": "complete corrected writing",
  "changes": [],
  "overall": "short explanation"
}

IMPORTANT:

The "corrected" field must contain the FULL corrected version of the user's writing.

Never put words such as:
"corrected version"
"corrected text"
"the corrected version"

inside the corrected field.

Fix:

- grammar
- spelling
- punctuation
- capitalization
- subject-verb agreement
- verb tense
- singular/plural mistakes
- sentence structure

Preserve the original meaning.

Do not add new information.

For each important correction, use:

{
  "original": "exact phrase from the user's text",
  "corrected": "correct replacement",
  "reason": "short reason"
}

If the user has no mistakes, return the original text.

USER TEXT:

${text}
`;

        // =========================
        // QVAC
        // =========================

        const result = completion({
          modelId,

          history: [
            {
              role: "user",
              content: prompt
            }
          ],

          stream: false
        });

        const finalResult = await result.final;

        const answer =
          finalResult.contentText ||
          finalResult.raw?.fullText ||
          "";

        console.log("");
        console.log("🤖 QVAC RESPONSE:");
        console.log(answer);
        console.log("");

        // =========================
        // PARSE
        // =========================

        let parsed = extractJSON(answer);

        // =========================
        // FALLBACK
        // =========================

        if (
          !parsed ||
          typeof parsed !== "object"
        ) {

          parsed = {
            corrected: text,
            changes: [],
            overall:
              "Grammie could not format the AI response automatically."
          };
        }

        if (!Array.isArray(parsed.changes)) {
          parsed.changes = [];
        }

        // =========================
        // CHECK CORRECTED FIELD
        // =========================

        const correctedValue =
          String(parsed.corrected || "")
            .trim()
            .toLowerCase();

        const badValues = [
          "",
          "corrected version",
          "corrected text",
          "the corrected version",
          "complete corrected version",
          "the complete corrected version"
        ];

        if (badValues.includes(correctedValue)) {

          parsed.corrected =
            buildCorrectedText(
              text,
              parsed.changes
            );
        }

        // =========================
        // SEND
        // =========================

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(
          JSON.stringify(parsed)
        );

      } catch (error) {

        console.error(
          "❌ Grammie error:",
          error
        );

        res.writeHead(500, {
          "Content-Type": "application/json"
        });

        res.end(
          JSON.stringify({
            error:
              error.message ||
              "Something went wrong."
          })
        );
      }
    });

    return;
  }

  // =========================
  // NOT FOUND
  // =========================

  res.writeHead(404);
  res.end("Not found");
});

// =========================
// START
// =========================

async function main() {

  try {

    await startQVAC();

    server.listen(PORT, () => {

      console.log("");

      console.log("🎀 GRAMMIE");

      console.log(
        "━━━━━━━━━━━━━━━━━━━━"
      );

      console.log(
        `✨ Running at http://localhost:${PORT}`
      );

      console.log(
        "━━━━━━━━━━━━━━━━━━━━"
      );
    });

    // =========================
    // CLEAN SHUTDOWN
    // =========================

    process.on(
      "SIGINT",
      async () => {

        console.log(
          "\n🎀 Closing Grammie..."
        );

        if (modelId) {

          await unloadModel({
            modelId
          });
        }

        process.exit(0);
      }
    );

  } catch (error) {

    console.error(
      "❌ Failed to start Grammie:",
      error
    );

    process.exit(1);
  }
}

main();