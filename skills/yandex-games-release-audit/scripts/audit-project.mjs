#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative, extname } from 'node:path'

const sourceExtensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue', '.svelte', '.html', '.css', '.scss', '.json'])
const ignoredDirectories = new Set(['.git', '.idea', '.vscode', '.agents', '.codex', '.codewhale', 'node_modules', 'dist', 'build', 'coverage', '.next', '.nuxt', '.output'])

function usage() {
  console.log('Usage: audit-project.mjs [project-dir] [--json] [--strict]')
}

function parseArguments(argv) {
  const options = { project: process.cwd(), json: false, strict: false }
  for (const argument of argv) {
    if (argument === '--json') options.json = true
    else if (argument === '--strict') options.strict = true
    else if (argument === '--help' || argument === '-h') options.help = true
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`)
    else options.project = resolve(argument)
  }
  return options
}

function collectFiles(root) {
  const files = []
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const absolutePath = resolve(directory, entry.name)
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) visit(absolutePath)
      } else if (entry.isFile() && sourceExtensions.has(extname(entry.name).toLowerCase()) && statSync(absolutePath).size <= 5_000_000) {
        files.push(absolutePath)
      }
    }
  }
  visit(root)
  return files
}

function readSources(root, files) {
  return files.map((file) => ({
    file: relative(root, file),
    text: readFileSync(file, 'utf8')
  }))
}

function matches(sources, pattern) {
  return sources.filter(({ text }) => {
    pattern.lastIndex = 0
    return pattern.test(text)
  }).map(({ file }) => file)
}

function finding(id, status, title, evidence, remediation = '') {
  return { id, status, title, evidence, remediation }
}

function unique(values) {
  return [...new Set(values)]
}

function summarize(findings) {
  return findings.reduce((summary, item) => {
    summary[item.status] = (summary[item.status] || 0) + 1
    return summary
  }, {})
}

function printHuman(report) {
  console.log(`Yandex Games project audit: ${report.project}`)
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

if (!existsSync(options.project) || !statSync(options.project).isDirectory()) {
  console.error(`Project directory does not exist: ${options.project}`)
  process.exit(2)
}

const files = collectFiles(options.project)
const sources = readSources(options.project, files)
const packagePath = resolve(options.project, 'package.json')
let packageJson = null
let packageError = null
if (existsSync(packagePath)) {
  try {
    packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
  } catch (error) {
    packageError = error.message
  }
}

const findings = []
findings.push(packageJson
  ? finding('project.manifest', 'PASS', 'Project manifest is readable', 'package.json')
  : finding('project.manifest', 'BLOCKED', 'No readable package.json was found', packageError || 'The automated build workflow cannot be inferred.', 'Restore or fix package.json.'))

const buildScripts = packageJson?.scripts ? Object.keys(packageJson.scripts).filter((name) => /build|bundle|release/i.test(name)) : []
findings.push(buildScripts.length
  ? finding('project.build-script', 'PASS', 'Production build script is declared', buildScripts.join(', '))
  : finding('project.build-script', 'WARNING', 'No obvious production build script is declared', 'Expected a script such as build or release.', 'Identify and document the production build command.'))

const sdkFiles = unique([...matches(sources, /YaGames\s*\.\s*init\s*\(/g), ...matches(sources, /yandex\.ru\/games\/sdk|yandex\.com\/games\/sdk|sdk\.js/g)])
findings.push(sdkFiles.length
  ? finding('sdk.integration', 'PASS', 'Yandex Games SDK integration was detected', sdkFiles.slice(0, 8).join(', '))
  : finding('sdk.integration', 'BLOCKED', 'Yandex Games SDK integration was not detected', 'No SDK loader or YaGames.init call was found.', 'Integrate the current Yandex Games SDK through a project-level adapter.'))

const readyFiles = matches(sources, /LoadingAPI\s*\.\s*ready\s*\(/g)
findings.push(readyFiles.length
  ? finding('sdk.ready', 'PASS', 'LoadingAPI.ready() was detected', readyFiles.slice(0, 8).join(', '), 'Verify at runtime that it fires once only after the game is usable.')
  : finding('sdk.ready', 'BLOCKED', 'LoadingAPI.ready() was not detected', 'The platform may keep showing its loading state.', 'Call it once at the real playable boundary.'))

const gameplayStart = matches(sources, /GameplayAPI\s*\.\s*start\s*\(/g)
const gameplayStop = matches(sources, /GameplayAPI\s*\.\s*stop\s*\(/g)
if (gameplayStart.length || gameplayStop.length) {
  findings.push(gameplayStart.length && gameplayStop.length
    ? finding('sdk.gameplay-lifecycle', 'PASS', 'Gameplay API start and stop calls were both detected', unique([...gameplayStart, ...gameplayStop]).slice(0, 8).join(', '), 'Verify pairing across every state transition.')
    : finding('sdk.gameplay-lifecycle', 'WARNING', 'Gameplay API lifecycle appears unpaired', unique([...gameplayStart, ...gameplayStop]).slice(0, 8).join(', '), 'Pair start and stop calls through the game state lifecycle.'))
} else {
  findings.push(finding('sdk.gameplay-lifecycle', 'MANUAL', 'Gameplay API usage was not detected', 'Confirm whether the current SDK and game flow require it.'))
}

const sdkPause = matches(sources, /game_api_pause/g)
const sdkResume = matches(sources, /game_api_resume/g)
findings.push(sdkPause.length && sdkResume.length
  ? finding('sdk.pause-events', 'PASS', 'SDK pause and resume event handlers were detected', unique([...sdkPause, ...sdkResume]).slice(0, 8).join(', '), 'Verify idempotent gameplay and audio transitions at runtime.')
  : finding('sdk.pause-events', 'WARNING', 'Complete SDK pause/resume handling was not detected', unique([...sdkPause, ...sdkResume]).slice(0, 8).join(', ') || 'No matching handlers found.', 'Handle both events through the central lifecycle system.'))

const visibilityFiles = matches(sources, /visibilitychange|document\.hidden/g)
findings.push(visibilityFiles.length
  ? finding('browser.visibility', 'PASS', 'Page visibility handling was detected', visibilityFiles.slice(0, 8).join(', '), 'Verify that timers, input, rendering, and audio resume correctly.')
  : finding('browser.visibility', 'WARNING', 'Page visibility handling was not detected', 'Background tabs can leave gameplay or audio active.', 'Coordinate visibility changes with the game lifecycle.'))

const adFiles = unique([...matches(sources, /showFullscreenAdv\s*\(/g), ...matches(sources, /showRewardedVideo\s*\(/g)])
findings.push(adFiles.length
  ? finding('sdk.ads', 'MANUAL', 'Yandex advertising calls were detected', adFiles.slice(0, 8).join(', '), 'Test pause, close, error, offline, and reward callbacks in a Yandex draft.')
  : finding('sdk.ads', 'MANUAL', 'No Yandex advertising calls were detected', 'Confirm that the release is intentionally non-monetized.'))

const contextMenuFiles = matches(sources, /contextmenu[\s\S]{0,160}preventDefault|oncontextmenu[\s\S]{0,80}return\s+false/g)
findings.push(contextMenuFiles.length
  ? finding('input.context-menu', 'PASS', 'Context-menu suppression was detected', contextMenuFiles.slice(0, 8).join(', '), 'Confirm that it is scoped to the game surface where possible.')
  : finding('input.context-menu', 'WARNING', 'Context-menu suppression was not detected', 'Right-click or long-press may interrupt gameplay.', 'Prevent the menu on the game surface without breaking necessary UI.'))

const viewportFiles = matches(sources, /<meta[^>]+name=["']viewport["'][^>]+(user-scalable\s*=\s*no|maximum-scale\s*=\s*1)/gi)
const touchActionFiles = matches(sources, /touch-action\s*:\s*(none|manipulation)/gi)
findings.push(viewportFiles.length || touchActionFiles.length
  ? finding('input.mobile-gestures', 'PASS', 'Mobile gesture control was detected', unique([...viewportFiles, ...touchActionFiles]).slice(0, 8).join(', '), 'Verify pinch, double-tap, scrolling, and controls on real devices.')
  : finding('input.mobile-gestures', 'WARNING', 'Mobile zoom or page gestures may remain enabled', 'No viewport restriction or touch-action rule was found.', 'Control browser gestures for the game surface.'))

const ruFiles = sources.filter(({ file, text }) => /(^|[._/-])ru([._/-]|$)/i.test(file) || /\bru\s*:\s*[{[]/.test(text)).map(({ file }) => file)
const enFiles = sources.filter(({ file, text }) => /(^|[._/-])en([._/-]|$)/i.test(file) || /\ben\s*:\s*[{[]/.test(text)).map(({ file }) => file)
findings.push(ruFiles.length && enFiles.length
  ? finding('localization.languages', 'PASS', 'Russian and English localization candidates were detected', unique([...ruFiles, ...enFiles]).slice(0, 8).join(', '), 'Compare key parity and test player-visible fallbacks.')
  : finding('localization.languages', 'WARNING', 'Russian and English localization pair was not detected', `Russian candidates: ${ruFiles.length}; English candidates: ${enFiles.length}.`, 'Confirm declared languages and complete their keys.'))

const localPathFiles = matches(sources, /file:\/\/\/(?:Users|home)\/|(?:^|["'`(])\/(?:Users|home)\/|[A-Za-z]:\\(?:Users|Documents and Settings)\\/gm)
findings.push(localPathFiles.length
  ? finding('assets.local-paths', 'BLOCKED', 'Local filesystem paths were detected', localPathFiles.slice(0, 8).join(', '), 'Replace them with deployable asset references or build-time configuration.')
  : finding('assets.local-paths', 'PASS', 'No obvious local filesystem paths were detected', `${files.length} source files scanned.`))

const consoleErrorFiles = matches(sources, /console\.(error|warn)\s*\(/g)
findings.push(consoleErrorFiles.length
  ? finding('runtime.console', 'MANUAL', 'Console warning or error calls exist in source', consoleErrorFiles.slice(0, 8).join(', '), 'Exercise a complete production session and investigate emitted messages.')
  : finding('runtime.console', 'MANUAL', 'Runtime console still requires inspection', 'Static source contains no obvious console.error or console.warn calls.'))

findings.push(finding('moderation.devices', 'MANUAL', 'Yandex draft and real-device testing are required', 'Test every declared browser, OS, device class, and orientation before submission.'))
findings.push(finding('requirements.freshness', 'MANUAL', 'Current official requirements must be reconfirmed', 'Review official Yandex Games documentation for every enabled platform feature.'))

const report = {
  project: resolve(options.project),
  scannedFiles: files.length,
  findings,
  summary: summarize(findings)
}

if (options.json) console.log(JSON.stringify(report, null, 2))
else printHuman(report)

if (options.strict && findings.some(({ status }) => status === 'BLOCKED' || status === 'WARNING')) process.exitCode = 1
