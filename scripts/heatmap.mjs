import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOGIN = process.env.GH_PROFILE_USER || "spaxe-dev";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "assets");
const FONTS = path.join(ROOT, "scripts", "fonts");
const SOURCE = `https://github.com/users/${LOGIN}/contributions`;
const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const palettes = {
  light: {
    card: "#f6f8fa",
    border: "#d1d9e0",
    ink: "#1f2328",
    muted: "#59636e",
    faint: "#6e7781",
    accent: "#0969da",
    blue: ["#d6dde6", "#b3cdee", "#89b0e4", "#578dd4", "#2869bb", "#0a56b0"],
  },
};

const layouts = {
  desktop: {
    w: 880,
    h: 244,
    gx: 42,
    gy: 100,
    cell: 12,
    step: 15,
    radius: 3,
    cardRadius: 14,
    title: { x: 40, y: 56, size: 34 },
    meta: { x: 840, y: 56, size: 11.5, track: 1.2, text: "REFRESHED EVERY 15 MIN" },
    month: { y: 90, size: 10.5 },
    legend: { y: 224, size: 10.5, swatch: 11, step: 14, swatchRadius: 2.5 },
    stat: { x: 42, y: 224, size: 10.5, track: 0.5 },
  },
  mobile: {
    w: 380,
    h: 164,
    pad: 18,
    gx: 18,
    gy: 66,
    cell: 5.2,
    step: 6.5,
    radius: 1.5,
    cardRadius: 11,
    title: { x: 18, y: 40, size: 26 },
    meta: { x: 362, y: 40, size: 9, track: 0.6, text: "REFRESHED 15 MIN" },
    month: { y: 122, size: 8 },
    legend: { y: 146, size: 8, swatch: 7, step: 8.5, swatchRadius: 1.5 },
    stat: { x: 18, y: 146, size: 8, track: 0.3 },
  },
};

const animation = `.cell{transform-box:fill-box;transform-origin:center;animation:cell-in .5s cubic-bezier(.2,.7,.2,1) backwards}@keyframes cell-in{from{opacity:.45;transform:scale(.72)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.cell{animation:none}}`;

const font = "ui-sans-serif, -apple-system, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const serif = "'Instrument Serif', Georgia, serif";

function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function level(count) {
  if (count === 0) return 0;
  if (count <= 5) return 1;
  if (count <= 15) return 2;
  if (count <= 30) return 3;
  if (count <= 50) return 4;
  return 5;
}

async function collect() {
  const response = await fetch(SOURCE, {
    headers: {
      "User-Agent": `${LOGIN}-profile-readme/1.0`,
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`contributions request failed: ${response.status}`);

  const html = await response.text();
  const counts = new Map();
  for (const match of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g)) {
    const text = match[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const value = /no contributions/i.test(text) ? 0 : Number((text.match(/^(\d+)/) || [0, 0])[1]);
    counts.set(match[1], Number.isFinite(value) ? value : 0);
  }

  const found = [];
  for (const match of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = match[0];
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/);
    const id = tag.match(/\bid="([^"]+)"/);
    if (!date || !id) continue;
    found.push({ date: date[1], count: counts.get(id[1]) ?? 0 });
  }
  found.sort((a, b) => a.date.localeCompare(b.date));

  if (found.length < 300) throw new Error(`expected a year of calendar cells, found ${found.length}`);

  const byDate = new Map(found.map((day) => [day.date, day.count]));
  const first = Date.parse(`${found[0].date}T00:00:00Z`);
  const last = Date.parse(`${found[found.length - 1].date}T00:00:00Z`);
  const series = [];
  for (let time = first; time <= last; time += DAY) {
    const date = new Date(time).toISOString().slice(0, 10);
    series.push({ date, count: byDate.get(date) ?? 0 });
  }

  const total = series.reduce((sum, day) => sum + day.count, 0);
  if (total === 0) throw new Error("contribution total is zero; refusing to render an empty card");
  return { series, total };
}

function fontStyle() {
  const normal = fs.readFileSync(path.join(FONTS, "instrument-serif.woff2")).toString("base64");
  const italic = fs.readFileSync(path.join(FONTS, "instrument-serif-italic.woff2")).toString("base64");
  return `@font-face{font-family:'Instrument Serif';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,${normal}) format('woff2')}@font-face{font-family:'Instrument Serif';font-style:italic;font-weight:400;src:url(data:font/woff2;base64,${italic}) format('woff2')}`;
}

