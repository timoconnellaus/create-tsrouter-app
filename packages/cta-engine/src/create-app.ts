import { basename, resolve } from 'node:path'

import { getBinaryFile } from './file-helpers.js'
import { formatCommand } from './utils.js'
import { writeConfigFile } from './config-file.js'
import {
  getPackageManagerScriptCommand,
  packageManagerInstall,
} from './package-manager.js'
import { createPackageJSON } from './package-json.js'
import { createTemplateFile } from './template-file.js'
import { installShadcnComponents } from './integrations/shadcn.js'
import { setupGit } from './integrations/git.js'

import type { Environment, FileBundleHandler, Options } from './types.js'

async function writeFiles(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  const templateFileFromContent = createTemplateFile(
    environment,
    options,
    targetDir,
  )

  async function writeFileBundle(bundle: FileBundleHandler) {
    const files = await bundle.getFiles()
    for (const file of files) {
      const contents = await bundle.getFileContents(file)
      const binaryFile = getBinaryFile(contents)
      if (binaryFile) {
        await environment.writeFile(resolve(targetDir, file), binaryFile)
      } else {
        await templateFileFromContent(file, contents)
      }
    }
  }

  await writeFileBundle(options.framework)

  for (const type of ['add-on', 'example', 'toolchain']) {
    for (const phase of ['setup', 'add-on', 'example']) {
      for (const addOn of options.chosenAddOns.filter(
        (addOn) => addOn.phase === phase && addOn.type === type,
      )) {
        await writeFileBundle(addOn)
      }
    }
  }

  if (options.starter) {
    await writeFileBundle(options.starter)
  }

  await environment.writeFile(
    resolve(targetDir, './package.json'),
    JSON.stringify(createPackageJSON(options), null, 2),
  )

  await writeConfigFile(environment, targetDir, options)
}

async function runCommandsAndInstallDependencies(
  environment: Environment,
  targetDir: string,
  options: Options,
  silent: boolean,
) {
  const s = silent ? null : environment.spinner()

  // Setup git
  if (options.git) {
    s?.start(`Initializing git repository...`)
    await setupGit(environment, targetDir)
    s?.stop(`Initialized git repository`)
  }

  // Install dependencies
  s?.start(`Installing dependencies via ${options.packageManager}...`)
  await packageManagerInstall(
    environment,
    resolve(targetDir),
    options.packageManager,
  )
  s?.stop(`Installed dependencies`)

  for (const phase of ['setup', 'add-on', 'example']) {
    for (const addOn of options.chosenAddOns.filter(
      (addOn) =>
        addOn.phase === phase && addOn.command && addOn.command.command,
    )) {
      s?.start(`Setting up ${addOn.name}...`)
      await environment.execute(
        addOn.command!.command,
        addOn.command!.args || [],
        resolve(targetDir),
      )
      s?.stop(`${addOn.name} setup complete`)
    }
  }

  // Adding starter
  if (
    options.starter &&
    options.starter.command &&
    options.starter.command.command
  ) {
    s?.start(`Setting up starter ${options.starter.name}...`)
    await environment.execute(
      options.starter.command.command,
      options.starter.command.args || [],
      resolve(targetDir),
    )
    s?.stop(`Starter ${options.starter.name} setup complete`)
  }

  await installShadcnComponents(environment, targetDir, options, silent)
}

function report(
  environment: Environment,
  options: Options,
  appName: string,
  targetDir: string,
) {
  const warnings: Array<string> = []
  for (const addOn of options.chosenAddOns) {
    if (addOn.warning) {
      warnings.push(addOn.warning)
    }
  }

  if (warnings.length > 0) {
    environment.warn('Warnings', warnings.join('\n'))
  }

  // Format errors
  let errorStatement = ''
  if (environment.getErrors().length) {
    errorStatement = `

Errors were encountered during this process:

${environment.getErrors().join('\n')}`
  }

  environment.outro(`Your ${appName} app is ready in '${basename(targetDir)}'.

Use the following commands to start your app:
% cd ${options.projectName}
% ${formatCommand(
    getPackageManagerScriptCommand(options.packageManager, ['dev']),
  )}

  Please check the README.md for more information on testing, styling, adding routes, etc.${errorStatement}`)
}

export async function createApp(
  options: Options,
  {
    silent = false,
    environment,
    cwd,
    appName = 'TanStack',
  }: {
    silent?: boolean
    environment: Environment
    cwd?: string
    name?: string
    appName?: string
  },
) {
  environment.startRun()

  const targetDir: string = cwd || resolve(process.cwd(), options.projectName)

  await writeFiles(environment, targetDir, options)

  await runCommandsAndInstallDependencies(
    environment,
    targetDir,
    options,
    silent,
  )

  environment.finishRun()

  if (!silent) {
    report(environment, options, appName, targetDir)
  }
}
