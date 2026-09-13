import type { MetadataRoute } from 'next'
import { getProducts } from '@/lib/catalogue'
import { getJournalPosts } from '@/app/journal/journal-data'
import { buildSitemapEntries } from '@/lib/sitemap-entries'

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getProducts()
  const journalSlugs = getJournalPosts().map((post) => post.slug)

  return buildSitemapEntries(products, journalSlugs)
}
