import fs from "node:fs"
import YAML from "yaml"

export interface Affiliation {
  name: string
  url: string
}

export interface NavLink {
  href: string
  label: string
  new_tab: boolean
}

export interface SiteConfig {
  first_name: string
  last_name: string
  email: string

  linkedin_username: string
  research_gate_profile: string
  scholar_userid: string

  description: string
  footer_message: string

  nav_links: NavLink[]
  affiliation: Affiliation
}

const CONFIG_PATH = "src/content/config.yaml"

let cached: SiteConfig | null = null

export function getConfig(): SiteConfig {
  if (cached) return cached
  cached = YAML.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
  if (!cached) throw `Failed to read ${CONFIG_PATH}`
  return cached
}

export function fullName(config: SiteConfig): string {
  return `${config.first_name} ${config.last_name}`
}
