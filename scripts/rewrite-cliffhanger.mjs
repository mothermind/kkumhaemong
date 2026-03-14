#!/usr/bin/env node
/**
 * Rewrite the "그런데 한 가지—" cliffhanger pattern in ko.intro fields.
 * Uses GPT-4o-mini to produce natural, varied Korean transitions.
 *
 * Usage:
 *   node scripts/rewrite-cliffhanger.mjs --dry-run          # preview 5 random files
 *   node scripts/rewrite-cliffhanger.mjs --dry-run --n=10   # preview N files
 *   node scripts/rewrite-cliffhanger.mjs                    # write all files
 */

import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";
import OpenAI from "openai";
import { config } from "dotenv";

config(); // load .env

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const nArg = args.find((a) => a.startsWith("--n="));
const previewCount = nArg ? parseInt(nArg.split("=")[1]) : 5;
const BATCH_SIZE = 6;

const SYSTEM_PROMPT = `당신은 한국어 꿈해몽 콘텐츠 편집자입니다.
주어진 꿈해몽 소개글(intro)에서 "그런데 한 가지" 또는 "그런데 한 가지—" 패턴으로 시작하는 전환 문장을 찾아,
자연스럽고 다양한 한국어 표현으로 바꿔주세요.

규칙:
- 전환 문장(그런데 한 가지~ 부분)만 자연스럽게 바꾸세요. 나머지 문장은 절대 수정하지 마세요.
- 매번 다른 표현을 사용하세요. 예시:
  - "그런데 여기서 한 가지 중요한 게 있어요."
  - "다만 꼭 짚고 넘어갈 부분이 있어요."
  - "그런데 놀라운 건,"
  - "그런데 꼭 알아야 할 게 있어요."
  - "그런데 여기서 반전이 있어요."
  - "한 가지 흥미로운 점이 있어요."
  - "그런데 이게 전부가 아니에요."
- 이어지는 내용 문장(—뒤 또는 다음 문장)은 그대로 유지하세요.
- 수정된 전체 intro 텍스트만 반환하세요. 설명이나 부가 텍스트 없이.`;

async function rewriteIntro(intro) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: intro },
    ],
    temperature: 0.8,
    max_tokens: 600,
  });
  return response.choices[0].message.content.trim();
}

async function processFile(file) {
  const raw = await readFile(file, "utf8");
  const data = JSON.parse(raw);

  const intro = data.ko?.intro;
  if (!intro || !intro.includes("그런데 한 가지")) return null;

  const rewritten = await rewriteIntro(intro);
  return { file, original: intro, rewritten, data };
}

async function processBatch(files) {
  return Promise.all(files.map(processFile));
}

// --- Main ---

const allFiles = await glob("data/content/**/*.json");
const targetFiles = allFiles.filter(async (f) => {
  // pre-filter: only files likely to have the pattern (fast check done via grep earlier)
  return true; // processFile handles the actual check
});

if (isDryRun) {
  // Pick a spread of files across categories for preview
  const shuffled = [...targetFiles].sort(() => Math.random() - 0.5).slice(0, previewCount);
  console.log(`\n🔍 DRY RUN — previewing ${previewCount} files\n`);
  console.log("=".repeat(70));

  const results = await processBatch(shuffled);
  for (const result of results) {
    if (!result) continue;
    console.log(`\nFILE: ${result.file}`);
    console.log("\n[BEFORE]");
    console.log(result.original);
    console.log("\n[AFTER]");
    console.log(result.rewritten);
    console.log("\n" + "-".repeat(70));
  }

  console.log("\n✅ Dry run complete. Run without --dry-run to apply changes.");
} else {
  // Full run in batches
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < targetFiles.length; i += BATCH_SIZE) {
    const batch = targetFiles.slice(i, i + BATCH_SIZE);
    const results = await processBatch(batch);

    for (const result of results) {
      if (!result) { skipped++; continue; }

      result.data.ko.intro = result.rewritten;
      await writeFile(result.file, JSON.stringify(result.data, null, 2) + "\n", "utf8");
      console.log(`✓ ${result.file}`);
      updated++;
    }

    process.stdout.write(`\rProgress: ${Math.min(i + BATCH_SIZE, targetFiles.length)}/${targetFiles.length}`);
  }

  console.log(`\n\nDone. Updated: ${updated}, Skipped (no pattern): ${skipped}`);
}
