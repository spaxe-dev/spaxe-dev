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
  accent: "#0969da",
};

const serif = "'Instrument Serif', Georgia, serif";

const layouts = {
  desktop: {
    w: 880,
    h: 112,
    cardRadius: 14,
    name: { x: 440, y: 73, size: 50 },
  },
  mobile: {
    w: 380,
    h: 80,
    cardRadius: 11,
    name: { x: 190, y: 52, size: 30 },
  },
};

function fontStyle() {
  const normal = fs.readFileSync(path.join(FONTS, "instrument-serif.woff2")).toString("base64");
  const italic = fs.readFileSync(path.join(FONTS, "instrument-serif-italic.woff2")).toString("base64");
  return `@font-face{font-family:'Instrument Serif';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${normal}) format('woff2')}@font-face{font-family:'Instrument Serif';font-style:italic;font-weight:400;src:url(data:font/woff2;base64,${italic}) format('woff2')}`;
}

function buildBanner(layout) {
  const { w, h, name } = layout;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Aadit Ahire">
<title>Aadit Ahire</title>
<style>${fontStyle()}</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${layout.cardRadius}" fill="${colors.card}" stroke="${colors.border}"/>
<text x="${name.x}" y="${name.y}" text-anchor="middle" font-family="${serif}" font-size="${name.size}" fill="${colors.ink}">Aadit <tspan font-style="italic" fill="${colors.accent}">Ahire</tspan></text>
</svg>
`;
}

for (const [variant, layout] of Object.entries(layouts)) {
  const suffix = variant === "desktop" ? "" : "-mobile";
  const file = path.join(ASSETS, `name-banner${suffix}.svg`);
  fs.writeFileSync(`${file}.tmp`, buildBanner(layout));
  fs.renameSync(`${file}.tmp`, file);
  console.log(`${path.relative(ROOT, file)} ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
