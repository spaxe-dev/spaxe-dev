import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "assets");
const FONTS = path.join(ROOT, "scripts", "fonts");

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
    h: 352,
    cardRadius: 14,
    label: { x: 40, y: 52, size: 10.5, track: 1.6, text: "OFF THE CLOCK" },
    meta: { x: 840, y: 52, size: 10, track: 1.2, text: "SIDE ELEVATION / 01" },
    title: { x: 40, y: 94, size: 32 },
    art: { x: 40, y: 106, w: 800, h: 224 },
  },
  mobile: {
    w: 380,
    h: 212,
    cardRadius: 11,
    label: { x: 18, y: 34, size: 8, track: 1.4, text: "OFF THE CLOCK" },
    meta: { x: 362, y: 34, size: 7.5, track: 0.8, text: "SIDE ELEVATION" },
    title: { x: 18, y: 70, size: 26 },
    art: { x: 18, y: 92, w: 344, h: 116 },
  },
};

const carPath = path.join(ROOT, "scripts", "refs", "off-the-clock-car.png");
const car = fs.readFileSync(carPath);
const carW = car.readUInt32BE(16);
const carH = car.readUInt32BE(20);
const carB64 = car.toString("base64");

function fontStyle() {
  const normal = fs.readFileSync(path.join(FONTS, "instrument-serif.woff2")).toString("base64");
  const italic = fs.readFileSync(path.join(FONTS, "instrument-serif-italic.woff2")).toString("base64");
  return `@font-face{font-family:'Instrument Serif';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${normal}) format('woff2')}@font-face{font-family:'Instrument Serif';font-style:italic;font-weight:400;src:url(data:font/woff2;base64,${italic}) format('woff2')}`;
}

function buildCard(layout) {
  const { w, h } = layout;
  const { label, meta, title, art } = layout;
  const imgH = art.w / (carW / carH);
  const imgY = art.y + (art.h - imgH) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Off the clock: F1, planes, cars, bikes">
<title>Off the clock: F1, planes, cars, bikes</title>
<style>${fontStyle()}</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${layout.cardRadius}" fill="${colors.card}" stroke="${colors.border}"/>
<text x="${label.x}" y="${label.y}" font-family="${mono}" font-size="${label.size}" letter-spacing="${label.track}" fill="${colors.muted}">${label.text}</text>
<text x="${meta.x}" y="${meta.y}" text-anchor="end" font-family="${mono}" font-size="${meta.size}" letter-spacing="${meta.track}" fill="${colors.faint}">${meta.text}</text>
<text x="${title.x}" y="${title.y}" font-family="${serif}" font-size="${title.size}" fill="${colors.ink}"><tspan font-style="italic" fill="${colors.accent}">F1</tspan>, planes, cars, bikes</text>
<image x="${art.x}" y="${imgY.toFixed(2)}" width="${art.w}" height="${imgH.toFixed(2)}" preserveAspectRatio="xMidYMid meet" xlink:href="data:image/png;base64,${carB64}"/>
</svg>
`;
}

for (const [variant, layout] of Object.entries(layouts)) {
  const suffix = variant === "desktop" ? "" : "-mobile";
  const file = path.join(ASSETS, `off-the-clock${suffix}.svg`);
  fs.writeFileSync(`${file}.tmp`, buildCard(layout));
  fs.renameSync(`${file}.tmp`, file);
  console.log(`${path.relative(ROOT, file)} ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
console.log(`car source ${carW}x${carH}`);
