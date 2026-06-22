// @ts-check
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import emoji from "remark-emoji"

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  markdown: {
    remarkPlugins: [emoji],
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
