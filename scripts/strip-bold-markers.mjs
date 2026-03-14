#!/usr/bin/env node
/**
 * Strip **bold** markdown from all content JSON body fields.
 * Converts **text** → text (removes the asterisks, keeps the content).
 */

import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

const files = await glob("data/content/**/*.json");
let fixed = 0;

for (const file of files) {
  const raw = await readFile(file, "utf8");
  const stripped = raw.replace(/\*\*([^*]+)\*\*/g, "$1");
  if (stripped !== raw) {
    await writeFile(file, stripped, "utf8");
    console.log(`✓ ${file}`);
    fixed++;
  }
}

console.log(`\nDone. ${fixed} files updated.`);
