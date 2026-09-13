import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "build");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const shell = (body, extra = "") => `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root { --ink:#0b0b0c; --paper:#f7f4ef; --accent:#e8912d; --muted:#6f6f77; }
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:1400px; height:1400px; }
  body {
    background:var(--ink); color:var(--paper);
    font-family:Inter, system-ui, sans-serif; -webkit-font-smoothing:antialiased;
    display:flex; flex-direction:column; justify-content:center; align-items:center;
    position:relative; overflow:hidden;
  }
  .art { display:flex; flex-direction:column; align-items:center; }
  .wide { font-family:Archivo, sans-serif; font-variation-settings:"wdth" 125; font-weight:800; text-transform:uppercase; }
  .eyebrow {
    font-family:Archivo, sans-serif; font-variation-settings:"wdth" 112; font-weight:600;
    font-size:26px; letter-spacing:0.34em; color:var(--accent); text-transform:uppercase;
  }
  .sig {
    position:absolute; bottom:70px; left:0; right:0; text-align:center;
    font-family:Archivo, sans-serif; font-variation-settings:"wdth" 112; font-weight:600;
    font-size:19px; letter-spacing:0.4em; color:var(--muted); text-transform:uppercase;
  }
  ${extra}
</style></head><body>${body}<div class="sig">By VertiFlow</div></body></html>`;

const concepts = [
  {
    name: "concept-a-passer",
    body: `<div class="art">
      <div class="eyebrow" style="margin-bottom:34px">Apprends à</div>
      <div class="wide" style="font-size:250px;line-height:0.84;letter-spacing:-0.025em">Passer</div>
      <div class="strike"><span class="wide" style="font-size:112px;letter-spacing:-0.02em;color:#5a5a62">Contourner</span></div>
    </div>`,
    extra: `.strike { position:relative; margin-top:26px; }
      .strike::after { content:""; position:absolute; left:-14px; right:-14px; top:52%; height:9px; background:var(--accent); }`,
  },
  {
    name: "concept-b-zero",
    body: `<div class="art">
      <div class="wide" style="font-size:460px;line-height:0.8;letter-spacing:-0.04em">0</div>
      <div class="rule"></div>
      <div class="wide" style="font-size:62px;line-height:1.05;letter-spacing:0.01em;text-align:center;max-width:1020px">Tout le monde<br>commence ici</div>
    </div>`,
    extra: `.rule { width:200px; height:8px; background:var(--accent); margin:44px 0 40px; }`,
  },
  {
    name: "concept-c-bassin",
    body: `<div class="art" style="align-items:stretch;width:1010px">
      <div class="eyebrow" style="margin-bottom:40px;text-align:left">Terrain</div>
      <div class="row"><span class="wide" style="font-size:132px;letter-spacing:-0.022em">La Teste</span></div>
      <div class="row"><span class="wide" style="font-size:132px;letter-spacing:-0.022em">Gujan</span></div>
      <div class="row" style="border-bottom:none"><span class="wide" style="font-size:132px;letter-spacing:-0.022em">Bordeaux</span></div>
    </div>`,
    extra: `.row { border-bottom:5px solid var(--accent); padding:16px 0 22px; }`,
  },
];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const c of concepts) {
  const html = resolve(out, `${c.name}.html`);
  writeFileSync(html, shell(c.body, c.extra));
  const big = resolve(out, `${c.name}@2x.png`);
  execFileSync(chrome, [
    "--headless", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=2", "--window-size=1400,1400",
    "--virtual-time-budget=10000", `--screenshot=${big}`, `file://${html}`,
  ], { stdio: "ignore" });
  execFileSync("sips", ["-Z", "1400", big, "--out", resolve(here, `${c.name}.png`)], { stdio: "ignore" });
  console.log(`rendered ${c.name}.png`);
}
