#!/usr/bin/env node

import { existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

function usage() {
  console.log('Usage: package-release.mjs [build-dir] [--output archive.zip] [--force] [--include-source-maps]')
}

function parseArguments(argv) {
  const options = { build: resolve('dist'), output: null, force: false, includeSourceMaps: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--output') {
      const value = argv[index + 1]
      if (!value || value.startsWith('-')) throw new Error('--output requires a path')
      options.output = resolve(value)
      index += 1
    } else if (argument === '--force') options.force = true
    else if (argument === '--include-source-maps') options.includeSourceMaps = true
    else if (argument === '--help' || argument === '-h') options.help = true
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`)
    else options.build = resolve(argument)
  }
  options.output ||= resolve(`${basename(options.build)}-yandex-games.zip`)
  return options
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

const outputFromBuild = relative(options.build, options.output)
if (!outputFromBuild || (!outputFromBuild.startsWith('..') && !isAbsolute(outputFromBuild))) {
  console.error('The release archive must be outside the build directory.')
  process.exit(2)
}

const auditScript = resolve(dirname(fileURLToPath(import.meta.url)), 'audit-build.mjs')
const audit = spawnSync(process.execPath, [auditScript, options.build, '--json'], { encoding: 'utf8' })
if (audit.status !== 0) {
  process.stderr.write(audit.stderr || audit.stdout)
  process.exit(audit.status || 2)
}

let report
try {
  report = JSON.parse(audit.stdout)
} catch {
  console.error('Build audit did not return valid JSON.')
  process.exit(2)
}

const blockers = report.findings.filter(({ status }) => status === 'BLOCKED')
if (blockers.length) {
  console.error('Release archive was not created because blocking findings remain:')
  for (const blocker of blockers) console.error(`- ${blocker.title}`)
  process.exit(1)
}

if (existsSync(options.output)) {
  if (!options.force) {
    console.error(`Archive already exists: ${options.output}`)
    console.error('Use --force to overwrite it.')
    process.exit(2)
  }
  unlinkSync(options.output)
}

mkdirSync(dirname(options.output), { recursive: true })
const zipCheck = spawnSync('zip', ['-v'], { encoding: 'utf8' })
if (zipCheck.error?.code === 'ENOENT') {
  console.error('The zip executable is required but was not found.')
  process.exit(2)
}

const argumentsList = ['-q', '-r', options.output, '.']
if (!options.includeSourceMaps) argumentsList.push('-x', '*.map')
const packaged = spawnSync('zip', argumentsList, { cwd: options.build, encoding: 'utf8' })
if (packaged.status !== 0) {
  process.stderr.write(packaged.stderr || packaged.stdout)
  process.exit(packaged.status || 2)
}

console.log(`Created Yandex Games release archive: ${options.output}`)
console.log(`Files audited: ${report.fileCount}; bytes audited: ${report.totalBytes}`)
console.log('Manual runtime and Yandex draft checks are still required.')
