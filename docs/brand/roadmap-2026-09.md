# Roadmap — septembre / octobre 2026

Écrit le 2026-09-10, après remise à plat du compte Instagram et de l'état du site.

## La contrainte, dite franchement

Le compte a 108 abonnés, 40 posts, zéro Reel, et suit 2 comptes. Maxime dispose de moins
d'une heure par semaine, ne filmera pas, et maintient l'interdiction d'imagerie IA
documentaire. Ces trois choix sont légitimes et ils plafonnent la croissance : sur
Instagram en 2026, la portée hors abonnés vient de la vidéo courte, et rien d'autre ne la
remplace.

Donc le plan ci-dessous n'est pas un plan de croissance rapide. C'est un plan de
crédibilité : que le compte ait l'air vivant, régulier et sérieux, et qu'il convertisse les
gens qui le trouvent, plutôt que d'essayer d'en attirer beaucoup. La croissance viendra du
club et du référencement local, pas du fil Instagram.

## Indicateur unique

**Abonnés gagnés par semaine.** Point de départ 108 le 2026-09-10. Un gain de 30 à 60 sur
le mois est réaliste dans ces contraintes. Au-delà, ce serait de la chance, pas le plan.

Secondaire, à regarder une fois par semaine dans le Dashboard : visites de profil et clics
sur le lien en bio.

## Répartition des rôles

Claude prépare les visuels, écrit les captions, programme les posts et documente tout.
Maxime valide avant publication et répond aux commentaires et aux DM. La réponse aux
commentaires ne se délègue pas : c'est le seul signal qui pousse un post d'un compte
dormant, et c'est aussi ce qui transforme un curieux en essai au club.

## Calendrier, deux posts par semaine

Le mercredi et le dimanche, 18h30. Tout est produit à partir des 21 photos de Bordeaux et
des photos du club déjà versionnées dans le repo PKBA. Aucun tournage, aucune génération.

| Date | Sujet | Sert quoi | Source visuelle |
|---|---|---|---|
| jeu 10/09 | « On a tout refait » — publié | notoriété | `2026-09-retour` |
| dim 13/09 | « L'année du club » — programmé | club | `2026-09-club-year` |
| mer 17/09 | T-shirt CLIMB porté | boutique | `img-0808`, `img-0946` |
| dim 21/09 | Où s'entraîner à Bordeaux, les vrais spots | audience locale | `img-1136`, `img-1161` |
| mer 24/09 | Hoodie VF Definition, le dos imprimé | boutique | `img-6549`, `img-6561` |
| dim 28/09 | Trois choses à savoir avant ta première séance | club | `img-0839`, club |
| mer 01/10 | Les shorts, portés là où on s'entraîne | boutique | `img-1153`, `img-1171` |
| dim 05/10 | Stage de la Toussaint, 23 au 30 octobre | club | photos club |
| mer 08/10 | Bob et casquette | boutique | `img-0737`, `img-0931` |
| dim 12/10 | Un mois de reprise, ce qui a changé | notoriété | `img-1026`, `img-0993` |

Un post boutique pour un post club ou marque. La règle des captions de lancement tient :
jamais plus d'un post produit sur quatre qui ouvre sur le prix.

## Stories

Le club republie les posts VertiFlow en story, jamais l'inverse et jamais de post en
collaboration. Deux comptes distincts, aucun lockup, aucun contenu co-signé. Cette règle
vient des dossiers CERFA du PKBA, elle n'est pas négociable.

## Ce qui doit être corrigé sur le compte

1. **La bio.** Elle est restée en version emoji, à l'opposé du ton de `BRAND.md`. À
   réécrire en phrases courtes, tutoiement, sans hype.
2. **Le compte ne suit que 2 comptes.** Suivre les clubs, spots et traceurs de la région
   coûte cinq minutes et rend le compte crédible.
3. **Les stories à la une** sont vides ou obsolètes.

## Site

Ordre décidé : débloquer les commandes, merger, puis SEO local, puis conversion.

**Bloquant, avant tout le reste.** `EMAILJS_PRIVATE_KEY` est absente du contexte production
et les deux variables de template pointent sur le même template. Une commande payée renvoie
500 : pas de brouillon Printful, pas d'email. Le post du 10/09 envoie déjà du trafic vers la
boutique, donc ce trou est ouvert en ce moment même.

**Ensuite, SEO local.** Le site est connecté au repo GitHub côté Netlify, donc merger la
PR #1 suffit à déployer. Cibles : « parkour Bordeaux », « parkour Bassin d'Arcachon »,
« commencer le parkour ». `/commencer` est déjà la bonne page d'atterrissage, il lui manque
le balisage et les pages de destination locales. `docs/research/seo-geo-conversion.md`
contient une liste d'actions différées à reprendre ici.

**Enfin, conversion.** Utile seulement une fois qu'il y a du trafic à convertir. À ce
moment-là : bandeau de réassurance sur les fiches produit, schéma FAQPage, et le tunnel
d'achat.

## Ce qui n'est pas automatisable, et pourquoi

Un agent programmé tourne dans le cloud et n'a aucun accès au Chrome de Maxime. Il ne peut
donc pas publier sur Instagram. Ce qui est automatisable, c'est la préparation : génération
des visuels, rédaction des captions, mise en file. La publication passe par une session
avec le navigateur, et chaque post est validé avant départ.
