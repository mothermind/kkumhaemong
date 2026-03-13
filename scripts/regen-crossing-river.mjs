import { writeFileSync } from "fs";

const prompts = [
  { name: "hero", prompt: "A lone figure standing knee-deep in a wide mist-shrouded river at dawn, stepping stones visible beneath the surface, traditional Korean ink-wash illustration style, soft watercolor washes of grey and pale gold, dreamlike atmosphere, mountain silhouettes in background, no text, cinematic wide aspect", ratio: "16:9" },
  { name: "auspicious", prompt: "A small wooden boat gliding serenely across a glassy clear river under a golden sunrise, Korean traditional painting aesthetic, soft ink-wash style, warm amber and gold tones, lily pads along banks, tranquil and auspicious mood, no text", ratio: "4:3" },
  { name: "inauspicious", prompt: "A turbulent dark muddy river rushing under a stormy overcast sky, figure struggling at the bank unable to cross, traditional Korean ink painting style, deep indigo and charcoal tones, foreboding and heavy atmosphere, rain visible, no text", ratio: "4:3" }
];

const key = process.env["GOOGLE_API_KEY"];
if (!key) { console.error("No GOOGLE_API_KEY in environment"); process.exit(1); }

for (const p of prompts) {
  console.log(`Generating ${p.name}...`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instances: [{ prompt: p.prompt }], parameters: { sampleCount: 1, aspectRatio: p.ratio } })
  });
  const json = await res.json();
  if (!res.ok) { console.error("Error:", JSON.stringify(json)); continue; }
  const b64 = json.predictions[0].bytesBase64Encoded;
  const buf = Buffer.from(b64, "base64");
  writeFileSync(`public/images/dreams/crossing-river-dream/${p.name}.png`, buf);
  console.log(`Saved ${p.name}.png (${Math.round(buf.length / 1024)}KB)`);
}
console.log("Done.");
