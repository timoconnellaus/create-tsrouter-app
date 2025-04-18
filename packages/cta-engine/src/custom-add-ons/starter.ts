import { readFile } from 'node:fs/promises'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  compareFiles,
  createAppOptionsFromPersisted,
  createIgnore,
  createPackageAdditions,
  readCurrentProjectOptions,
  recursivelyGatherFiles,
  runCreateApp,
} from './shared.js'

import type { PersistedOptions } from '../config-file'
import type { Environment, StarterCompiled, StarterInfo } from '../types'

const INFO_FILE = 'starter-info.json'
const COMPILED_FILE = 'starter.json'

export async function readOrGenerateStarterInfo(
  options: PersistedOptions,
): Promise<StarterInfo> {
  return existsSync(INFO_FILE)
    ? JSON.parse((await readFile(INFO_FILE)).toString())
    : {
        id: `${options.projectName}-starter`,
        name: `${options.projectName}-starter`,
        version: '0.0.1',
        description: 'Project starter',
        author: 'Jane Smith <jane.smith@example.com>',
        license: 'MIT',
        link: `https://github.com/jane-smith/${options.projectName}-starter`,
        shadcnComponents: [],
        framework: options.framework,
        mode: options.mode!,
        routes: [],
        warning: '',
        type: 'starter',
        packageAdditions: {
          scripts: {},
          dependencies: {},
          devDependencies: {},
        },
        dependsOn: options.existingAddOns,
        typescript: options.typescript!,
        tailwind: options.tailwind!,
      }
}

async function loadCurrentStarterInfo(environment: Environment) {
  const persistedOptions = await readCurrentProjectOptions(environment)
  const info = await readOrGenerateStarterInfo(persistedOptions)

  const output = await runCreateApp(
    await createAppOptionsFromPersisted(persistedOptions),
  )

  return { info, output }
}

export async function updateStarterInfo(environment: Environment) {
  const { info, output } = await loadCurrentStarterInfo(environment)

  info.packageAdditions = createPackageAdditions(
    JSON.parse(output.files['./package.json']),
    JSON.parse((await readFile('package.json')).toString()),
  )

  writeFileSync(INFO_FILE, JSON.stringify(info, null, 2))
}

export async function compileStarter(environment: Environment) {
  const { info, output } = await loadCurrentStarterInfo(environment)

  const files: Record<string, string> = await recursivelyGatherFiles(
    resolve(process.cwd()),
  )
  const ignore = createIgnore(process.cwd())
  const changedFiles: Record<string, string> = {}
  await compareFiles('.', ignore, output.files, changedFiles)

  const deletedFiles: Array<string> = []
  for (const file of Object.keys(output.files)) {
    if (!existsSync(resolve(process.cwd(), file))) {
      deletedFiles.push(file)
    }
  }

  const compiledInfo: StarterCompiled = {
    ...info,
    files: changedFiles,
    deletedFiles,
  }

  writeFileSync(COMPILED_FILE, JSON.stringify(compiledInfo, null, 2))
}

export async function initStarter(environment: Environment) {
  await updateStarterInfo(environment)
  await compileStarter(environment)
}
