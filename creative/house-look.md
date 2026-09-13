# VertiFlow house look

Every VertiFlow image inherits this. Slot prompts add subject and composition only.

## The rule it exists to enforce

Twenty generated images should read as one brand, not twenty nice pictures. When a new
collection is generated in six months, this file is what makes it match.

## Campaign, never documentary

Art-direction rule 5, refined 2026-08-10.

Generated imagery of Maxime is **campaign** work: him wearing the garment, atmospheric,
understood as a brand shot. That is allowed.

Generated imagery must never be **documentary** — it must never depict or imply a real
training session, a real class, other real people, or the club. No fabricated crowds, no
invented training partners, no scenes that read as "a session at PKBA."

The December success test is that strangers physically turn up to train. Fabricated
session imagery poisons that, and it is the one failure this brand cannot recover from.

## Light

Sodium-vapour street lighting is the signature. Warm amber, low and directional, usually
out of frame. Deep unlit black holding at least a third of the frame. One restrained cool
counter-colour only — cyan or a distant window — never both, never saturated.

Night, after rain. Standing water and wet asphalt carry the reflections. This is the hour
people actually train.

## Camera

Full-frame, 35mm, f/2.8. Tripod or steady handheld. Realistic high-ISO grain. True
light falloff, imperfect reflections, real weathering — moss in joints, chipped concrete,
scuffed steel.

## Palette

Deep black · charcoal · wet-asphalt grey · sodium amber `#e8912d` · one restrained cyan.

The amber is the site's accent token. Images and interface share one colour by design.

## Composition

Every slot leaves a quiet region for typography, specified per slot. Images are composed
for the layout, not cropped into it afterwards.

## Never

AI gloss · plastic or waxy skin · HDR halos · oversaturation · cyberpunk neon · purple or
teal-orange grading · lens flares · vignetting · fake readable signage · warped lettering ·
duplicated limbs · malformed hands · watermarks · borders · floating typography · captions.

## How to prompt this (learned 2026-08-13, `z_image` on the Higgsfield free plan)

Model gating: `recraft_v4_1` and `soul_location` require a paid plan. `z_image` is the
free-tier model, costs ~0.15 credits, and outputs 2048×1536.

1. **Roughly 60 words.** A 180-word prompt kept every atmosphere instruction and dropped
   every single-mention constraint. Atmosphere survives repetition; constraints do not
   survive length.
2. **Do not inline this whole file.** Take the light, palette and camera lines; leave the
   rest. The look carries on a few concrete words.
3. **Drop the negative list.** Everything on it was already absent from output that never
   mentioned it. Negatives cost prompt budget and buy nothing here. Keep only
   "empty, no people".
4. **When a constraint fails twice, change the noun, not the adjective.** "A low wall, no
   higher than a knee" lost to the model's prior that walls are tall, across two attempts.
   "Three wide shallow concrete steps, each only ankle height" landed first time.
5. **Batch variants, don't iterate serially.** Three framings in one `generate_image_batch`
   costs ~0.45 credits and one round trip.

## Garment fidelity

When a VertiFlow garment appears, its artwork is preserved exactly from the product
reference: black fabric, the small circular white VertiFlow chest mark, and the printed
back graphic undistorted and unrotated. The print is on the cloth, not pasted over it.
