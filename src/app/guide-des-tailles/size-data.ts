export type MeasurementRow = {
  label: string
  values: Record<string, string>
}

export type SizedProduct = {
  slug: string
  name: string
  sizes: string[]
  fit: string
  fabric: string
  note?: string
  measurements: MeasurementRow[]
}

export type OneSizeProduct = {
  slug: string
  name: string
  mechanism: string
  fit: string
}

export const sizedProducts: SizedProduct[] = [
  {
    slug: 'tshirt-climb',
    name: 'T-shirt CLIMB',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    fit: 'Coupe droite, unisexe.',
    fabric: "Coton épais (170–180 g/m²), sans élasthanne. Prévois un peu d'aisance aux épaules si tu comptes bouger dedans.",
    measurements: [
      {
        label: 'Tour de poitrine (cm)',
        values: { S: '86–94', M: '97–104', L: '107–114', XL: '117–124', '2XL': '127–135' },
      },
      {
        label: 'Longueur (cm)',
        values: { S: '71', M: '74', L: '76', XL: '79', '2XL': '81' },
      },
    ],
  },
  {
    slug: 'hoodie-vf-definition',
    name: 'Hoodie VF Definition',
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
    fit: 'Coupe ample, épaules structurées, poche kangourou.',
    fabric: 'Molleton 65% coton / 35% polyester.',
    note: 'Cette coupe taille petit. Entre deux tailles, prends la plus grande.',
    measurements: [
      {
        label: 'Tour de poitrine (cm)',
        values: { S: '97–104', M: '107–114', L: '117–124', XL: '127–135', '2XL': '137–145' },
      },
      {
        label: 'Longueur (cm)',
        values: { S: '69', M: '71', L: '74', XL: '76', '2XL': '79' },
      },
    ],
  },
  {
    slug: 'debardeur-vf',
    name: 'Débardeur VF',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    fit: 'Coupe ajustée, unisexe.',
    fabric: "Coton léger (142 g/m²), sans élasthanne. Prends ta taille habituelle, pas celle du dessus : c'est fait pour rester près du corps.",
    measurements: [
      {
        label: 'Tour de poitrine (cm)',
        values: {
          XS: '79–86',
          S: '86–94',
          M: '97–104',
          L: '107–114',
          XL: '117–124',
          '2XL': '127–135',
        },
      },
      {
        label: 'Longueur (cm)',
        values: { XS: '66', S: '69', M: '71', L: '74', XL: '76', '2XL': '79' },
      },
    ],
  },
  {
    slug: 'shorts-performance-vf',
    name: 'Shorts Performance VF',
    sizes: ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL'],
    fit: 'Coupe régulière, taille élastique.',
    fabric: 'Polyester recyclé, extensible dans les deux sens, séchage rapide. Pensé pour la séance.',
    measurements: [
      {
        label: 'Tour de taille (cm)',
        values: { '2XS': '72', XS: '76', S: '80', M: '84', L: '92', XL: '100', '2XL': '108' },
      },
      {
        label: 'Tour de hanches (cm)',
        values: { '2XS': '90', XS: '94', S: '98', M: '102', L: '110', XL: '118', '2XL': '126' },
      },
    ],
  },
  {
    slug: 'short-confort-vf',
    name: 'Short Confort VF',
    sizes: ['2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'],
    fit: 'Coupe décontractée, taille élastique à cordon, poches mesh.',
    fabric: 'Polyester recyclé et élasthanne, extensible dans les quatre sens, séchage rapide. Le plus grand choix de tailles de la boutique : 2XS à 6XL.',
    measurements: [
      {
        label: 'Tour de taille (cm)',
        values: {
          '2XS': '72',
          XS: '76',
          S: '80',
          M: '84',
          L: '92',
          XL: '100',
          '2XL': '108',
          '3XL': '116',
          '4XL': '124',
          '5XL': '132',
          '6XL': '140',
        },
      },
      {
        label: 'Tour de hanches (cm)',
        values: {
          '2XS': '90',
          XS: '94',
          S: '98',
          M: '102',
          L: '110',
          XL: '118',
          '2XL': '126',
          '3XL': '134',
          '4XL': '142',
          '5XL': '150',
          '6XL': '158',
        },
      },
    ],
  },
]

export const oneSizeProducts: OneSizeProduct[] = [
  {
    slug: 'casquette-vf',
    name: 'Casquette VF',
    mechanism: 'Sangle réglable',
    fit: "6 panneaux, visière plate, sangle réglable à l'arrière. S'ajuste sur un tour de tête de 52 à 62 cm environ : elle va à la quasi-totalité des adultes.",
  },
  {
    slug: 'bob-vf',
    name: 'Bob VF',
    mechanism: 'Non réglable',
    fit: "Pas de sangle. Convient à un tour de tête d'environ 55 à 59 cm. Grand tour de tête : mesure-toi avant de commander, au-delà il sera juste.",
  },
  {
    slug: 'cache-cou-vf',
    name: 'Cache-cou VF',
    mechanism: 'Tissu extensible',
    fit: "Un tube sans couture en microfibre stretch (2 sens), pas une vraie taille : c'est l'élasticité qui s'adapte. Environ 43 cm de long à plat. Cache-cou, bandana ou bonnet fin, comme tu veux.",
  },
]
