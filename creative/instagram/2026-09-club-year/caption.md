# L'année du club — carrousel 6 slides

Compte : **@vertiflow**. Posted: _(not yet)_

## Ordre des slides

1. `slide-1.png` — "UN AN SANS POSTER."
2. `slide-2.png` — "J'EN AI MONTÉ DEUX."
3. `slide-3.png` — "LE CLUB A UN AN."
4. `slide-4.png` — "AUJOURD'HUI, 200 M²."
5. `slide-5.png` — "NEUF PODIUMS."
6. `slide-6.png` — "LA RENTRÉE A COMMENCÉ LUNDI."

## Caption

Un an sans rien poster ici. Voilà pourquoi.

J'ai monté deux structures en parallèle. VertiFlow, la marque, une micro-entreprise. Et le
PKBA, un club de parkour sur le Bassin d'Arcachon, une association loi 1901. Deux
structures séparées, un seul moi.

Le club a ouvert en septembre 2025, sans local. Aujourd'hui il a son hangar de 200 m² à
Gujan-Mestras, 66 adhérents, des créneaux cinq jours par semaine dès 3 ans. Entre les deux
il y a eu un reportage France 3 en janvier, cinq podiums à Rennes en mars, et quatre au
championnat de France à Bourges en juin.

La saison 2026/2027 a repris lundi. La première séance est offerte, sans engagement. Les
créneaux loisir sont ouverts, la prépa et la compétition se font sur sélection. Tout est
sur pkba.vertiflow.fr.

VertiFlow reprend aussi. Le site est refait et la boutique est en ligne, c'était l'autre
moitié de l'année.

#parkour #parkourfrance #bassindarcachon #gujanmestras #arcachon #lateste #gironde #parkourlife

## Frontière juridique — à ne pas franchir

VertiFlow est une micro-entreprise, le PKBA une association loi 1901 avec des dossiers
CERFA de subvention ouverts et Maxime pour trésorier. Le post dit que la même personne a
monté les deux, ce que `docs/brand/narrative.md` autorise explicitement. Il ne dit **pas**
que VertiFlow équipe le club, ne fait aucun lien entre les ventes et l'activité de
l'association, et n'utilise aucun visuel du club. Ces trois lignes sont interdites, pas
déconseillées.

## Faits, et leur source dans le repo PKBA

66 adhérents (`components/Features.tsx`) · hangar 200 m², 4 Av. de l'Actipôle, Gujan-Mestras
(`content/club.ts`) · ouverture 16/09/2025 et reportage France 3 du 15/01/2026
(`content/articles.ts`) · 5 podiums Rennes 14-15/03/2026 et 4 podiums Bourges 13-14/06/2026
(`content/articles.ts`) · reprise 07/09/2026 (`content/schedule.ts`, `SEASON_START`) ·
prépa et compétition sur sélection (`content/schedule.ts`) · première séance offerte
(`flyers/rentree-2026-2027/brief.md`).

## Regénérer

```bash
node creative/instagram/2026-09-club-year/build.mjs
```
