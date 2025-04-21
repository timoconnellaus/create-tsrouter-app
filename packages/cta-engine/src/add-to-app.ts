import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { execaSync } from 'execa'

import { CONFIG_FILE } from './constants.js'
import { finalizeAddOns } from './add-ons.js'
import { getFrameworkById } from './frameworks.js'
import {
  createDefaultEnvironment,
  createMemoryEnvironment,
} from './environment.js'
import { createApp } from './create-app.js'
import { readConfigFile, writeConfigFile } from './config-file.js'
import { formatCommand, sortObject } from './utils.js'
import { packageManagerInstall } from './package-manager.js'
import { getBinaryFile, isBase64, readFileHelper } from './file-helpers.js'

import type { Environment, Mode, Options } from './types.js'
import type { PersistedOptions } from './config-file.js'

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
    chosenAddOns: await finalizeAddOns(framework!, json.mode as Mode, [
      ...json.existingAddOns,
      ...addOns,
    ]),
  } as Required<Options>
}

async function runCreateApp(options: Required<Options>) {
  const { environment, output } = createMemoryEnvironment()
  await createApp(environment, {
    ...options,
    targetDir: process.cwd(),
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

  environment.startStep('Processing new app setup...')

  const newOptions = await createOptions(persistedOptions, addOns)
  const output = await runCreateApp(newOptions)
  const overwrittenFiles: Array<string> = []
  const changedFiles: Array<string> = []
  const contentMap = new Map<string, string>()

  for (const file of Object.keys(output.files)) {
    const relativeFile = file.replace(process.cwd(), '')
    if (existsSync(file)) {
      if (!isDirectory(file)) {
        const contents = readFileHelper(file)
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

  const deletedFiles: Array<string> = []
  for (const file of output.deletedFiles) {
    deletedFiles.push(file.replace(process.cwd(), ''))
  }

  environment.finishStep('App setup processed')

  if (overwrittenFiles.length > 0 && !silent) {
    environment.warn(
      'The following will be overwritten:',
      [...overwrittenFiles, ...deletedFiles].join('\n'),
    )
    const shouldContinue = await environment.confirm('Do you want to continue?')
    if (!shouldContinue) {
      process.exit(0)
    }
  }

  environment.startStep('Writing files...')

  for (const file of output.deletedFiles) {
    if (existsSync(file)) {
      await unlink(file)
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
      if (isBase64(contents)) {
        await writeFile(resolve(targetFile), getBinaryFile(contents)!)
      } else {
        await writeFile(resolve(targetFile), contents)
      }
    }
  }

  environment.finishStep('Files written')

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
      environment.startStep(
        `Running ${formatCommand({ command: command.command, args: command.args })}...`,
      )
      await environment.execute(
        command.command,
        command.args,
        newOptions.targetDir,
      )
      environment.finishStep(`${command.command} complete`)
    }
  }

  environment.startStep('Writing config file...')
  const realEnvironment = createDefaultEnvironment()
  writeConfigFile(realEnvironment, process.cwd(), newOptions)
  environment.finishStep('Config file written')

  environment.startStep(
    `Installing dependencies via ${newOptions.packageManager}...`,
  )
  const s = silent ? null : environment.spinner()
  s?.start(`Installing dependencies via ${newOptions.packageManager}...`)
  await packageManagerInstall(
    realEnvironment,
    newOptions.targetDir,
    newOptions.packageManager,
  )
  s?.stop(`Installed dependencies`)
  environment.finishStep('Installed dependencies')

  if (!silent) {
    environment.outro('Add-ons added successfully!')
  }
}
