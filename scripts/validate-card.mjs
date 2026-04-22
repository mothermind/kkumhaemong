#!/usr/bin/env node
// Fast-gate mechanical validation for X cards.
//
// Usage:
//   node scripts/validate-card.mjs --slug <slug> --locale <ko|en>
//   node scripts/validate-card.mjs --all-pending
//
// Exit code: 0 on ok/warn, 1 if any card is BLOCK severity.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// --- arg parsing ---
const args = process.argv.slice(2);
const getArg = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : def;
};
const hasFlag = (flag) => args.includes(flag);

const ALL_PENDING = hasFlag("--all-pending");
const SLUG_ARG = getArg("--slug");
const LOCALE_ARG = getArg("--locale");

if (!ALL_PENDING && (!SLUG_ARG || !LOCALE_ARG)) {
  console.error("usage: validate-card.mjs --slug <slug> --locale <ko|en>");
  console.error("       validate-card.mjs --all-pending");
  process.exit(1);
}

if (LOCALE_ARG && !["ko", "en"].includes(LOCALE_ARG)) {
  console.error(`invalid locale: ${LOCALE_ARG} (must be ko or en)`);
  process.exit(1);
}

// --- paths ---
const QUEUE_PATH = path.join(PROJECT_ROOT, "data/x-queue/queue.json");
const HOOKS_DIR = path.join(PROJECT_ROOT, "data/x-queue/hooks");
const CONTENT_BASE = path.join(PROJECT_ROOT, "data/content");
const CARDS_PENDING_DIR = path.join(PROJECT_ROOT, "public/x-cards/pending");
const CARDS_POSTED_DIR = path.join(PROJECT_ROOT, "public/x-cards/posted");
const VALIDATION_DIR = path.join(PROJECT_ROOT, "data/x-queue/validation");

// --- constants ---
const EXPECTED_WIDTH = 1080;
const EXPECTED_HEIGHT = 1350;
const MIN_FILE_SIZE = 50 * 1024;   // 50 KB
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const FONT_WARN_PX = 84;
const FONT_BLOCK_PX = 72;
const CLASSIFIER_MARGIN_THRESHOLD = 1.25;
const REQUIRED_QUEUE_FIELDS = [
  "slug", "locale", "kicker", "setup", "oneLiner", "status", "createdAt",
];

// --- load queue ---
const queue = fs.existsSync(QUEUE_PATH)
  ? JSON.parse(fs.readFileSync(QUEUE_PATH, "utf8"))
  : { entries: [] };

// --- build slug allowlist from hooks dir (faster than scanning all content dirs) ---
const hookSlugs = fs.existsSync(HOOKS_DIR)
  ? new Set(fs.readdirSync(HOOKS_DIR).filter((f) => f.endsWith(".json")).map((f) => path.basename(f, ".json")))
  : new Set();

// Also scan content dirs for a broader allowlist
const contentSlugSet = new Set(hookSlugs);
if (fs.existsSync(CONTENT_BASE)) {
  for (const catDir of fs.readdirSync(CONTENT_BASE)) {
    const catPath = path.join(CONTENT_BASE, catDir);
    if (!fs.statSync(catPath).isDirectory()) continue;
    for (const f of fs.readdirSync(catPath)) {
      if (f.endsWith(".json")) contentSlugSet.add(path.basename(f, ".json"));
    }
  }
}

// --- resolve candidates to validate ---
function resolveCandidates() {
  if (SLUG_ARG && LOCALE_ARG) {
    return [{ slug: SLUG_ARG, locale: LOCALE_ARG }];
  }
  // --all-pending: all pending entries in queue
  const pending = queue.entries.filter((e) => e.status === "pending");
  return pending.map((e) => ({ slug: e.slug, locale: e.locale }));
}

// --- find card image path ---
function resolveCardPath(slug, locale) {
  const filename = locale === "en" ? `${slug}_en.jpg` : `${slug}.jpg`;
  const pendingPath = path.join(CARDS_PENDING_DIR, filename);
  const postedPath = path.join(CARDS_POSTED_DIR, filename);
  if (fs.existsSync(pendingPath)) return { path: pendingPath, location: "pending" };
  if (fs.existsSync(postedPath)) return { path: postedPath, location: "posted" };
  // Also check root x-cards dir (cards may not be moved to pending/ yet)
  const rootPath = path.join(PROJECT_ROOT, "public/x-cards", filename);
  if (fs.existsSync(rootPath)) return { path: rootPath, location: "root" };
  return null;
}

// --- get queue entry for slug+locale ---
function getQueueEntry(slug, locale) {
  return queue.entries.find((e) => e.slug === slug && e.locale === locale) || null;
}

// --- get hooks classifier output ---
function getHooksData(slug) {
  const hookPath = path.join(HOOKS_DIR, `${slug}.json`);
  if (!fs.existsSync(hookPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(hookPath, "utf8"));
  } catch {
    return null;
  }
}

