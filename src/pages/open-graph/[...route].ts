import { getConfig, fullName } from "../../lib/config"
import { OGImageRoute } from "astro-og-canvas"

const config = getConfig()
const name = fullName(config)

const pages = {
  index: {
    title: name,
    description: config.description,
  },
  publications: {
    title: "Publications",
    description: `Publications by ${name}.`,
  },
  "404": {
    title: "404",
    description: "Page not found.",
  },
}

// See https://github.com/delucis/astro-og-canvas/tree/latest/packages/astro-og-canvas
export const { getStaticPaths, GET } = await OGImageRoute({
  param: "route",
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    bgGradient: [[17, 24, 39]],
    border: {
      color: [16, 185, 129],
      width: 4,
      side: "block-end",
    },
    padding: 80,
    font: {
      title: {
        color: [255, 255, 255],
        size: 64,
        weight: "Bold",
        lineHeight: 1.2,
        families: ["Inter Variable"],
      },
      description: {
        color: [209, 213, 219],
        size: 32,
        lineHeight: 1.4,
        families: ["Inter Variable"],
      },
    },
    fonts: ["./node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2"],
  }),
})
