#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative, extname } from 'node:path'

function usage() {
  console.log('Usage: audit-build.mjs [build-dir] [--json] [--strict]')
}

function parseArguments(argv) {
  const options = { build: resolve('dist'), json: false, strict: false }
  for (const argument of argv) {
    if (argument === '--json') options.json = true
    else if (argument === '--strict') options.strict = true
    else if (argument === '--help' || argument === '-h') options.help = true
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`)
    else options.build = resolve(argument)
  }
  return options
}

function collectFiles(root) {
  const files = []
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const absolutePath = resolve(directory, entry.name)
      if (entry.isDirectory()) visit(absolutePath)
      else if (entry.isFile()) files.push(absolutePath)
    }
  }
  visit(root)
  return files
}

function finding(id, status, title, evidence, remediation = '') {
  return { id, status, title, evidence, remediation }
}

function summarize(findings) {
  return findings.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] || 0) + 1
    return summary
  }, {})
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MiB`
}

function localReference(reference) {
  const clean = reference.split('#')[0].split('?')[0]
  if (!clean || /^(?:[a-z]+:|\/\/|#|data:|blob:)/i.test(clean)) return null
  try {
    return decodeURIComponent(clean.replace(/^\.\//, '').replace(/^\//, ''))
  } catch {
    return clean.replace(/^\.\//, '').replace(/^\//, '')
  }
}

function printHuman(report) {
  console.log(`Yandex Games build audit: ${report.build}`)
  console.log(`Files: ${report.fileCount}; total: ${formatBytes(report.totalBytes)}`)
  for (const item of report.findings) {
    console.log(`[${item.status}] ${item.title}`)
    if (item.evidence) console.log(`  ${item.evidence}`)
    if (item.remediation) console.log(`  Next: ${item.remediation}`)
  }
  console.log(`Summary: ${Object.entries(report.summary).map(([key, value]) => `${key}=${value}`).join(', ')}`)
}

let options
try {
  options = parseArguments(process.argv.slice(2))
} catch (error) {
  console.error(error.message)
  usage()
  process.exit(2)
}

if (options.help) {
  usage()
  process.exit(0)
}

if (!existsSync(options.build) || !statSync(options.build).isDirectory()) {
  console.error(`Build directory does not exist: ${options.build}`)
  process.exit(2)
}

const files = collectFiles(options.build)
const relativeFiles = new Set(files.map((file) => relative(options.build, file).replaceAll('\\', '/')))
const totalBytes = files.reduce((total, file) => total + statSync(file).size, 0)
const findings = []
const indexPath = resolve(options.build, 'index.html')

if (!existsSync(indexPath)) {
  findings.push(finding('build.index', 'BLOCKED', 'index.html is missing from the build root', relative(options.build, indexPath), 'Configure the build so the entry document is at the archive root.'))
} else {
  findings.push(finding('build.index', 'PASS', 'index.html exists at the build root', 'index.html'))
  const html = readFileSync(indexPath, 'utf8')
  const references = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1])
  const missing = references.map(localReference).filter(Boolean).filter((reference) => !relativeFiles.has(reference) && !relativeFiles.has(`${reference}/index.html`))
  findings.push(missing.length
    ? finding('build.references', 'BLOCKED', 'index.html has missing local references', [...new Set(missing)].slice(0, 12).join(', '), 'Fix asset paths or include the missing files in the production build.')
    : finding('build.references', 'PASS', 'Local index.html references resolve inside the build', `${references.length} references checked.`))
}

const textFiles = files.filter((file) => ['.html', '.js', '.mjs', '.cjs', '.css', '.json'].includes(extname(file).toLowerCase()) && statSync(file).size <= 10_000_000)
const texts = textFiles.map((file) => ({ file: relative(options.build, file), text: readFileSync(file, 'utf8') }))
const sdkFiles = texts.filter(({ text }) => /YaGames\s*\.\s*init\s*\(|yandex\.ru\/games\/sdk|yandex\.com\/games\/sdk|sdk\.js/.test(text)).map(({ file }) => file)
findings.push(sdkFiles.length
  ? finding('build.sdk', 'PASS', 'Yandex Games SDK integration exists in the bundle', sdkFiles.slice(0, 8).join(', '))
  : finding('build.sdk', 'BLOCKED', 'Yandex Games SDK integration was not found in the bundle', 'The source integration may have been omitted from production output.', 'Inspect the production entry point and SDK adapter.'))

const localPaths = texts.filter(({ text }) => /file:\/\/\/(?:Users|home)\/|(?:^|["'`(])\/(?:Users|home)\/|[A-Za-z]:\\(?:Users|Documents and Settings)\\/m.test(text)).map(({ file }) => file)
findings.push(localPaths.length
  ? finding('build.local-paths', 'BLOCKED', 'Local filesystem paths exist in the bundle', localPaths.slice(0, 8).join(', '), 'Remove local paths and rebuild.')
  : finding('build.local-paths', 'PASS', 'No obvious local filesystem paths were found', `${textFiles.length} text assets scanned.`))

const insecureUrls = texts.flatMap(({ file, text }) =>
  [...text.matchAll(/http:\/\/[^\s"'`)]+/g)]
    .map((match) => match[0])
    .filter((url) => !url.startsWith('http://www.w3.org/'))
    .map((url) => `${file}: ${url}`)
)
findings.push(insecureUrls.length
  ? finding('build.insecure-urls', 'WARNING', 'Insecure HTTP resource URLs exist in the bundle', insecureUrls.slice(0, 8).join(', '), 'Use HTTPS or remove the external dependency.')
  : finding('build.insecure-urls', 'PASS', 'No insecure HTTP resource URLs were found', ''))

const sourceMaps = files.filter((file) => extname(file).toLowerCase() === '.map').map((file) => relative(options.build, file))
findings.push(sourceMaps.length
  ? finding('build.source-maps', 'WARNING', 'Source maps are included in the build', sourceMaps.slice(0, 8).join(', '), 'Exclude them from the release archive unless intentionally published.')
  : finding('build.source-maps', 'PASS', 'No source maps are included', ''))

const largeFiles = files.filter((file) => statSync(file).size >= 20 * 1024 * 1024).map((file) => `${relative(options.build, file)} (${formatBytes(statSync(file).size)})`)
findings.push(largeFiles.length
  ? finding('build.large-files', 'WARNING', 'Large individual assets may delay startup', largeFiles.slice(0, 12).join(', '), 'Measure startup on target devices and confirm current platform limits.')
  : finding('build.large-files', 'PASS', 'No individual file is 20 MiB or larger', `Largest files were evaluated across ${files.length} assets.`))

findings.push(finding('build.runtime', 'MANUAL', 'The production bundle requires runtime testing', 'Serve it over HTTP and inspect loading, input, SDK events, ads, audio, saves, requests, and console output.'))
findings.push(finding('build.platform', 'MANUAL', 'A Yandex draft requires platform testing', 'Test every declared browser, OS, device class, and orientation.'))

const report = {
  build: resolve(options.build),
  fileCount: files.length,
  totalBytes,
  findings,
  summary: summarize(findings)
}

if (options.json) console.log(JSON.stringify(report, null, 2))
else printHuman(report)

if (options.strict && findings.some(({ status }) => status === 'BLOCKED' || status === 'WARNING')) process.exitCode = 1
