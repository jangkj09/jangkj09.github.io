import type { BibEntry } from "bibtex"
import fs from "node:fs"
import { createRequire } from "node:module"

// `bibtex` ships as a CommonJS bundle, so use `require` to load it reliably
// under Astro's Node-based prerender pipeline.
const require = createRequire(import.meta.url)
const { parseBibFile }: typeof import("bibtex") = require("bibtex")

export interface AuthorName {
  full: string
}

export interface PaperLink {
  label: string
  url: string
}

export interface Paper {
  id: string
  type: string
  title: string
  authors: AuthorName[]
  year: number
  venue: string
  publisher: string
  selected: boolean
  links: PaperLink[]
  bib: string
}

const BIB_PATH = "src/content/papers.bib"

const MONTH_ABBREVIATIONS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
]

function findMatchingBrace(text: string, openIndex: number): number {
  let depth = 0
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === "{") depth++
    else if (text[i] === "}") {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function deduplicateEntries(text: string): string {
  const seen = new Set<string>()
  const parts: string[] = []
  let cursor = 0
  while (cursor < text.length) {
    const at = text.indexOf("@", cursor)
    if (at === -1) {
      parts.push(text.slice(cursor))
      break
    }
    parts.push(text.slice(cursor, at))
    const braceOpen = text.indexOf("{", at)
    if (braceOpen === -1) {
      parts.push(text.slice(at))
      break
    }
    const entryType = text.slice(at, braceOpen).trim().toLowerCase()
    const braceClose = findMatchingBrace(text, braceOpen)
    if (braceClose === -1) {
      parts.push(text.slice(at))
      break
    }
    const fullEntry = text.slice(at, braceClose + 1)
    if (
      entryType === "@string" ||
      entryType === "@comment" ||
      entryType === "@preamble" ||
      entryType === "@bib"
    ) {
      parts.push(fullEntry)
    } else {
      const inner = text.slice(braceOpen + 1, braceClose)
      const delimiter = inner.search(/[,}]/)
      const key = (delimiter === -1 ? inner : inner.slice(0, delimiter)).trim().toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        parts.push(fullEntry)
      }
    }
    cursor = braceClose + 1
  }
  return parts.join("")
}

function extractRawEntry(text: string, key: string): string {
  const normalizedKey = key.toLowerCase()
  let cursor = 0

  while (cursor < text.length) {
    const at = text.indexOf("@", cursor)
    if (at === -1) return ""
    const braceOpen = text.indexOf("{", at)
    if (braceOpen === -1) return ""
    const braceClose = findMatchingBrace(text, braceOpen)
    if (braceClose === -1) return ""
    const inner = text.slice(braceOpen + 1, braceClose)
    const delimiter = inner.search(/[,}]/)
    const entryKey = (delimiter === -1 ? inner : inner.slice(0, delimiter)).trim().toLowerCase()
    if (entryKey === normalizedKey) return text.slice(at, braceClose + 1).trim()
    cursor = braceClose + 1
  }

  return ""
}

function preprocessBib(raw: string): string {
  let text = raw.replace(/^---[\s\S]*?\n---\s*/, "")
  text = text.replace(/#\s*\{([^{}]*)\}/g, '# "$1"')
  const monthDefs = MONTH_ABBREVIATIONS.map((m) => `@string{${m} = "${m}"}`).join("\n")
  text = `${monthDefs}\n${text}`
  return deduplicateEntries(text)
}

const DIAERESIS: Record<string, string> = {
  a: "ä",
  A: "Ä",
  e: "ë",
  E: "Ë",
  i: "ï",
  I: "Ï",
  o: "ö",
  O: "Ö",
  u: "ü",
  U: "Ü",
  y: "ÿ",
  Y: "Ÿ",
}

function cleanLatex(value: string): string {
  return value
    .replace(/\\?"([a-zA-Z])/g, (match, letter: string) => DIAERESIS[letter] ?? match)
    .replace(/\\([&#%_$])/g, "$1")
}

function field(entry: BibEntry, key: string): string {
  const value = entry.getFieldAsString(key)
  if (value === undefined || value === null) return ""
  return cleanLatex(String(value))
}

function isTruthyFlag(value: string): boolean {
  return value.toLowerCase() === "true"
}

function buildAuthors(entry: BibEntry): AuthorName[] {
  const authors = entry.getAuthors()
  if (!authors) return []
  return authors.authors$.map((author) => {
    const name = [...author.firstNames, ...author.vons, ...author.lastNames]
      .map((part) => cleanLatex(part))
      .join(" ")
    return { full: name }
  })
}

function resolveDoiUrl(rawDoi: string): string {
  return rawDoi.startsWith("http") ? rawDoi : `https://doi.org/${rawDoi}`
}

function buildLinks(entry: BibEntry): PaperLink[] {
  const links: PaperLink[] = []
  const arxiv = field(entry, "arxiv")
  const eprint = field(entry, "eprint")
  const pdf = field(entry, "pdf")
  const url = field(entry, "url")
  const doi = field(entry, "doi")
  const pmid = field(entry, "pmid")
  const resolvedDoi = doi ? resolveDoiUrl(doi) : ""
  if (arxiv) links.push({ label: "arXiv", url: arxiv })
  if (!arxiv && eprint) links.push({ label: "arXiv", url: `https://arxiv.org/abs/${eprint}` })
  if (pdf) links.push({ label: "PDF", url: pdf })
  if (url && url !== resolvedDoi) links.push({ label: "link", url })
  if (doi) links.push({ label: "DOI", url: resolvedDoi })
  if (pmid) links.push({ label: "PubMed", url: pmid })
  return links
}

function entryToPaper(entry: BibEntry, rawBib: string): Paper {
  const venue = field(entry, "journal") || field(entry, "booktitle") || field(entry, "note")
  const yearValue = entry.getFieldAsString("year")
  const year = yearValue !== undefined ? Number.parseInt(String(yearValue), 10) : 0
  return {
    id: entry._id,
    type: entry.type,
    title: field(entry, "title"),
    authors: buildAuthors(entry),
    year: Number.isNaN(year) ? 0 : year,
    venue,
    publisher: field(entry, "publisher"),
    selected: isTruthyFlag(field(entry, "selected")),
    links: buildLinks(entry),
    bib: extractRawEntry(rawBib, entry._id),
  }
}

let cachedPapers: Paper[] | null = null

function loadPapers(): Paper[] {
  if (cachedPapers) return cachedPapers
  const rawBib = fs.readFileSync(BIB_PATH, "utf-8")
  const bibFile = parseBibFile(preprocessBib(rawBib))
  const papers = bibFile.entries_raw.map((entry) => {
    const processed = bibFile.entries$[entry._id.toLowerCase()]
    if (!processed) return null
    return entryToPaper(processed, rawBib)
  })
  cachedPapers = papers
    .filter((paper): paper is Paper => paper !== null)
    .sort((a, b) => b.year - a.year)
  return cachedPapers
}

export function getAllPapers(): Paper[] {
  return loadPapers()
}

export function getSelectedPapers(): Paper[] {
  return loadPapers().filter((paper) => paper.selected)
}

export function formatAuthors(authors: AuthorName[]): string {
  if (authors.length === 0) return ""
  if (authors.length === 1) return authors[0].full
  const head = authors
    .slice(0, -1)
    .map((a) => a.full)
    .join(", ")
  return `${head}, and ${authors[authors.length - 1].full}`
}
