#!/usr/bin/env node
// Dispatch wrapper for kkumhaemong-card-validator-agent — semantic / prose audit layer.
//
// Usage:
//   node scripts/audit-card.mjs --slug <slug> --locale <ko|en>
//   npm run x:audit -- --slug <slug> --locale <ko|en>
//
// TODO: agent dispatch — for now, manually invoke kkumhaemong-card-validator-agent
// via MotherMind when card validation flags need semantic review.
// The real dispatch path will be wired when the agent is registered in the next
// session reload.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const getArg = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};

const SLUG = getArg("--slug");
const LOCALE = getArg("--locale");

if (!SLUG || !LOCALE) {
  console.error("usage: audit-card.mjs --slug <slug> --locale <ko|en>");
  process.exit(1);
}

if (!["ko", "en"].includes(LOCALE)) {
  console.error(`invalid locale: ${LOCALE} (must be ko or en)`);
  process.exit(1);
}

const AUDITS_DIR = path.join(PROJECT_ROOT, "data/x-queue/audits");
fs.mkdirSync(AUDITS_DIR, { recursive: true });

// Write a stub audit-pending record so the poster can see agent review is needed.
const isoTs = new Date().toISOString();
const stub = {
  slug: SLUG,
  locale: LOCALE,
  auditedAt: null,
  auditedBy: "kkumhaemong-card-validator-agent",
  layer: "agent",
  status: "pending-dispatch",
  note: "Agent dispatch not yet wired. Invoke kkumhaemong-card-validator-agent via MotherMind.",
  createdAt: isoTs,
};

const filename = `${SLUG}-${isoTs.replace(/[:.]/g, "-").replace("Z", "Z")}.json`;
const outPath = path.join(AUDITS_DIR, filename);
fs.writeFileSync(outPath, JSON.stringify(stub, null, 2) + "\n");

console.log(`# TODO: agent dispatch — for now, manually invoke kkumhaemong-card-validator-agent`);
console.log(`# via MotherMind when card validation flags need semantic review`);
console.log(`#`);
console.log(`# Stub audit record written: ${path.relative(PROJECT_ROOT, outPath)}`);
console.log(`# slug=${SLUG} locale=${LOCALE}`);
