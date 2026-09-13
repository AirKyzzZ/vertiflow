# Comeback post — caption

Posted: _(not yet)_

## Caption

J'ai arrêté de poster.

Blessure, puis la reprise qui traîne, puis l'excuse classique : pas le temps.

Pendant ce temps le club a continué sans moi. 80 licenciés au PKBA. Des gens qui ont
commencé à zéro l'année dernière et qui passent aujourd'hui des trucs qu'ils regardaient
sur Insta.

Ça m'a remis dedans.

VertiFlow reprend. Plus de contenu, une nouvelle direction visuelle, et des choses en cours
que je montrerai quand elles seront prêtes — pas avant.

Si tu as toujours voulu essayer le parkour et que tu n'as jamais osé : c'est exactement
pour toi que je remonte tout ça.

À bientôt.

#parkour #parkourfrance #bassindarcachon #arcachon #gironde #parkourlife #streetmovement

## What this post deliberately does not claim

No launch date. No "new website" claim — the new site is a draft preview with one page and
`vertiflow.fr` still serves the old one. No shop claim — checkout is fenced to test mode
with 11 of 16 environment variables missing on Netlify.

The only forward-looking line is unfalsifiable by design: *"quand elles seront prêtes, pas
avant."*

## Visual

`card.html` → rendered with headless Chrome at 2×, downscaled to 1080×1350.

Regenerate:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1080,1350 \
  --virtual-time-budget=8000 \
  --screenshot="$PWD/comeback-card@2x.png" "file://$PWD/card.html"
sips -Z 1350 comeback-card@2x.png --out comeback-card.png
```

Archivo is loaded as a variable font with the `wdth` axis and set via
`font-variation-settings: "wdth" 125`. There is no separate "Archivo Expanded" family on
Google Fonts, and `font-stretch` alone silently does nothing.
