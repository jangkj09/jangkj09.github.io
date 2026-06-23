// @ts-check
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, fontProviders } from "astro/config"
import emoji from "remark-emoji"

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  redirects: {
    "/cv": "/cv.pdf",
  },
  markdown: {
    remarkPlugins: [emoji],
  },
  fonts: [
    {
      provider: fontProviders.npm({ remote: false }),
      name: "Inter Variable",
      cssVariable: "--font-inter",
      styles: ["normal"],
      fallbacks: ["sans-serif"],
      options: {
        package: "@fontsource-variable/inter",
      },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
