import type { Locale } from './locale'

export type TimelineEntry = { when: string; what: string }

export type Dictionary = {
  nav: {
    start: string
    shop: string
    journal: string
    about: string
  }
  home: {
    seo: { title: string; description: string }
    hero: {
      eyebrow: string
      headingBefore: string
      headingAfter: string
      headingEmphasis: string
      intro: string
      ctaStart: string
      ctaShop: string
    }
    start: {
      number: string
      title: string
      statement: string
      bodyPrimary: string
      bodySecondary: string
      link: string
    }
    essentials: {
      number: string
      title: string
      viewAllTemplate: string
    }
    origin: {
      number: string
      title: string
      bodyPrimary: string
      bodySecondary: string
      link: string
      timeline: TimelineEntry[]
    }
  }
  shop: {
    seo: { title: string; description: string }
    number: string
    heading: string
    intro: string
    bandEyebrow: string
    bandLine: string
  }
  product: {
    crossSellEyebrow: string
    crossSellTitle: string
    crossSellLink: string
  }
}

const fr: Dictionary = {
  nav: {
    start: 'Commencer',
    shop: 'Boutique',
    journal: 'Journal',
    about: 'À propos',
  },
  home: {
    seo: {
      title: 'VertiFlow — la porte d’entrée vers le parkour',
      description:
        'Des vêtements de parkour faits pour bouger, et tout ce qu’il faut pour commencer. Bassin d’Arcachon.',
    },
    hero: {
      eyebrow: "Bassin d'Arcachon — depuis 2024",
      headingBefore: 'Apprends à passer,',
      headingAfter: 'pas à',
      headingEmphasis: 'contourner',
      intro:
        "Huit ans de compétition. Un club de 80 licenciés. Des vêtements faits pour bouger, et tout ce qu'il faut pour commencer.",
      ctaStart: "Venir s'entraîner",
      ctaShop: 'La boutique',
    },
    start: {
      number: '01',
      title: 'Commencer',
      statement: "Tu n'as besoin de rien savoir faire.",
      bodyPrimary:
        "Personne n'arrive en sachant. Le premier cours, tu vas rater des choses, et c'est exactement ce qu'on attend. On a des gens qui ont commencé le mois dernier.",
      bodySecondary:
        "Les séances se passent sur le Bassin, avec le club PKBA. La première est gratuite, et il n'y a rien à payer pour venir voir.",
      link: 'Comment venir →',
    },
    essentials: {
      number: '02',
      title: "L'essentiel",
      viewAllTemplate: 'Les {count} pièces →',
    },
    origin: {
      number: '03',
      title: "D'où ça vient",
      bodyPrimary:
        "VertiFlow n'est pas une marque de streetwear qui a choisi le parkour comme décor. Elle est née d'un athlète FFG de niveau national qui a fondé un club, et le club existe toujours.",
      bodySecondary:
        "Une blessure a tout mis en pause. Revenir a été plus dur que commencer, et c'est une des raisons pour lesquelles la porte reste ouverte ici.",
      link: "L'histoire complète →",
      timeline: [
        { when: '8 ans', what: 'FFG, niveau national' },
        { when: 'nov. 2024', what: 'VertiFlow' },
        { when: 'juil. 2025', what: 'PKBA, association loi 1901' },
        { when: '—', what: 'Reportage France 3 Nouvelle-Aquitaine' },
        { when: "aujourd'hui", what: '80+ licenciés' },
      ],
    },
  },
  shop: {
    seo: {
      title: 'Boutique',
      description: 'Neuf pièces VertiFlow, imprimées à la demande. Rien de saisonnier.',
    },
    number: '02',
    heading: 'Boutique',
    intro: 'Neuf pièces. Imprimées à la demande. Rien de saisonnier.',
    bandEyebrow: "Bassin d'Arcachon",
    bandLine: "Ce qu'on porte pour y retourner.",
  },
  product: {
    crossSellEyebrow: 'Aussi dans la boutique',
    crossSellTitle: 'Pour compléter',
    crossSellLink: 'Toute la boutique →',
  },
}

const en: Dictionary = {
  nav: {
    start: 'Start',
    shop: 'Shop',
    journal: 'Journal',
    about: 'About',
  },
  home: {
    seo: {
      title: 'VertiFlow — the door into parkour',
      description:
        'Parkour clothing built to move in, and everything you need to get started. Bassin d’Arcachon, France.',
    },
    hero: {
      eyebrow: "Bassin d'Arcachon — since 2024",
      headingBefore: 'Learn to pass.',
      headingAfter: 'Not to',
      headingEmphasis: 'go around',
      intro:
        'Eight years of competition. A club of 80 members. Clothes built to move in, and everything you need to get started.',
      ctaStart: 'Come train',
      ctaShop: 'Shop',
    },
    start: {
      number: '01',
      title: 'Start',
      statement: "You don't need to know how to do anything.",
      bodyPrimary:
        "Nobody shows up already knowing how. In your first class, you'll miss things, and that's exactly what we expect. Some of our members started just last month.",
      bodySecondary:
        "Sessions happen on the Bassin, with the PKBA club. Your first one is free, and there's nothing to pay just to come watch.",
      link: 'How to join →',
    },
    essentials: {
      number: '02',
      title: 'The essentials',
      viewAllTemplate: 'All {count} pieces →',
    },
    origin: {
      number: '03',
      title: 'Where this comes from',
      bodyPrimary:
        "VertiFlow isn't a streetwear label that picked parkour as a backdrop. It was started by a national-level FFG athlete who founded a club, and the club is still running.",
      bodySecondary:
        "An injury put all of it on hold. The comeback was harder than starting ever was, and that's part of why the door stays open here.",
      link: 'The full story →',
      timeline: [
        { when: '8 years', what: 'FFG, national level' },
        { when: 'Nov. 2024', what: 'VertiFlow' },
        { when: 'Jul. 2025', what: 'PKBA, a nonprofit association' },
        { when: '—', what: 'Featured on France 3 Nouvelle-Aquitaine' },
        { when: 'Today', what: '80+ members' },
      ],
    },
  },
  shop: {
    seo: {
      title: 'Shop',
      description: 'Nine VertiFlow pieces, printed to order. Nothing seasonal.',
    },
    number: '02',
    heading: 'Shop',
    intro: 'Nine pieces. Printed to order. Nothing seasonal.',
    bandEyebrow: "Bassin d'Arcachon",
    bandLine: 'What we wear to get back out there.',
  },
  product: {
    crossSellEyebrow: 'Also in the shop',
    crossSellTitle: 'To go with it',
    crossSellLink: 'The full shop →',
  },
}

export const dictionaries: Record<Locale, Dictionary> = { fr, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
