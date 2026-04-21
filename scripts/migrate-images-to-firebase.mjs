/**
 * Migrate images: PNG → WebP conversion + upload to Firebase Storage
 * Updates all content JSONs to use new Firebase Storage URLs
 *
 * Usage: node scripts/migrate-images-to-firebase.mjs
 * Optional: node scripts/migrate-images-to-firebase.mjs --dry-run
 * Optional: node scripts/migrate-images-to-firebase.mjs --slug snake-dream
 */

import { readdir, readFile, writeFile, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import admin from "firebase-admin";
import { createReadStream } from "fs";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

// Config
const BUCKET_NAME = "my-fortune-site.firebasestorage.app";
const IMAGES_DIR = join(PROJECT_ROOT, "public/images/dreams");
const CONTENT_DIR = join(PROJECT_ROOT, "data/content");
const SERVICE_ACCOUNT_PATH = join(__dirname, "firebase-service-account.json");
const PUBLIC_BASE_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");
const SINGLE_SLUG = process.argv.includes("--slug")
  ? process.argv[process.argv.indexOf("--slug") + 1]
  : null;

const IMAGE_NAMES = ["hero", "auspicious", "inauspicious"];
const WEBP_QUALITY = 85;

// Initialize Firebase Admin
const serviceAccount = JSON.parse(await readFile(SERVICE_ACCOUNT_PATH, "utf8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: BUCKET_NAME,
});
const bucket = admin.storage().bucket();

// Stats
let uploaded = 0;
let skipped = 0;
let failed = 0;
let contentUpdated = 0;

async function convertToWebP(inputPath) {
  const tmpPath = join(tmpdir(), `${randomUUID()}.webp`);
  await sharp(inputPath)
    .webp({ quality: WEBP_QUALITY })
    .toFile(tmpPath);
  return tmpPath;
}

async function uploadFile(localPath, storagePath) {
  // Check if already exists in bucket
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (exists) {
    skipped++;
    return;
  }

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would upload: ${storagePath}`);
    uploaded++;
    return;
  }

  await bucket.upload(localPath, {
    destination: storagePath,
    metadata: {
      contentType: "image/webp",
      cacheControl: "public, max-age=31536000, immutable",
    },
  });
  uploaded++;
}

async function processSlug(slug) {
  const slugDir = join(IMAGES_DIR, slug);

  for (const name of IMAGE_NAMES) {
    const pngPath = join(slugDir, `${name}.png`);
    const nativeWebpPath = join(slugDir, `${name}.webp`);
    const storagePath = `images/dreams/${slug}/${name}.webp`;

    const hasPng = existsSync(pngPath);
    const hasNativeWebp = existsSync(nativeWebpPath);

    if (!hasPng && !hasNativeWebp) {
      console.log(`  ⚠️  Missing: ${name}.png / ${name}.webp — skipping`);
      continue;
    }

    try {
      // Check if already in bucket
      const file = bucket.file(storagePath);
      const [exists] = await file.exists();
      if (exists && !FORCE) {
        console.log(`  ✓ Already exists: ${storagePath}`);
        skipped++;
        continue;
      }

      let uploadPath;
      let label;

      if (hasPng) {
        // Convert PNG → WebP then upload
        uploadPath = await convertToWebP(pngPath);
        const originalSize = (await stat(pngPath)).size;
        const webpSize = (await stat(uploadPath)).size;
        const savings = (((originalSize - webpSize) / originalSize) * 100).toFixed(1);
        label = `${name}.png → ${name}.webp (${(originalSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB, -${savings}%)`;
      } else {
        // Re-encode native WebP through sharp to standardize quality/size
        const originalSize = (await stat(nativeWebpPath)).size;
        uploadPath = await convertToWebP(nativeWebpPath);
        const webpSize = (await stat(uploadPath)).size;
        const savings = (((originalSize - webpSize) / originalSize) * 100).toFixed(1);
        label = `${name}.webp → re-encoded WebP (${(originalSize / 1024).toFixed(0)}KB → ${(webpSize / 1024).toFixed(0)}KB, -${savings}%)`;
      }

      // Upload
      if (!DRY_RUN) {
        const [uploadedFile] = await bucket.upload(uploadPath, {
          destination: storagePath,
          metadata: {
            contentType: "image/webp",
            cacheControl: "public, max-age=31536000, immutable",
          },
        });
        await uploadedFile.makePublic();
      }

      console.log(`  ✅ ${label}`);
      uploaded++;
    } catch (err) {
      console.error(`  ❌ Failed ${name}: ${err.message}`);
      failed++;
    }
  }
}

async function updateContentJSON(category, slug) {
  const contentPath = join(CONTENT_DIR, category, `${slug}.json`);
  if (!existsSync(contentPath)) return false;

  const raw = await readFile(contentPath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`  ❌ Invalid JSON in ${contentPath}: ${err.message}`);
    return false;
  }

  if (!data.images) return false;

  const oldHero = data.images.hero;
  const newBase = `${PUBLIC_BASE_URL}/images/dreams/${slug}`;

  // Replace image paths
  data.images.hero = `${newBase}/hero.webp`;
  if (data.images.sections) {
    if (data.images.sections.auspicious)
      data.images.sections.auspicious = `${newBase}/auspicious.webp`;
    if (data.images.sections.inauspicious)
      data.images.sections.inauspicious = `${newBase}/inauspicious.webp`;
  }

  // Update ogImage in SEO
  if (data.seo?.ogImage) {
    data.seo.ogImage = `${newBase}/hero.webp`;
  }

  if (oldHero === data.images.hero) return false; // Already updated

  if (!DRY_RUN) {
    await writeFile(contentPath, JSON.stringify(data, null, 2), "utf8");
  }
  contentUpdated++;
  return true;
}

async function getAllSlugs() {
  const entries = await readdir(IMAGES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

async function findCategoryForSlug(slug) {
  const categories = await readdir(CONTENT_DIR, { withFileTypes: true });
  for (const cat of categories.filter((e) => e.isDirectory())) {
    const contentPath = join(CONTENT_DIR, cat.name, `${slug}.json`);
    if (existsSync(contentPath)) return cat.name;
  }
  return null;
}

// Main
console.log(`🚀 Firebase Storage Image Migration`);
console.log(`   Bucket: ${BUCKET_NAME}`);
console.log(`   Quality: WebP ${WEBP_QUALITY}`);
if (DRY_RUN) console.log(`   Mode: DRY RUN (no uploads)`);
if (FORCE) console.log(`   Mode: FORCE (overwrite existing)`);
if (SINGLE_SLUG) console.log(`   Slug: ${SINGLE_SLUG} only`);
console.log("");

const slugs = SINGLE_SLUG ? [SINGLE_SLUG] : await getAllSlugs();
console.log(`📁 Found ${slugs.length} slug folders\n`);

for (const slug of slugs) {
  console.log(`[${slug}]`);
  await processSlug(slug);

  // Update content JSON
  const category = await findCategoryForSlug(slug);
  if (category) {
    const updated = await updateContentJSON(category, slug);
    if (updated) console.log(`  📝 Updated content JSON`);
  } else {
    console.log(`  ⚠️  No content JSON found for ${slug}`);
  }
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done
   Uploaded:        ${uploaded}
   Already existed: ${skipped}
   Failed:          ${failed}
   Content JSONs updated: ${contentUpdated}
${DRY_RUN ? "\n⚠️  DRY RUN — nothing was actually uploaded" : ""}
`);
