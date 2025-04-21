import { readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import parseGitignore from 'parse-gitignore'
import ignore from 'ignore'

import { createApp } from '../create-app.js'
import { createMemoryEnvironment } from '../environment.js'
import { finalizeAddOns } from '../add-ons.js'
import { getFrameworkById } from '../frameworks.js'
import { readConfigFile } from '../config-file.js'
import { readFileHelper } from '../file-helpers.js'

import type { Environment, Mode, Options } from '../types.js'
import type { PersistedOptions } from '../config-file.js'

export const IGNORE_FILES = [
  '.add-on',
  '.cta.json',
  '.git',
  'add-on-info.json',
  'add-on.json',
  'build',
  'bun.lock',
  'bun.lockb',
  'deno.lock',
  'dist',
  'node_modules',
  'package-lock.json',
  'pnpm-lock.yaml',
  'starter.json',
  'starter-info.json',
  'yarn.lock',
]

const PROJECT_FILES = ['package.json']

export function createIgnore(path: string, includeProjectFiles = true) {
  const ignoreList = existsSync(resolve(path, '.gitignore'))
    ? (
        parseGitignore(
          readFileSync(resolve(path, '.gitignore')),
        ) as unknown as { patterns: Array<string> }
      ).patterns
    : []
  const ig = ignore().add(ignoreList)
  return (filePath: string) => {
    const fileName = basename(filePath)
    if (
      IGNORE_FILES.includes(fileName) ||
      (includeProjectFiles && PROJECT_FILES.includes(fileName))
    ) {
      return true
    }
    const nameWithoutDotSlash = fileName.replace(/^\.\//, '')
    return ig.ignores(nameWithoutDotSlash)
  }
}

async function recursivelyGatherFilesHelper(
  basePath: string,
  path: string,
  files: Record<string, string>,
  ignore: (filePath: string) => boolean,
) {
  const dirFiles = await readdir(path, { withFileTypes: true })
  for (const file of dirFiles) {
    if (ignore(file.name)) {
      continue
    }
    if (file.isDirectory()) {
      await recursivelyGatherFilesHelper(
        basePath,
        resolve(path, file.name),
        files,
        ignore,
      )
    } else {
      const filePath = resolve(path, file.name)
      files[filePath.replace(basePath, '.')] = await readFileHelper(filePath)
    }
  }
}

export async function recursivelyGatherFiles(
  path: string,
  includeProjectFiles = true,
) {
  const ignore = createIgnore(path, includeProjectFiles)
  const files: Record<string, string> = {}
  await recursivelyGatherFilesHelper(path, path, files, ignore)
  return files
}

export function createPackageAdditions(
  originalPackageJson: Record<string, any>,
  currentPackageJson: Record<string, any>,
) {
  const packageAdditions: Record<string, any> = {}

  const scripts: Record<string, any> = {}
  for (const script of Object.keys(currentPackageJson.scripts || {})) {
    if (
      originalPackageJson.scripts[script] !== currentPackageJson.scripts[script]
    ) {
      scripts[script] = currentPackageJson.scripts[script]
    }
  }
  packageAdditions.scripts = Object.keys(scripts).length ? scripts : undefined

  const dependencies: Record<string, string> = {}
  for (const dependency of Object.keys(currentPackageJson.dependencies || {})) {
    if (
      originalPackageJson.dependencies[dependency] !==
      currentPackageJson.dependencies[dependency]
    ) {
      dependencies[dependency] = currentPackageJson.dependencies[dependency]
    }
  }
  packageAdditions.dependencies = Object.keys(dependencies).length
    ? dependencies
    : undefined

  const devDependencies: Record<string, string> = {}
  for (const dependency of Object.keys(
    currentPackageJson.devDependencies || {},
  )) {
    if (
      originalPackageJson.devDependencies[dependency] !==
      currentPackageJson.devDependencies[dependency]
    ) {
      devDependencies[dependency] =
        currentPackageJson.devDependencies[dependency]
    }
  }
  packageAdditions.devDependencies = Object.keys(devDependencies).length
    ? devDependencies
    : undefined

  return packageAdditions
}

export async function createAppOptionsFromPersisted(
  json: PersistedOptions,
): Promise<Required<Options>> {
  const framework = getFrameworkById(json.framework)
  return {
    ...json,
    framework,
    addOns: true,
    chosenAddOns: await finalizeAddOns(framework!, json.mode as Mode, [
      ...json.existingAddOns,
    ]),
  } as Required<Options>
}

export async function runCreateApp(options: Required<Options>) {
  const { environment, output } = createMemoryEnvironment()

  const targetDir = resolve(process.cwd())

  await createApp(environment, {
    ...options,
    targetDir,
  })

  output.files = Object.fromEntries(
    Object.entries(output.files).map(([key, value]) => {
      return [key.replace(targetDir, '.'), value]
    }),
  )

  return output
}

export async function compareFilesRecursively(
  path: string,
  ignore: (filePath: string) => boolean,
  original: Record<string, string>,
  changedFiles: Record<string, string>,
) {
  const files = await readdir(path, { withFileTypes: true })
  for (const file of files) {
    const filePath = `${path}/${file.name}`
    if (!ignore(file.name)) {
      if (file.isDirectory()) {
        await compareFilesRecursively(filePath, ignore, original, changedFiles)
      } else {
        const contents = await readFileHelper(filePath)
        if (!original[filePath] || original[filePath] !== contents) {
          changedFiles[filePath] = contents
        }
      }
    }
  }
}

export async function readCurrentProjectOptions(environment: Environment) {
  const persistedOptions = await readConfigFile(process.cwd())
  if (!persistedOptions) {
    environment.error(
      'There is no .cta.json file in your project.',
      `This is probably because this was created with an older version of create-tsrouter-app.`,
    )
    process.exit(1)
  }
  return persistedOptions
}
