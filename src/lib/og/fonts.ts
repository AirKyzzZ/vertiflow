import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const FONTS_DIR = path.join(process.cwd(), 'src/lib/og/fonts')

export type OgFont = {
  name: string
  data: ArrayBuffer
  weight: 600 | 700
  style: 'normal'
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

async function loadInstance(fileName: string, weight: 600 | 700): Promise<OgFont | null> {
  try {
    const buffer = await readFile(path.join(FONTS_DIR, fileName))
    return { name: 'Archivo', data: toArrayBuffer(buffer), weight, style: 'normal' }
  } catch {
    return null
  }
}

let cachedFonts: Promise<OgFont[]> | null = null

export function loadBrandFonts(): Promise<OgFont[]> {
  if (!cachedFonts) {
    cachedFonts = Promise.all([
      loadInstance('archivo-display-700.ttf', 700),
      loadInstance('archivo-eyebrow-600.ttf', 600),
    ]).then((instances) => instances.filter((font): font is OgFont => font !== null))
  }
  return cachedFonts
}
