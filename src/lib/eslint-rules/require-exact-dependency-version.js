import fs from "node:fs"
import path from "node:path"

let checked = false

/** @type {import('eslint').Rule.RuleModule} */
export const requireExactDependencyVersion = {
  meta: {
    type: "problem",
    docs: {
      description: "Enforce dependency versions in package.json start with a numerical digit",
      recommended: true,
    },
    schema: [],
    messages: {
      invalidVersion:
        "Dependency '{{name}}' must use an exact version starting with a digit (got '{{version}}').",
    },
  },
  create(context) {
    if (checked) return {}

    if (!context.filename || path.basename(context.filename) !== "eslint.config.mjs") return {}

    checked = true

    const packageJsonPath = path.resolve(process.cwd(), "package.json")

    let pkg
    try {
      pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
    } catch {
      return {}
    }

    const sections = ["dependencies", "devDependencies", "peerDependencies"]

    for (const section of sections) {
      const deps = pkg[section]

      if (!deps || typeof deps !== "object") continue

      for (const [name, version] of Object.entries(deps)) {
        if (typeof version !== "string") continue

        if (!/^\d/.test(version))
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "invalidVersion",
            data: { name, version },
          })
      }
    }

    return {}
  },
}
