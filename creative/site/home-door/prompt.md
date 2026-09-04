# Slot: home-door

**Output:** 2048×1536 · **Quiet region:** upper third (dead black), for body copy
**Model:** `z_image` on Higgsfield · ~0.15 credits per render
**Status:** ✅ locked — `test-02b.png`
**Inherits:** `../../house-look.md`

## Working prompt

> Photorealistic night photograph. Three wide shallow concrete steps, each only ankle
> height, in an empty wet town square after rain. Camera low and close to the stone, 35mm.
> A sodium street lamp out of frame to the left, warm amber pooling on the wet steps, black
> sky. Empty, no people. High-ISO grain.

62 words. No negative list.

## Iteration notes

**test-01** — 180-word prompt with the full house block inlined. Every *look* instruction
landed: sodium light, wet ground, cyan counter-colour, grain, weathering, no people. Every
*subject* constraint was ignored: knee height, low camera, quiet right half. Lesson: this
model honours atmosphere and drops single-mention constraints in long prompts.

**test-02a** — 65 words, constraint front-loaded as "a low concrete kerb, no higher than a
knee". Low camera landed. Height did not — still chest-high.

**test-02b** — ✅ "Three wide shallow concrete steps, each only ankle height." Landed
immediately.

**The lesson, and it generalises: name a different object rather than qualifying the same
one.** `z_image` has a strong prior that a wall is tall, and "low", "knee-high" and "no
higher than a knee" all lost to it across two attempts. Steps carry no such prior. When a
constraint fails twice, stop adjusting adjectives and change the noun.

**test-02c** — knee-high ledge, lamp from the right. Downloaded, unused for this slot;
possible candidate for `boutique-band`.

## Cost record

4 renders total, ~0.6 credits. Model gating on the free plan: `recraft_v4_1` and
`soul_location` both return `job_minimum_basic_plan_required`. `z_image` is the free-tier
model and outputs 2048×1536.
