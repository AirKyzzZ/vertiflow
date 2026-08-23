import type { Locale } from './locale'

export type TimelineEntry = { when: string; what: string }

export type Dictionary = {
  nav: {
    start: string
    shop: string
    journal: string
    about: string
    cart: string
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
    craftEyebrow: string
    craftTitle: string
    craftStatement: string
    craftBodyPrimary: string
    craftBodySecondary: string
    crossSellEyebrow: string
    crossSellTitle: string
    crossSellLink: string
    addToCart: string
    addedToCart: string
    viewCart: string
    fulfilmentNote: string
    colourLabel: string
    sizeLabel: string
    oneSize: string
    modelLabel: string
    sizeGuideLink: string
  }
  footer: {
    tagline: string
    shopTitle: string
    shopEssentials: string
    shopSizeGuide: string
    shopShipping: string
    brandTitle: string
    brandStart: string
    brandAbout: string
    brandJournal: string
    brandContact: string
    legalTitle: string
    legalMentions: string
    legalTerms: string
    legalPrivacy: string
    copyrightTemplate: string
    clubNotePrefix: string
    clubNoteSuffix: string
  }
}

const fr: Dictionary = {
  nav: {
    start: 'Commencer',
    shop: 'Boutique',
    journal: 'Journal',
    about: 'À propos',
    cart: 'Panier',
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
        "Des vêtements qui tiennent le choc, et tout ce qu'il faut pour commencer.",
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
        "Les séances se passent sur le Bassin, en extérieur. La première est gratuite, et il n'y a rien à payer pour venir voir.",
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
        "VertiFlow n'est pas une marque de streetwear qui a choisi le parkour comme décor. Elle existe parce qu'un vêtement de sport classique ne survit pas à une vraie séance — fondée par un athlète FFG de niveau national qui savait exactement ce qui lâche.",
      bodySecondary:
        "Une blessure a tout mis en pause. Revenir a été plus dur que commencer, et c'est une des raisons pour lesquelles la porte reste ouverte ici.",
      link: "L'histoire complète →",
      timeline: [
        { when: '8 ans', what: 'FFG, niveau national' },
        { when: 'nov. 2024', what: 'VertiFlow' },
        { when: '—', what: 'Une blessure, puis un retour' },
        { when: "aujourd'hui", what: 'Neuf pièces, imprimées à la demande' },
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
    craftEyebrow: 'Fabrication',
    craftTitle: 'Fabriqué à la demande',
    craftStatement: "Ta pièce n'existe pas encore quand tu commandes.",
    craftBodyPrimary:
      'Rien ne dort en entrepôt ici. Chaque pièce est brodée ou imprimée après ta commande, jamais avant.',
    craftBodySecondary:
      "Compte 5 à 10 jours ouvrés. C'est le prix d'un stock qui n'existe pas, pas un retard : personne n'a produit ta pièce en trop, et personne ne la jettera dans six mois.",
    crossSellEyebrow: 'Aussi dans la boutique',
    crossSellTitle: 'Pour compléter',
    crossSellLink: 'Toute la boutique →',
    addToCart: 'Ajouter au panier',
    addedToCart: 'Ajouté au panier.',
    viewCart: 'Voir le panier →',
    fulfilmentNote: 'Imprimé et expédié à la demande. Compte 5 à 10 jours ouvrés.',
    colourLabel: 'Couleur',
    sizeLabel: 'Taille',
    oneSize: 'Taille unique',
    modelLabel: 'Modèle',
    sizeGuideLink: 'Guide des tailles →',
  },
  footer: {
    tagline: "La porte d'entrée vers le parkour, à porter. Bassin d'Arcachon.",
    shopTitle: 'Boutique',
    shopEssentials: "L'essentiel",
    shopSizeGuide: 'Guide des tailles',
    shopShipping: 'Livraison et paiement',
    brandTitle: 'La marque',
    brandStart: 'Commencer le parkour',
    brandAbout: 'Notre histoire',
    brandJournal: 'Journal',
    brandContact: 'Contact',
    legalTitle: 'Légal',
    legalMentions: 'Mentions légales',
    legalTerms: 'CGV',
    legalPrivacy: 'Confidentialité',
    copyrightTemplate: '© {year} VertiFlow — micro-entreprise',
    clubNotePrefix: 'Le club',
    clubNoteSuffix: 'est une association loi 1901 distincte.',
  },
}

const en: Dictionary = {
  nav: {
    start: 'Start',
    shop: 'Shop',
    journal: 'Journal',
    about: 'About',
    cart: 'Cart',
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
        'Clothes built to take a hit, and everything you need to get started.',
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
        "Sessions happen on the Bassin, outdoors. Your first one is free, and there's nothing to pay just to come watch.",
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
        "VertiFlow isn't a streetwear label that picked parkour as a backdrop. It exists because ordinary sportswear doesn't survive a real session — founded by a national-level FFG athlete who knew exactly what fails mid-session.",
      bodySecondary:
        "An injury put all of it on hold. The comeback was harder than starting ever was, and that's part of why the door stays open here.",
      link: 'The full story →',
      timeline: [
        { when: '8 years', what: 'FFG, national level' },
        { when: 'Nov. 2024', what: 'VertiFlow' },
        { when: '—', what: 'An injury, then a comeback' },
        { when: 'Today', what: 'Nine pieces, printed to order' },
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
    craftEyebrow: "How it's made",
    craftTitle: 'Made to order',
    craftStatement: "Your piece doesn't exist yet when you order it.",
    craftBodyPrimary:
      'Nothing sits in a warehouse here. Every piece is embroidered or printed after your order, never before.',
    craftBodySecondary:
      "Allow 5 to 10 working days. That's the cost of a stock that doesn't exist, not a delay: nobody overproduced your piece, and nobody will throw it out in six months.",
    crossSellEyebrow: 'Also in the shop',
    crossSellTitle: 'To go with it',
    crossSellLink: 'The full shop →',
    addToCart: 'Add to cart',
    addedToCart: 'Added to cart.',
    viewCart: 'View cart →',
    fulfilmentNote: 'Printed and shipped to order. Allow 5 to 10 working days.',
    colourLabel: 'Color',
    sizeLabel: 'Size',
    oneSize: 'One size',
    modelLabel: 'Model',
    sizeGuideLink: 'Size guide →',
  },
  footer: {
    tagline: "The door into parkour, worn. Bassin d'Arcachon, France.",
    shopTitle: 'Shop',
    shopEssentials: 'The essentials',
    shopSizeGuide: 'Size guide',
    shopShipping: 'Shipping and payment',
    brandTitle: 'The brand',
    brandStart: 'Start parkour',
    brandAbout: 'Our story',
    brandJournal: 'Journal',
    brandContact: 'Contact',
    legalTitle: 'Legal',
    legalMentions: 'Legal notice',
    legalTerms: 'Terms of sale',
    legalPrivacy: 'Privacy',
    copyrightTemplate: '© {year} VertiFlow — micro-entreprise',
    clubNotePrefix: 'The',
    clubNoteSuffix: 'club is a separate nonprofit association.',
  },
}

export const dictionaries: Record<Locale, Dictionary> = { fr, en }

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale]
}
