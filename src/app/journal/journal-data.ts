export type JournalPost = {
  slug: string
  date: string
  dateISO: string
  title: string
  standfirst: string
  image: string
  imageAlt: string
}

const posts: JournalPost[] = [
  {
    slug: 'pkba-partenariat-2025',
    date: '18 août 2025',
    dateISO: '2025-08-18',
    title: "PKBA, un club de parkour sur le Bassin d'Arcachon",
    standfirst:
      "VertiFlow est une marque. PKBA est le club que le même fondateur a lancé à côté, pour s'entraîner sur le Bassin d'Arcachon.",
    image: '/images/site/divider-seawall.webp',
    imageAlt: "Le Bassin d'Arcachon, la nuit.",
  },
  {
    slug: 'la-teste-de-buch-2025',
    date: '8 mai 2025',
    dateISO: '2025-05-08',
    title: 'Championnats de France de parkour à La Teste-de-Buch',
    standfirst:
      "La 3ᵉ étape de la saison : un chrono record en speedrun, une triple vrille en freerun, plus de 400 participants sur le Bassin d'Arcachon.",
    image: '/images/lateste.jpg',
    imageAlt: 'Le lieu de la compétition de parkour à La Teste-de-Buch.',
  },
  {
    slug: 'metz-2025',
    date: '25 mars 2025',
    dateISO: '2025-03-25',
    title: "L'étape nationale de parkour à Metz",
    standfirst:
      'Plus de 400 athlètes, deux disciplines, et deux qualifiés pour les championnats du monde FISE.',
    image: '/images/metz.JPEG',
    imageAlt: 'Le hall de la compétition de parkour à Metz.',
  },
]

export function getJournalPosts(): JournalPost[] {
  return [...posts].sort((a, b) => b.dateISO.localeCompare(a.dateISO))
}

export function getJournalPost(slug: string): JournalPost | undefined {
  return posts.find((post) => post.slug === slug)
}
