import { glob, type Loader } from "astro/loaders"
import { z } from "astro/zod"
import { defineCollection } from "astro:content"

const NEWS_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/ // YYYY-MM-DD

const newsLoader = (): Loader => {
  const inner = glob({ base: "./src/content/news", pattern: "**/*.md" })

  return {
    name: "news-loader",
    load: async (ctx) => {
      const upstream = ctx.parseData

      ctx.parseData = (opts) => {
        const match = NEWS_DATE_PREFIX.exec(opts.id)
        const data = { ...opts.data }
        if (match) (data as Record<string, unknown>).date ??= match[0]
        return upstream({ ...opts, data })
      }

      return inner.load(ctx)
    },
  }
}

const news = defineCollection({
  loader: newsLoader(),
  schema: z.object({
    date: z.coerce.date(),
    title: z.string().optional(),
  }),
})

const bio = defineCollection({
  loader: glob({ base: "./src/content", pattern: "bio.md" }),
})

export const collections = { news, bio }
