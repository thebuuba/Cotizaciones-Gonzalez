import { readFileSync } from 'node:fs'
import console from 'node:console'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const interfaceStyles = ['src/styles/global.css']

function withoutKeyframes(css) {
  let output = ''
  let cursor = 0

  while (cursor < css.length) {
    const match = /@(?:-webkit-)?keyframes\b/gi.exec(css.slice(cursor))
    if (!match) return output + css.slice(cursor)

    const start = cursor + match.index
    const openingBrace = css.indexOf('{', start)
    if (openingBrace === -1) return output + css.slice(cursor, start)

    output += css.slice(cursor, start)
    let depth = 1
    let end = openingBrace + 1
    while (end < css.length && depth > 0) {
      if (css[end] === '{') depth += 1
      if (css[end] === '}') depth -= 1
      end += 1
    }
    cursor = end
  }

  return output
}

export function auditCssTypography(css) {
  const issues = []
  const declarations = withoutKeyframes(css).matchAll(/font-size\s*:\s*([^;}]+)/gi)

  for (const declaration of declarations) {
    const value = declaration[1].trim()
    if (value !== 'inherit' && !/^var\(--font-size-[a-z-]+\)$/.test(value)) {
      issues.push(`font-size must use a semantic token: ${value}`)
    }
  }

  return issues
}

export function auditInterfaceStyles(styles = interfaceStyles) {
  return styles.flatMap((file) => {
    const css = readFileSync(file, 'utf8')
    return auditCssTypography(css).map((issue) => `${file}: ${issue}`)
  })
}

const invokedPath = process.argv[1]
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  const issues = auditInterfaceStyles()
  if (issues.length > 0) {
    console.error(issues.join('\n'))
    process.exitCode = 1
  } else {
    console.log('Interface typography uses semantic tokens.')
  }
}
