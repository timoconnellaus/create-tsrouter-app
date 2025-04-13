import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { execa, execaSync } from 'execa'

import {
  CONFIG_FILE,
  createDefaultEnvironment,
  createMemoryEnvironment,
  finalizeAddOns,
  getFrameworkById,
  readConfigFile,
  sortObject,
  writeConfigFile,
} from '@tanstack/cta-core'
import { createApp } from './create-app.js'

import type { Environment, Options, PersistedOptions } from '@tanstack/cta-core'

function isDirectory(path: string) {
  return statSync(path).isDirectory()
}

async function hasPendingGitChanges() {
  const status = await execaSync('git', ['status', '--porcelain'])
  return status.stdout.length > 0
}

async function createOptions(
  json: PersistedOptions,
  addOns: Array<string>,
): Promise<Required<Options>> {
  const framework = getFrameworkById(json.framework)

  return {
    ...json,
    framework,
    tailwind: true,
    addOns: true,
    chosenAddOns: await finalizeAddOns(framework!, json.mode as string, [
      ...json.existingAddOns,
      ...addOns,
    ]),
  } as Required<Options>
}

async function runCreateApp(options: Required<Options>) {
  const { environment, output } = createMemoryEnvironment()
  await createApp(options, {
    silent: true,
    environment,
    cwd: process.cwd(),
    name: 'create-tsrouter-app',
  })
  return output
}

export async function addToApp(
  addOns: Array<string>,
  {
    silent = false,
  }: {
    silent?: boolean
  } = {},
  environment: Environment,
) {
  const persistedOptions = await readConfigFile(process.cwd())
  if (!persistedOptions) {
    environment.error(
      'There is no .cta.json file in your project.',
      'This is probably because this was created with an older version of create-tsrouter-app.',
    )
    return
  }

  if (!silent) {
    environment.intro(`Adding ${addOns.join(', ')} to the project...`)
  }

  if (await hasPendingGitChanges()) {
    environment.error(
      'You have pending git changes.',
      'Please commit or stash them before adding add-ons.',
    )
    return
  }

  const newOptions = await createOptions(persistedOptions, addOns)

  const output = await runCreateApp(newOptions)

  const overwrittenFiles: Array<string> = []
  const changedFiles: Array<string> = []
  const contentMap = new Map<string, string>()
  for (const file of Object.keys(output.files)) {
    const relativeFile = file.replace(process.cwd(), '')
    if (existsSync(file)) {
      if (!isDirectory(file)) {
        const contents = (await readFile(file)).toString()
        if (
          ['package.json', CONFIG_FILE].includes(basename(file)) ||
          contents !== output.files[file]
        ) {
          overwrittenFiles.push(relativeFile)
          contentMap.set(relativeFile, output.files[file])
        }
      }
    } else {
      changedFiles.push(relativeFile)
      contentMap.set(relativeFile, output.files[file])
    }
  }

  if (overwrittenFiles.length > 0 && !silent) {
    environment.warn(
      'The following will be overwritten:',
      overwrittenFiles.join('\n'),
    )
    const shouldContinue = await environment.confirm('Do you want to continue?')
    if (!shouldContinue) {
      process.exit(0)
    }
  }

  for (const file of [...changedFiles, ...overwrittenFiles]) {
    const targetFile = `.${file}`
    const fName = basename(file)
    const contents = contentMap.get(file)!
    if (fName === 'package.json') {
      const currentJson = JSON.parse(
        (await readFile(resolve(fName), 'utf-8')).toString(),
      )
      const newJson = JSON.parse(contents)

      currentJson.scripts = newJson.scripts
      currentJson.dependencies = sortObject({
        ...currentJson.dependencies,
        ...newJson.dependencies,
      })
      currentJson.devDependencies = sortObject({
        ...currentJson.devDependencies,
        ...newJson.devDependencies,
      })

      await writeFile(targetFile, JSON.stringify(currentJson, null, 2))
    } else if (fName !== CONFIG_FILE) {
      await mkdir(resolve(dirname(targetFile)), { recursive: true })
      await writeFile(resolve(targetFile), contents)
    }
  }

  // Handle commands
  const originalOutput = await runCreateApp(
    await createOptions(persistedOptions, []),
  )
  const originalCommands = new Set(
    originalOutput.commands.map((c) => [c.command, ...c.args].join(' ')),
  )
  for (const command of output.commands) {
    const commandString = [command.command, ...command.args].join(' ')
    if (!originalCommands.has(commandString)) {
      await execa(command.command, command.args)
    }
  }
  const realEnvironment = createDefaultEnvironment()
  writeConfigFile(realEnvironment, process.cwd(), newOptions)

  const s = silent ? null : environment.spinner()
  s?.start(`Installing dependencies via ${newOptions.packageManager}...`)
  await realEnvironment.execute(
    newOptions.packageManager,
    ['install'],
    resolve(process.cwd()),
  )
  s?.stop(`Installed dependencies`)

  if (!silent) {
    environment.outro('Add-ons added successfully!')
  }
}