// --- validate one card ---
async function validateCard(slug, locale) {
  const { default: sharp } = await import("sharp");

  const warnings = { design: [], content: [], pipeline: [] };
  const errors = { design: [], content: [], pipeline: [] };

  // --- DESIGN checks ---
  const cardInfo = resolveCardPath(slug, locale);

  if (!cardInfo) {
    errors.design.push("image file not found");
  } else {
    // Valid JPG + dimensions check
    try {
      const meta = await sharp(cardInfo.path).metadata();
      if (meta.format !== "jpeg") {
        errors.design.push(`file is not a JPEG (format: ${meta.format})`);
      }
      if (meta.width !== EXPECTED_WIDTH || meta.height !== EXPECTED_HEIGHT) {
        errors.design.push(
          `dimensions ${meta.width}×${meta.height} — expected ${EXPECTED_WIDTH}×${EXPECTED_HEIGHT}`
        );
      }
    } catch (err) {
      errors.design.push(`invalid image file — sharp metadata read failed: ${err.message}`);
    }

    // File size check
    try {
      const stat = fs.statSync(cardInfo.path);
      if (stat.size < MIN_FILE_SIZE) {
        warnings.design.push(`file size ${(stat.size / 1024).toFixed(1)}KB is below 50KB minimum`);
      } else if (stat.size > MAX_FILE_SIZE) {
        warnings.design.push(`file size ${(stat.size / 1024 / 1024).toFixed(2)}MB exceeds 2MB maximum`);
      }
    } catch {
      // already handled above
    }
  }

  // Font auto-shrink + payoff line count — read from queue entry if recorded
  const entry = getQueueEntry(slug, locale);
  if (entry) {
    if (entry.mainKickerFontSize !== undefined) {
      const fontSize = Number(entry.mainKickerFontSize);
      if (fontSize < FONT_BLOCK_PX) {
        errors.design.push(
          `mainKicker auto-shrunk to ${fontSize}px — below ${FONT_BLOCK_PX}px BLOCK threshold`
        );
      } else if (fontSize < FONT_WARN_PX) {
        warnings.design.push(
          `mainKicker auto-shrunk to ${fontSize}px — below ${FONT_WARN_PX}px WARN threshold`
        );
      }
    }

    if (entry.ruleWidth !== undefined && entry.estimatedTextWidth !== undefined) {
      const ratio = Number(entry.ruleWidth) / Number(entry.estimatedTextWidth);
      if (ratio > 1.3) {
        warnings.design.push(
          `ruleWidth (${entry.ruleWidth}) is ${ratio.toFixed(2)}× estimated text width — may look misaligned`
        );
      }
    }

    // Payoff line count — check oneLiner for newlines
    const oneLiner = entry.oneLiner || entry.mainKicker || "";
    const lineCount = (oneLiner.match(/\n/g) || []).length + 1;
    if (lineCount >= 3) {
      errors.design.push(
        `payoff/oneLiner has ${lineCount} lines — max 2 allowed (BLOCK)`
      );
    } else if (lineCount === 2) {
      warnings.design.push(`payoff/oneLiner spans 2 lines — single line preferred`);
    }
  }

  const designPass = errors.design.length === 0;

  // --- CONTENT checks ---
  if (!entry) {
    errors.content.push("no queue entry found for this slug+locale");
  } else {
    // Required fields
    const missing = REQUIRED_QUEUE_FIELDS.filter((f) => entry[f] === undefined || entry[f] === null || entry[f] === "");
    if (missing.length > 0) {
      errors.content.push(`queue entry missing required fields: ${missing.join(", ")}`);
    }

    // Slug existence check
    if (!contentSlugSet.has(slug)) {
      errors.content.push(`slug "${slug}" not found in content directory or hooks — unrecognised dream`);
    }

    // Classifier scores margin check
    const hooksData = getHooksData(slug);
    if (hooksData?.scores) {
      const scoreValues = Object.values(hooksData.scores)
        .map(Number)
        .filter((v) => !isNaN(v))
        .sort((a, b) => b - a);
      if (scoreValues.length >= 2 && scoreValues[1] > 0) {
        const margin = scoreValues[0] / scoreValues[1];
        if (margin < CLASSIFIER_MARGIN_THRESHOLD) {
          warnings.content.push(
            `classifier top1/top2 margin ${margin.toFixed(2)} < ${CLASSIFIER_MARGIN_THRESHOLD} — ambiguous category`
          );
          // mark as ambiguous in the report (done below via agentEscalationReasons)
        }
      }
    }

    // canonicalCategory override checks
    if (hooksData?.canonicalCategory) {
      if (!hooksData.reviewedBy) {
        warnings.content.push(
          "hooks.json has canonicalCategory but no reviewedBy — unreviewed override"
        );
      }
      // Check if the card's chosenCategory matched the override
      const chosenCategory = entry.categoryKey || entry.category;
      if (chosenCategory && hooksData.canonicalCategory !== chosenCategory) {
        errors.content.push(
          `hooks.json canonicalCategory "${hooksData.canonicalCategory}" but card used "${chosenCategory}" — renderer ignored override`
        );
      }
    }
  }

  const contentPass = errors.content.length === 0;

  // --- PIPELINE checks ---

  // Cross-language dedup: no posted entry with same slug (any locale)
  const postedSameSlug = queue.entries.filter(
    (e) => e.slug === slug && e.status === "posted"
  );
  if (postedSameSlug.length > 0) {
    const postedLocales = postedSameSlug.map((e) => e.locale).join(", ");
    errors.pipeline.push(
      `slug "${slug}" already posted in locale(s): ${postedLocales} — cross-language dedup violation`
    );
  }

  // Status/location coherence
  if (cardInfo && entry) {
    if (cardInfo.location === "pending" && entry.status !== "pending") {
      warnings.pipeline.push(
        `card is in pending/ directory but queue status is "${entry.status}"`
      );
    }
    if (cardInfo.location === "posted" && entry.status !== "posted") {
      warnings.pipeline.push(
        `card is in posted/ directory but queue status is "${entry.status}"`
      );
    }
  }

  // Duplicate queue entries for same (slug, locale)
  const dupes = queue.entries.filter((e) => e.slug === slug && e.locale === locale);
  if (dupes.length > 1) {
    warnings.pipeline.push(
      `${dupes.length} queue entries found for (${slug}, ${locale}) — duplicates detected`
    );
  }

  const pipelinePass = errors.pipeline.length === 0;

  // --- severity rollup ---
  const allErrors = [...errors.design, ...errors.content, ...errors.pipeline];
  const allWarnings = [...warnings.design, ...warnings.content, ...warnings.pipeline];

  let severity = "ok";
  if (allWarnings.length > 0) severity = "warn";
  if (allErrors.length > 0) severity = "block";

  const passed = severity !== "block";

  // --- agent escalation ---
  const agentEscalationReasons = [];
  const hooksData = getHooksData(slug);
  if (hooksData?.scores) {
    const scoreValues = Object.values(hooksData.scores)
      .map(Number)
      .filter((v) => !isNaN(v))
      .sort((a, b) => b - a);
    if (scoreValues.length >= 2 && scoreValues[1] > 0) {
      const margin = scoreValues[0] / scoreValues[1];
      if (margin < CLASSIFIER_MARGIN_THRESHOLD) {
        agentEscalationReasons.push(`ambiguousCategory: classifier margin ${margin.toFixed(2)}`);
      }
    }
  }
  if (hooksData?.canonicalCategory && !hooksData.reviewedBy) {
    agentEscalationReasons.push("unreviewed canonicalCategory override");
  }
  const flaggedForAgentReview = agentEscalationReasons.length > 0 || severity === "block";

  // --- recommendation ---
  let recommendation;
  if (severity === "block") {
    recommendation = "fix-and-revalidate";
    if (errors.content.some((e) => e.includes("canonicalCategory"))) {
      recommendation = "needs-canonical-override";
    }
  } else if (flaggedForAgentReview) {
    recommendation = "ready-for-agent";
  } else {
    recommendation = "ready-for-agent";
  }

  const report = {
    slug,
    locale,
    validatedAt: new Date().toISOString(),
    validatedBy: "validate-card.mjs",
    layer: "script",
    passed,
    severity,
    checks: {
      design: { pass: designPass, warnings: warnings.design, errors: errors.design },
      content: { pass: contentPass, warnings: warnings.content, errors: errors.content },
      pipeline: { pass: pipelinePass, warnings: warnings.pipeline, errors: errors.pipeline },
    },
    flaggedForAgentReview,
    agentEscalationReasons,
    recommendation,
  };

  // --- write report ---
  fs.mkdirSync(VALIDATION_DIR, { recursive: true });
  const isoTs = new Date().toISOString().replace(/[:.]/g, "-").replace("Z", "Z");
  const reportFilename = `${slug}-${locale}-script-${isoTs}.json`;
  const reportPath = path.join(VALIDATION_DIR, reportFilename);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");

  return { report, reportPath };
}

// --- main ---
async function main() {
  const candidates = resolveCandidates();

  if (candidates.length === 0) {
    console.log("no pending entries to validate — queue is empty.");
    process.exit(0);
  }

  let anyBlock = false;
  const results = [];

  for (const { slug, locale } of candidates) {
    const { report, reportPath } = await validateCard(slug, locale);
    const icon = report.severity === "ok" ? "✓" : report.severity === "warn" ? "⚠" : "✗";
    console.log(
      `${icon} ${slug} [${locale}]  severity=${report.severity}  report=${path.relative(PROJECT_ROOT, reportPath)}`
    );
    if (report.severity === "block") anyBlock = true;
    results.push(report);
  }

  console.log(
    `\n${results.length} card(s) validated — ok:${results.filter((r) => r.severity === "ok").length} warn:${results.filter((r) => r.severity === "warn").length} block:${results.filter((r) => r.severity === "block").length}`
  );

  process.exit(anyBlock ? 1 : 0);
}

main().catch((err) => {
  console.error("validate-card.mjs fatal error:", err);
  process.exit(1);
});
