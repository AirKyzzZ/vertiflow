import type { ReactNode } from 'react'
import Link from 'next/link'

export type FaqItem = {
  question: string
  answer: ReactNode
}

export type FaqGroup = {
  title: string
  items: FaqItem[]
}

export const faqGroups: FaqGroup[] = [
  {
    title: 'Commande et livraison',
    items: [
      {
        question: 'Quels moyens de paiement acceptez-vous ?',
        answer: (
          <>
            Carte bancaire (Visa, Mastercard...), via Stripe. Paiement sécurisé, chiffrement
            SSL 256 bits. Pas de chèque, pas de virement.
          </>
        ),
      },
      {
        question: 'Livrez-vous en dehors de la France ?',
        answer: (
          <>
            Oui, en Europe et dans le reste du monde. Tarifs et délais changent selon la
            destination, détail sur{' '}
            <Link href="/livraison-et-paiement">Livraison et paiement</Link>.
          </>
        ),
      },
      {
        question: 'Quels sont les délais de livraison ?',
        answer: (
          <>
            Chaque pièce est imprimée à la demande : la production fait partie du délai. En
            France, compte 3 à 6 jours ouvrés. En Europe, 7 à 9 jours. Dans le reste du
            monde, 9 à 15 jours. Détail transporteur par transporteur sur{' '}
            <Link href="/livraison-et-paiement">Livraison et paiement</Link>.
          </>
        ),
      },
      {
        question: "Puis-je modifier ou annuler ma commande après l'achat ?",
        answer: (
          <>
            Pas une fois la production lancée : chaque pièce est fabriquée à la demande,
            spécifiquement pour toi. Écris vite à{' '}
            <a href="mailto:sav@vertiflow.fr">sav@vertiflow.fr</a>, on regarde ce qu&apos;on
            peut encore faire.
          </>
        ),
      },
      {
        question: 'Comment suivre ma commande ?',
        answer: <>Un lien de suivi Printful arrive par email dès que ta commande part.</>,
      },
      {
        question: 'La taille ne me va pas, je peux la retourner ?',
        answer: (
          <>
            Vérifie le <Link href="/guide-des-tailles">guide des tailles</Link> avant de
            commander : chaque pièce est imprimée à la demande, spécifiquement pour toi. Le
            droit de rétractation légal de 14 jours s&apos;applique quand même, pour une
            pièce non portée et dans son emballage d&apos;origine : conditions complètes
            dans les <Link href="/cgv">CGV</Link>. Défaut ou erreur d&apos;impression : on
            remplace, écris à <a href="mailto:sav@vertiflow.fr">sav@vertiflow.fr</a>.
          </>
        ),
      },
      {
        question: 'Proposez-vous des réductions ?',
        answer: (
          <>
            Pas de newsletter pour l&apos;instant. Les codes promo, quand il y en a, sont
            annoncés sur{' '}
            <a href="https://www.instagram.com/vertiflowfreerun/">Instagram</a>.
          </>
        ),
      },
    ],
  },
  {
    title: 'Les produits',
    items: [
      {
        question: "D'où vient VertiFlow ?",
        answer: (
          <>
            Du parkour, pas l&apos;inverse. Les pièces sont dessinées à partir de ce que
            le mouvement exige d&apos;un vêtement. L&apos;histoire complète est sur{' '}
            <Link href="/">la page d&apos;accueil</Link>.
          </>
        ),
      },
      {
        question: 'Qui fabrique les produits ?',
        answer: (
          <>
            Printful, à la demande : chaque commande déclenche l&apos;impression, rien
            n&apos;est produit à l&apos;avance. Les vêtements eux-mêmes viennent de marques
            comme Gildan, Bella+Canvas ou Yupoong.
          </>
        ),
      },
      {
        question: 'Quelles matières utilisez-vous ?',
        answer: (
          <>
            Ça change par pièce : coton épais pour les t-shirts, molleton pour le hoodie,
            polyester recyclé extensible pour les shorts techniques. Détail sur chaque fiche
            produit et sur le <Link href="/guide-des-tailles">guide des tailles</Link>.
          </>
        ),
      },
      {
        question: 'Comment choisir ma taille ?',
        answer: (
          <>
            Ça dépend de la pièce : coupe ajustée pour le débardeur, ample pour le hoodie,
            taille élastique pour les shorts. Le{' '}
            <Link href="/guide-des-tailles">guide des tailles</Link> donne les mensurations
            précises, pièce par pièce, et comment te mesurer.
          </>
        ),
      },
      {
        question: 'Comment entretenir mes vêtements ?',
        answer: (
          <>
            30° maximum, à l&apos;envers, pas de sèche-linge. Ne repasse jamais directement
            sur l&apos;impression.
          </>
        ),
      },
      {
        question: 'Vos vêtements sont-ils unisexes ?',
        answer: <>Oui, toutes les coupes sont unisexes.</>,
      },
      {
        question: 'Ça convient pour le parkour ?',
        answer: (
          <>
            Les shorts Performance et Confort sont pensés pour bouger : tissu extensible,
            séchage rapide. Le t-shirt, le hoodie et le débardeur sont en coton, sans
            stretch, parfaits avant et après une session. Détail sur le{' '}
            <Link href="/guide-des-tailles">guide des tailles</Link>.
          </>
        ),
      },
    ],
  },
]
