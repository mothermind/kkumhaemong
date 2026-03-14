#!/usr/bin/env node
/**
 * Strip AI-style em-dashes from Korean prose fields only.
 * Replaces " — " (spaced em-dash) with ". " in:
 *   ko.intro, ko.conclusion
 *   ko.sections[*].body, ko.variations[*].body
 *   ko.faqs[*].answer
 *   ko.culturalContext (if string)
 *
 * Leaves English fields and heading/title fields untouched.
 */

import { readFile, writeFile } from "fs/promises";
import { glob } from "glob";

const EM_DASH = / — /g;

function fixProse(text) {
  return text.replace(EM_DASH, ". ");
}

function processKo(ko) {
  let changed = false;

  const fix = (val) => {
    const result = fixProse(val);
    if (result !== val) changed = true;
    return result;
  };

  if (typeof ko.intro === "string") ko.intro = fix(ko.intro);
  if (typeof ko.conclusion === "string") ko.conclusion = fix(ko.conclusion);
  if (typeof ko.culturalContext === "string") ko.culturalContext = fix(ko.culturalContext);

  for (const sec of ko.sections ?? []) {
    if (typeof sec.body === "string") sec.body = fix(sec.body);
  }
  for (const v of ko.variations ?? []) {
    if (typeof v.body === "string") v.body = fix(v.body);
  }
  for (const faq of ko.faqs ?? []) {
    if (typeof faq.answer === "string") faq.answer = fix(faq.answer);
  }

  return changed;
}

const files = await glob("data/content/**/*.json");
let fixed = 0;

for (const file of files) {
  const raw = await readFile(file, "utf8");
  const data = JSON.parse(raw);

  if (!data.ko) continue;

  const changed = processKo(data.ko);
  if (changed) {
    await writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`✓ ${file}`);
    fixed++;
  }
}

console.log(`\nDone. ${fixed} files updated.`);
