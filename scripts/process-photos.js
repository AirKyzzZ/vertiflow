#!/usr/bin/env node

const fs = require('node:fs/promises')
const path = require('node:path')
const sharp = require('sharp')

const SOURCE_DIR = path.resolve(__dirname, '../creative/assets')
const OUTPUT_DIR = path.resolve(__dirname, '../public/images/photos')

const EXCLUDED_SOURCES = new Set([
  '6eabafe0-9eb1-4057-a6f2-1d50031d7ef4.jpg',
])

const EDITORIAL_WIDTH = 2048
const HERO_WIDTH = 1600
const PRODUCT_WIDTH = 1200
const THUMB_WIDTH = 640
const WEBP_QUALITY = 82

const CONTRAST_FACTOR = 1.16
const CONTRAST_OFFSET = -14
const WARMTH_RED = 1.045
const WARMTH_BLUE = 0.955
const SATURATION_BOOST = 1.1
const SKY_GRADIENT_HEIGHT_FRACTION = 0.48
const SKY_GRADIENT_MAX_OPACITY = 0.55

const TIERS = [
  { name: 'editorial', width: EDITORIAL_WIDTH },
  { name: 'hero', width: HERO_WIDTH },
  { name: 'product', width: PRODUCT_WIDTH },
  { name: 'thumb', width: THUMB_WIDTH },
]

function slugFromFilename(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function skyGradientBuffer(width, height) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="black" stop-opacity="${SKY_GRADIENT_MAX_OPACITY}"/>
        <stop offset="${SKY_GRADIENT_HEIGHT_FRACTION}" stop-color="black" stop-opacity="0"/>
        <stop offset="1" stop-color="black" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#sky)"/>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function gradePhoto(sourcePath) {
  const base = await sharp(sourcePath)
    .rotate()
    .resize({ width: EDITORIAL_WIDTH, withoutEnlargement: true })
    .toBuffer()

  const { width, height } = await sharp(base).metadata()
  const gradient = await skyGradientBuffer(width, height)

  return sharp(base)
    .linear(
      [CONTRAST_FACTOR * WARMTH_RED, CONTRAST_FACTOR, CONTRAST_FACTOR * WARMTH_BLUE],
      [CONTRAST_OFFSET, CONTRAST_OFFSET, CONTRAST_OFFSET],
    )
    .modulate({ saturation: SATURATION_BOOST })
    .composite([{ input: gradient, blend: 'multiply' }])
    .toBuffer()
}

async function writeTiers(graded, slug) {
  const written = []
  for (const tier of TIERS) {
    const outDir = path.join(OUTPUT_DIR, tier.name)
    await fs.mkdir(outDir, { recursive: true })
    const outPath = path.join(outDir, `${slug}.webp`)
    const info = await sharp(graded)
      .resize({ width: tier.width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath)
    written.push({ tier: tier.name, outPath, bytes: info.size })
  }
  return written
}

async function listSourcePhotos() {
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && /\.(jpe?g)$/i.test(entry.name))
    .map((entry) => entry.name)
    .filter((name) => !EXCLUDED_SOURCES.has(name))
    .sort()
}

async function main() {
  const sourceFiles = await listSourcePhotos()
  if (sourceFiles.length === 0) {
    throw new Error(`No source photos found in ${SOURCE_DIR}`)
  }

  const perTierBytes = Object.fromEntries(TIERS.map((tier) => [tier.name, 0]))
  let totalBytes = 0
  let totalFiles = 0

  for (const file of sourceFiles) {
    const slug = slugFromFilename(file)
    const graded = await gradePhoto(path.join(SOURCE_DIR, file))
    const written = await writeTiers(graded, slug)
    for (const item of written) {
      perTierBytes[item.tier] += item.bytes
      totalBytes += item.bytes
      totalFiles += 1
    }
    console.log(`graded ${file} -> ${slug}.webp`)
  }

  console.log('')
  console.log(`${sourceFiles.length} source photos, ${totalFiles} files written`)
  for (const tier of TIERS) {
    console.log(`  ${tier.name} (${tier.width}px): ${(perTierBytes[tier.name] / 1024 / 1024).toFixed(2)} MB`)
  }
  console.log(`  total: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
