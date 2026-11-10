import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "assets");
const FONTS = path.join(ROOT, "scripts", "fonts");
const GIF = path.join(ROOT, "koi", "koi.gif");

const colors = {
  card: "#f6f8fa",
  border: "#d1d9e0",
  ink: "#1f2328",
  muted: "#59636e",
  faint: "#6e7781",
  accent: "#0969da",
};

const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const serif = "'Instrument Serif', Georgia, serif";

const layouts = {
  desktop: {
    w: 880,
    h: 268,
    cardRadius: 14,
    label: { x: 40, y: 52, size: 10.5, track: 1.6, text: "THE KOI" },
    title: { x: 40, y: 156, size: 34 },
    sub: { x: 40, y: 194, size: 10, track: 1.2, text: "PLATINUM BODY" },
    art: { x: 616, y: 14, w: 224, h: 240 },
  },
  mobile: {
    w: 380,
    h: 320,
    cardRadius: 11,
    label: { x: 18, y: 34, size: 8, track: 1.4, text: "THE KOI" },
    title: { x: 18, y: 78, size: 26 },
    sub: { x: 18, y: 102, size: 7.5, track: 0.8, text: "PLATINUM BODY" },
    art: { x: 90, y: 110, w: 200, h: 200 },
  },
};

if (!fs.existsSync(GIF)) throw new Error(`missing ${path.relative(ROOT, GIF)}; run git-koi first`);

const gif = fs.readFileSync(GIF);
const gifW = gif.readUInt16LE(6);
const gifH = gif.readUInt16LE(8);
const gifB64 = gif.toString("base64");

// The fish swims inside a 512 canvas with a wide transparent margin, so the
// card crops to the area the loop actually uses. The fraction matches the
// git-koi canvas and keeps working if the action changes its output size.
const crop = {
  x: +(gifW * 0.07).toFixed(2),
  y: +(gifH * 0.07).toFixed(2),
  w: +(gifW * 0.86).toFixed(2),
  h: +(gifH * 0.86).toFixed(2),
};

function fontStyle() {
  const normal = fs.readFileSync(path.join(FONTS, "instrument-serif.woff2")).toString("base64");
  const italic = fs.readFileSync(path.join(FONTS, "instrument-serif-italic.woff2")).toString("base64");
  return `@font-face{font-family:'Instrument Serif';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${normal}) format('woff2')}@font-face{font-family:'Instrument Serif';font-style:italic;font-weight:400;src:url(data:font/woff2;base64,${italic}) format('woff2')}`;
}

function buildCard(layout) {
  const { w, h } = layout;
  const { label, sub, title, art } = layout;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="A pixel-art platinum koi, redrawn nightly from this account's public activity">
<title>A pixel-art platinum koi, redrawn nightly from this account's public activity</title>
<style>${fontStyle()}</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${layout.cardRadius}" fill="${colors.card}" stroke="${colors.border}"/>
<text x="${label.x}" y="${label.y}" font-family="${mono}" font-size="${label.size}" letter-spacing="${label.track}" fill="${colors.muted}">${label.text}</text>
<text x="${title.x}" y="${title.y}" font-family="${serif}" font-size="${title.size}" fill="${colors.ink}">Every night, in <tspan font-style="italic" fill="${colors.accent}">koi</tspan></text>
<text x="${sub.x}" y="${sub.y}" font-family="${mono}" font-size="${sub.size}" letter-spacing="${sub.track}" fill="${colors.faint}">${sub.text}</text>
<svg x="${art.x}" y="${art.y}" width="${art.w}" height="${art.h}" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" preserveAspectRatio="xMidYMid meet" overflow="hidden"><image width="${gifW}" height="${gifH}" preserveAspectRatio="none" xlink:href="data:image/gif;base64,${gifB64}"/></svg>
</svg>
`;
}

for (const [variant, layout] of Object.entries(layouts)) {
  const suffix = variant === "desktop" ? "" : "-mobile";
  const file = path.join(ASSETS, `koi-card${suffix}.svg`);
  fs.writeFileSync(`${file}.tmp`, buildCard(layout));
  fs.renameSync(`${file}.tmp`, file);
  console.log(`${path.relative(ROOT, file)} ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
console.log(`koi source ${gifW}x${gifH}, cropped to ${crop.w}x${crop.h}`);
