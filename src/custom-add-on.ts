import { readFile, readdir } from 'node:fs/promises'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import chalk from 'chalk'

import { createMemoryEnvironment } from './environment.js'
import { createApp } from './create-app.js'
import { readConfigFile } from './config-file.js'
import { finalizeAddOns } from './add-ons.js'

import type { Options } from './types.js'
import type { PersistedOptions } from './config-file.js'

async function createOptions(
  json: PersistedOptions,
): Promise<Required<Options>> {
  return {
    ...json,
    chosenAddOns: await finalizeAddOns(json.framework!, json.mode!, [
      ...json.existingAddOns,
    ]),
  } as Required<Options>
}

async function runCreateApp(options: Required<Options>) {
  const { environment, output } = createMemoryEnvironment()
  await createApp(options, {
    silent: true,
    environment,
    cwd: process.cwd(),
  })
  return output
}

const IGNORE_FILES = [
  'node_modules',
  'dist',
  'build',
  '.add-ons',
  '.git',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
  'deno.lock',
  'add-on.json',
  'add-on-info.json',
  'package.json',
]

async function compareFiles(
  path: string,
  original: Record<string, string>,
  changedFiles: Record<string, string>,
) {
  const files = await readdir(path, { withFileTypes: true })
  for (const file of files) {
    const filePath = `${path}/${file.name}`
    if (!IGNORE_FILES.includes(file.name)) {
      if (file.isDirectory()) {
        await compareFiles(filePath, original, changedFiles)
      } else {
        const contents = (await readFile(filePath)).toString()
        const absolutePath = resolve(process.cwd(), filePath)
        if (!original[absolutePath] || original[absolutePath] !== contents) {
          changedFiles[filePath] = contents
        }
      }
    }
  }
}

export async function initAddOn() {
  const persistedOptions = await readConfigFile(process.cwd())
  if (!persistedOptions) {
    console.error(`${chalk.red('There is no .cta.json file in your project.')}

This is probably because this was created with an older version of create-tsrouter-app.`)
    return
  }

  if (!existsSync('add-on-info.json')) {
    writeFileSync(
      'add-on-info.json',
      JSON.stringify(
        {
          name: 'custom-add-on',
          version: '0.0.1',
          description: 'A custom add-on',
          author: 'John Doe',
          license: 'MIT',
          link: 'https://github.com/john-doe/custom-add-on',
          command: {},
          shadcnComponents: [],
          templates: [persistedOptions.mode],
          routes: [],
          warning: '',
          variables: {},
          phase: 'add-on',
          type: 'overlay',
        },
        null,
        2,
      ),
    )
  }

  const info = JSON.parse((await readFile('add-on-info.json')).toString())

  const originalOutput = await runCreateApp(
    await createOptions(persistedOptions),
  )

  const originalPackageJson = JSON.parse(
    originalOutput.files[resolve(process.cwd(), 'package.json')],
  )
  const currentPackageJson = JSON.parse(
    (await readFile('package.json')).toString(),
  )

  info.packageAdditions = {
    scripts: {},
    dependencies: {},
    devDependencies: {},
  }

  if (
    JSON.stringify(originalPackageJson.scripts) !==
    JSON.stringify(currentPackageJson.scripts)
  ) {
    info.packageAdditions.scripts = currentPackageJson.scripts
  }

  const dependencies: Record<string, string> = {}
  for (const dependency of Object.keys(currentPackageJson.dependencies)) {
    if (
      originalPackageJson.dependencies[dependency] !==
      currentPackageJson.dependencies[dependency]
    ) {
      dependencies[dependency] = currentPackageJson.dependencies[dependency]
    }
  }
  info.packageAdditions.dependencies = dependencies

  const devDependencies: Record<string, string> = {}
  for (const dependency of Object.keys(currentPackageJson.devDependencies)) {
    if (
      originalPackageJson.devDependencies[dependency] !==
      currentPackageJson.devDependencies[dependency]
    ) {
      devDependencies[dependency] =
        currentPackageJson.devDependencies[dependency]
    }
  }
  info.packageAdditions.devDependencies = devDependencies

  const changedFiles: Record<string, string> = {}
  await compareFiles('.', originalOutput.files, changedFiles)

  info.files = changedFiles
  info.deletedFiles = []

  info.mode = persistedOptions.mode
  info.framework = persistedOptions.framework
  info.typescript = persistedOptions.typescript
  info.tailwind = persistedOptions.tailwind
  info.addDependencies = persistedOptions.existingAddOns

  for (const file of Object.keys(originalOutput.files)) {
    if (!existsSync(file)) {
      info.deletedFiles.push(file.replace(process.cwd(), '.'))
    }
  }

  writeFileSync('add-on.json', JSON.stringify(info, null, 2))
}
