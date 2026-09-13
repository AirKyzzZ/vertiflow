import 'server-only'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const PUBLIC_DIR = path.join(process.cwd(), 'public')

export type ImageFit = {
  width: number
  height?: number
  position?: string
}

export async function loadImageDataUri(relativePath: string, fit?: ImageFit): Promise<string | null> {
  try {
    const absolute = path.join(PUBLIC_DIR, relativePath.replace(/^\//, ''))
    const buffer = await readFile(absolute)

    let pipeline = sharp(buffer)
    if (fit) {
      pipeline = pipeline.resize({
        width: fit.width,
        height: fit.height,
        fit: fit.height ? 'cover' : 'inside',
        position: fit.position ?? 'centre',
        withoutEnlargement: true,
      })
    }

    const output = await pipeline.png().toBuffer()
    return `data:image/png;base64,${output.toString('base64')}`
  } catch {
    return null
  }
}