function buildCard(layout, palette, data) {
  const { series, total } = data;
  const first = new Date(`${series[0].date}T00:00:00Z`);
  const lead = first.getUTCDay();
  const cells = series.map((day, index) => {
    const slot = lead + index;
    return { ...day, col: Math.floor(slot / 7), row: slot % 7 };
  });
  const monthLabels = [];
  const seenMonths = new Set();
  for (const cell of cells) {
    const date = new Date(`${cell.date}T00:00:00Z`);
    if (cell.row !== 0 || date.getUTCDate() > 7) continue;
    const key = cell.date.slice(0, 7);
    if (seenMonths.has(key)) continue;
    seenMonths.add(key);
    monthLabels.push({ col: cell.col, text: MONTHS[date.getUTCMonth()] });
  }

  const rects = cells
    .map((cell) => {
      const delay = (0.1 + cell.col * 0.012 + cell.row * 0.006).toFixed(3);
      return `<rect class="cell" style="animation-delay:${delay}s" x="${layout.gx + cell.col * layout.step}" y="${layout.gy + cell.row * layout.step}" width="${layout.cell}" height="${layout.cell}" rx="${layout.radius}" fill="${palette.blue[level(cell.count)]}"/>`;
    })
    .join("");

  const right = layout.w - (layout.pad ?? 40);
  const swatchRun = 5 * layout.legend.step + layout.legend.swatch;
  const moreWidth = layout.legend.size * 2.6;
  const swatchEnd = right - moreWidth - 8;
  const swatchStart = swatchEnd - swatchRun;

  const months = monthLabels
    .map((label) => `<text x="${layout.gx + label.col * layout.step}" y="${layout.month.y}" font-family="${mono}" font-size="${layout.month.size}" fill="${palette.muted}">${label.text}</text>`)
    .join("");

  const swatches = palette.blue
    .map((color, index) => `<rect x="${swatchStart + index * layout.legend.step}" y="${layout.legend.y - layout.legend.swatch + 1}" width="${layout.legend.swatch}" height="${layout.legend.swatch}" rx="${layout.legend.swatchRadius}" fill="${color}"/>`)
    .join("");

  const legend = `<text x="${swatchStart - 8}" y="${layout.legend.y}" text-anchor="end" font-family="${mono}" font-size="${layout.legend.size}" fill="${palette.muted}">less</text>${swatches}<text x="${right - moreWidth}" y="${layout.legend.y}" font-family="${mono}" font-size="${layout.legend.size}" fill="${palette.muted}">more</text>`;

  const count = new Intl.NumberFormat("en-US").format(total);
  const monthYear = (date) => `${MONTHS[new Date(`${date}T00:00:00Z`).getUTCMonth()].toUpperCase()} ${date.slice(0, 4)}`;
  const range = `${monthYear(series[0].date)} / ${monthYear(series[series.length - 1].date)}`;
  const stat = layout.stat
    ? `<text x="${layout.stat.x}" y="${layout.stat.y}" font-family="${mono}" font-size="${layout.stat.size}" letter-spacing="${layout.stat.track}" fill="${palette.faint}">${count} CONTRIBUTIONS / ${range}</text>`
    : "";
  const label = `Contribution graph: ${count} contributions between ${series[0].date} and ${series[series.length - 1].date}`;
  const w = layout.w;
  const h = layout.h;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeXml(label)}">
<title>${escapeXml(label)}</title>
<style>${fontStyle()}${animation}</style>
<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${layout.cardRadius}" fill="${palette.card}" stroke="${palette.border}"/>
<text x="${layout.title.x}" y="${layout.title.y}" font-family="${serif}" font-size="${layout.title.size}" fill="${palette.ink}">Every day, <tspan font-style="italic" fill="${palette.accent}">in blue</tspan></text>
<text x="${layout.meta.x}" y="${layout.meta.y}" text-anchor="end" font-family="${mono}" font-size="${layout.meta.size}" letter-spacing="${layout.meta.track}" fill="${palette.muted}">${layout.meta.text}</text>
${rects}
${months}
${legend}${stat}
</svg>
`;
}

const data = await collect();
const outputs = [];
for (const [variant, layout] of Object.entries(layouts)) {
  for (const [theme, palette] of Object.entries(palettes)) {
    const suffix = variant === "desktop" ? "" : "-mobile";
    outputs.push([`heatmap-${theme}${suffix}.svg`, buildCard(layout, palette, data)]);
  }
}

for (const [name, svg] of outputs) {
  const file = path.join(ASSETS, name);
  fs.writeFileSync(`${file}.tmp`, svg);
  fs.renameSync(`${file}.tmp`, file);
  console.log(`${path.relative(ROOT, file)} ${(svg.length / 1024).toFixed(1)} KB`);
}
console.log(`${data.total} contributions across ${data.series.length} days (${data.series[0].date} to ${data.series[data.series.length - 1].date})`);
