export type RedirectRule = {
  source: string
  destination: string
  permanent: boolean
}

export function redirectMap(): RedirectRule[] {
  return [
    { source: '/products.html', destination: '/boutique', permanent: true },
    { source: '/tshirt-climb.html', destination: '/boutique/tshirt-climb', permanent: true },
    { source: '/hoodie-vf-definition.html', destination: '/boutique/hoodie-vf-definition', permanent: true },
    { source: '/casquette-vf.html', destination: '/boutique/casquette-vf', permanent: true },
    { source: '/shorts-performance-vf.html', destination: '/boutique/shorts-performance-vf', permanent: true },
    { source: '/coque-vf.html', destination: '/boutique/coque-iphone-vf', permanent: true },
    { source: '/debardeur-vf.html', destination: '/boutique/debardeur-vf', permanent: true },
    { source: '/cache-cou-vf.html', destination: '/boutique/cache-cou-vf', permanent: true },
    { source: '/bob-vf.html', destination: '/boutique/bob-vf', permanent: true },
    { source: '/short-confort-vf.html', destination: '/boutique/short-confort-vf', permanent: true },
    { source: '/checkout.html', destination: '/panier', permanent: true },
    { source: '/success.html', destination: '/commande/succes', permanent: true },
    { source: '/cancel.html', destination: '/commande/annulee', permanent: true },
    { source: '/conditions-generales-de-vente.html', destination: '/cgv', permanent: true },
    { source: '/mentions-legales.html', destination: '/mentions-legales', permanent: true },
    { source: '/politique-de-confidentialite.html', destination: '/confidentialite', permanent: true },
    { source: '/livraison-paiment.html', destination: '/livraison-et-paiement', permanent: true },
    { source: '/sign-in.html', destination: '/', permanent: true },
    { source: '/sign-up.html', destination: '/', permanent: true },
    { source: '/no-color.html', destination: '/boutique', permanent: true },
    { source: '/details-produit.html', destination: '/boutique', permanent: true },
    { source: '/product-detail.html', destination: '/boutique', permanent: true },
    { source: '/faq.html', destination: '/faq', permanent: true },
    { source: '/about.html', destination: '/a-propos', permanent: true },
    { source: '/blog.html', destination: '/journal', permanent: true },
    { source: '/contact.html', destination: '/contact', permanent: true },
    { source: '/guide-des-tailles.html', destination: '/guide-des-tailles', permanent: true },
    { source: '/metz-2025.html', destination: '/journal/metz-2025', permanent: true },
    { source: '/la-teste-de-buch-2025.html', destination: '/journal/la-teste-de-buch-2025', permanent: true },
    { source: '/pkba-partenariat-2025.html', destination: '/journal/pkba-partenariat-2025', permanent: true },
    { source: '/accessibilite.html', destination: '/mentions-legales', permanent: true },
    { source: '/conditions-utilisation.html', destination: '/mentions-legales', permanent: true },
    { source: '/propriete-intellectuelle.html', destination: '/mentions-legales', permanent: true },
  ]
}
