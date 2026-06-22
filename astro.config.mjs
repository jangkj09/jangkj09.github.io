// @ts-check
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import emoji from "remark-emoji"

// https://astro.build/config
export default defineConfig({
  markdown: {
    remarkPlugins: [emoji],
  },
  vite: {
    plugins: [tailwindcss()],
  },
})
