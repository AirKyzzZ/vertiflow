export type SpecRow = { label: string; value: string }

export type ProductCopy = {
  lead: string
  body: string
  specs: SpecRow[]
}

export const productCopy: Record<string, ProductCopy> = {
  'tshirt-climb': {
    lead: "Le t-shirt qu'on porte à l'entraînement, et après.",
    body: "Coupe droite, matière épaisse, rien qui accroche pendant le mouvement. CLIMB est imprimé au dos, en grand.",
    specs: [
      { label: 'Matière', value: 'Coton épais, doux au toucher' },
      { label: 'Coupe', value: 'Droite, unisexe' },
      { label: 'Impression', value: 'Numérique, à la demande' },
      { label: 'Entretien', value: "30°, à l'envers, pas de sèche-linge" },
    ],
  },
  'hoodie-vf-definition': {
    lead: 'Le hoodie des séances qui commencent tôt.',
    body: 'Molleton épais, capuche généreuse, poche kangourou. Il te tient chaud entre deux passages.',
    specs: [
      { label: 'Matière', value: 'Molleton gratté, intérieur doux' },
      { label: 'Coupe', value: 'Ample, épaules structurées' },
      { label: 'Impression', value: 'Numérique, à la demande' },
      { label: 'Entretien', value: "30°, à l'envers" },
    ],
  },
  'casquette-vf': {
    lead: 'Le repère du club, discret devant.',
    body: 'Casquette structurée, visière plate, sangle réglable à l’arrière. Elle va avec tout le reste.',
    specs: [
      { label: 'Matière', value: 'Coton twill' },
      { label: 'Réglage', value: 'Sangle ajustable, taille unique' },
      { label: 'Marquage', value: "Logo VertiFlow à l'avant" },
      { label: 'Entretien', value: 'Nettoyage à la main' },
    ],
  },
  'shorts-performance-vf': {
    lead: 'Pour bouger sans y penser.',
    body: 'Léger, respirant, taille élastique. Tu sautes, tu réceptionnes, il suit.',
    specs: [
      { label: 'Matière', value: 'Tissu technique léger, respirant' },
      { label: 'Coupe', value: 'Taille élastique, coupe ample' },
      { label: 'Impression', value: 'Numérique, à la demande' },
      { label: 'Entretien', value: '30°, séchage rapide' },
    ],
  },
  'coque-iphone-vf': {
    lead: 'Une coque fine, qui protège sans épaissir.',
    body: 'Le logo VertiFlow au dos, pour le téléphone qui filme tes sessions.',
    specs: [
      { label: 'Matériau', value: 'Polycarbonate rigide' },
      { label: 'Protection', value: 'Bords surélevés, coins renforcés' },
      { label: 'Compatibilité', value: 'Choisis ton modèle ci-dessous' },
      { label: 'Impression', value: 'Numérique, à la demande' },
    ],
  },
  'debardeur-vf': {
    lead: 'Pour les jours où la session pousse au bout.',
    body: "Léger, coupe ajustée, ça ne gêne jamais l'épaule.",
    specs: [
      { label: 'Matière', value: 'Coton léger, respirant' },
      { label: 'Coupe', value: 'Ajustée, unisexe' },
      { label: 'Impression', value: 'Numérique, à la demande' },
      { label: 'Entretien', value: "30°, à l'envers" },
    ],
  },
  'cache-cou-vf': {
    lead: 'Un tube en tissu technique, à porter comme tu veux.',
    body: 'Cache-cou, bandana ou bonnet fin. Il se glisse dans une poche et sert dès que le vent tourne.',
    specs: [
      { label: 'Matière', value: 'Microfibre technique extensible' },
      { label: 'Forme', value: 'Tube sans couture' },
      { label: 'Usage', value: 'Cache-cou, bandana, bonnet fin' },
      { label: 'Entretien', value: '30°, séchage rapide' },
    ],
  },
  'bob-vf': {
    lead: 'Pour les sessions en plein soleil.',
    body: 'Logo discret, bord souple. Tu le roules dans ton sac sans le déformer.',
    specs: [
      { label: 'Matière', value: 'Coton twill léger' },
      { label: 'Forme', value: 'Bord souple, ajustable' },
      { label: 'Protection', value: 'Ombre sur le visage et la nuque' },
      { label: 'Entretien', value: 'Nettoyage à la main' },
    ],
  },
  'short-confort-vf': {
    lead: 'Le short du quotidien, hors entraînement.',
    body: 'Coton doux, coupe décontractée, la pièce que tu mets en rentrant.',
    specs: [
      { label: 'Matière', value: 'Coton molletonné, doux' },
      { label: 'Coupe', value: 'Décontractée, taille élastique' },
      { label: 'Impression', value: 'Numérique, à la demande' },
      { label: 'Entretien', value: "30°, à l'envers" },
    ],
  },
}
