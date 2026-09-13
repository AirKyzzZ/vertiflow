import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../../..");
const out = resolve(here, "build");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const slides = [
  {
    name: "slide-1",
    shot: "editorial/img-0867.webp",
    position: "50% 45%",
    kicker: "T-SHIRT CLIMB",
    headline: "LE TEE<br>CLIMB.",
    sub: "Ce qu’on porte à l’entraînement, et après.",
  },
  {
    name: "slide-2",
    shot: "editorial/img-0946.webp",
    position: "50% 40%",
    kicker: "COUPE DROITE",
    headline: "RIEN<br>N’ACCROCHE.",
    sub: "Matière épaisse, coupe droite. CLIMB imprimé au dos, en grand.",
  },
  {
    name: "slide-3",
    shot: "editorial/img-0914.webp",
    position: "62% 50%",
    kicker: "VERTIFLOW.FR",
    headline: "29,99 €.",
    sub: "Sur vertiflow.fr, lien en bio.",
  },
];

const page = (slide) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root { --ink:#0b0b0c; --paper:#f7f4ef; --accent:#e8912d; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1080px; height:1350px; }
  body {
    position:relative; overflow:hidden; background:var(--ink); color:var(--paper);
    font-family:Inter, system-ui, sans-serif; -webkit-font-smoothing:antialiased;
  }
  .shot {
    position:absolute; inset:0; width:100%; height:100%;
    object-fit:cover; object-position:${slide.position};
    filter:saturate(0.92) contrast(1.06);
  }
  .scrim {
    position:absolute; inset:0;
    background:
      linear-gradient(to top, rgba(11,11,12,0.96) 0%, rgba(11,11,12,0.78) 18%, rgba(11,11,12,0.34) 38%, rgba(11,11,12,0) 58%),
      linear-gradient(to bottom, rgba(11,11,12,0.55) 0%, rgba(11,11,12,0) 22%);
  }
  .warm {
    position:absolute; left:-260px; bottom:-360px; width:1200px; height:1200px;
    border-radius:50%; mix-blend-mode:screen;
    background:radial-gradient(circle at center, rgba(232,145,45,0.30) 0%, rgba(232,145,45,0.10) 38%, rgba(232,145,45,0) 66%);
  }
  header {
    position:absolute; top:64px; left:72px; right:72px;
    display:flex; align-items:center; justify-content:space-between;
  }
  .wordmark {
    font-family:Archivo, sans-serif; font-variation-settings:"wdth" 125;
    font-weight:800; font-size:30px; letter-spacing:0.01em;
  }
  .wordmark span { color:var(--accent); }
  .kicker {
    font-family:Archivo, sans-serif; font-variation-settings:"wdth" 112;
    font-weight:600; font-size:17px; letter-spacing:0.24em; color:rgba(247,244,239,0.72);
  }
  footer { position:absolute; left:72px; right:72px; bottom:82px; }
  .rule { width:104px; height:5px; background:var(--accent); margin-bottom:34px; }
  h1 {
    font-family:Archivo, sans-serif; font-variation-settings:"wdth" 125;
    font-weight:800; font-size:${slide.size ?? 112}px; line-height:0.92; letter-spacing:-0.021em;
    text-transform:uppercase; text-shadow:0 2px 40px rgba(0,0,0,0.45);
  }
  .sub {
    margin-top:26px; font-size:29px; line-height:1.4; color:rgba(247,244,239,0.84);
    max-width:760px;
  }
</style>
</head>
<body>
  <img class="shot" src="file://${repo}/public/images/photos/${slide.shot}">
  <div class="scrim"></div>
  <div class="warm"></div>
  <header>
    <div class="wordmark">VERTI<span>FLOW</span></div>
    <div class="kicker">${slide.kicker}</div>
  </header>
  <footer>
    <div class="rule"></div>
    <h1>${slide.headline}</h1>
    <p class="sub">${slide.sub}</p>
  </footer>
</body>
</html>`;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const slide of slides) {
  const html = resolve(out, `${slide.name}.html`);
  writeFileSync(html, page(slide));
  const big = resolve(out, `${slide.name}@2x.png`);
  execFileSync(chrome, [
    "--headless", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=2", "--window-size=1080,1350",
    "--virtual-time-budget=10000",
    `--screenshot=${big}`, `file://${html}`,
  ], { stdio: "ignore" });
  execFileSync("sips", ["-Z", "1350", big, "--out", resolve(here, `${slide.name}.png`)], { stdio: "ignore" });
  console.log(`rendered ${slide.name}.png`);
}
