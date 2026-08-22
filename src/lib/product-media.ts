export const productMedia: Record<string, Record<string, string[]>> = {
  'tshirt-climb': {
    Noir: [
      '/images/product/front_tshirt.png',
      '/images/product/back_tshirt.png',
      '/images/product/tshirt4.png',
      '/images/product/tshirt3.png',
    ],
    Blanc: [
      '/images/product/front_tshirt_white.png',
      '/images/product/back_tshirt_white.png',
      '/images/product/tshirt3_white.png',
      '/images/product/tshirt4_white.png',
    ],
  },
  'hoodie-vf-definition': {
    Noir: [
      '/images/product/front_hoodie.png',
      '/images/product/back_hoodie.png',
      '/images/product/hoodie3.png',
      '/images/product/hoodie4.png',
    ],
    Blanc: [
      '/images/product/front_hoodie_white.png',
      '/images/product/back_hoodie_white.png',
      '/images/product/hoodie3_white.png',
      '/images/product/hoodie4_white.png',
    ],
  },
  'casquette-vf': {
    Noir: [
      '/images/product/front_cap.png',
      '/images/product/back_cap.png',
      '/images/product/side_cap.png',
      '/images/product/cap3.png',
    ],
    Blanc: [
      '/images/product/front_cap_white.png',
      '/images/product/back_cap_white.png',
      '/images/product/cap3_white.png',
      '/images/product/cap4_white.png',
    ],
  },
  'shorts-performance-vf': {
    Noir: [
      '/images/product/front_shorts.png',
      '/images/product/shorts2.png',
      '/images/product/shorts3.png',
      '/images/product/shorts4.png',
    ],
    Blanc: [
      '/images/product/front_shorts_white.png',
      '/images/product/shorts2_white.png',
      '/images/product/shorts3_white.png',
      '/images/product/shorts4_white.png',
    ],
  },
  'coque-iphone-vf': {
    Noir: [
      '/images/product/front_case.png',
      '/images/product/case3.png',
      '/images/product/case2.png',
      '/images/product/case4.png',
    ],
    Blanc: [
      '/images/product/front_case_white.png',
      '/images/product/case3_white.png',
      '/images/product/case2_white.png',
      '/images/product/case4_white.png',
    ],
  },
  'debardeur-vf': {
    Noir: [
      '/images/product/front_debardeur_black.png',
      '/images/product/back_debardeur_black.png',
      '/images/product/debardeur3_black.png',
    ],
    Blanc: [
      '/images/product/front_debardeur_white.png',
      '/images/product/back_debardeur_white.png',
      '/images/product/debardeur3_white.png',
    ],
  },
  'cache-cou-vf': {
    Noir: [
      '/images/product/cachecou3.png',
      '/images/product/cachecou4.png',
      '/images/product/cachecou1.png',
    ],
  },
  'bob-vf': {
    Blanc: [
      '/images/product/front_bob.png',
      '/images/product/back_bob.png',
      '/images/product/side_bob.png',
      '/images/product/bob_detail.png',
    ],
  },
  'short-confort-vf': {
    Blanc: [
      '/images/product/back_short_confort.png',
      '/images/product/short_confort_detail.png',
      '/images/product/side_short_confort.png',
      '/images/product/front_short_confort.png',
    ],
  },
}

export function mediaFor(slug: string, colour: string): string[] {
  const byColour = productMedia[slug]
  if (!byColour) return []
  if (byColour[colour]) return byColour[colour]
  const [firstColour] = Object.keys(byColour)
  return byColour[firstColour] ?? []
}

export function heroFor(slug: string, colour?: string): string {
  const byColour = productMedia[slug]
  if (!byColour) return ''
  const [firstColour] = Object.keys(byColour)
  const images = (colour ? byColour[colour] : undefined) ?? byColour[firstColour] ?? []
  return images[0] ?? ''
}
