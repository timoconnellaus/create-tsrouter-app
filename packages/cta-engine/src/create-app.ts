import { basename, resolve } from 'node:path'

import {
  formatCommand,
  getBinaryFile,
  getPackageManagerScriptCommand,
  packageManagerInstall,
  writeConfigFile,
} from '@tanstack/cta-core'

import { createPackageJSON } from './package-json.js'
import { createTemplateFile } from './template-file.js'
import { installShadcnComponents } from './integrations/shadcn.js'

import type {
  Environment,
  FileBundleHandler,
  Options,
} from '@tanstack/cta-core'

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

  let targetDir: string = cwd || ''
  if (!targetDir.length) {
    targetDir = resolve(process.cwd(), options.projectName)

    if (environment.exists(targetDir)) {
      if (!silent) {
        environment.error(`Directory "${options.projectName}" already exists`)
      }
      return
    }
  }

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

  // Write the project files

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

  const s = silent ? null : environment.spinner()

  // Install all the dependencies

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
      options.starter.command!.command,
      options.starter.command!.args || [],
      resolve(targetDir),
    )
    s?.stop(`Starter ${options.starter.name} setup complete`)
  }

  // Setup git
  if (options.git) {
    s?.start(`Initializing git repository...`)
    await environment.execute('git', ['init'], resolve(targetDir))
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

  await installShadcnComponents(environment, targetDir, options, silent)

  environment.finishRun()

  if (!silent) {
    report(environment, options, appName, targetDir)
  }
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

  const start = !!options.chosenAddOns.find((a) => a.id === 'start')
  const { command, args } = getPackageManagerScriptCommand(
    options.packageManager,
    start ? ['dev'] : ['start'],
  )
  const startCommand = formatCommand(command, args)

  environment.outro(`Your ${appName} app is ready in '${basename(targetDir)}'.

Use the following commands to start your app:
% cd ${options.projectName}
% ${startCommand}

  Please check the README.md for more information on testing, styling, adding routes, etc.${errorStatement}`)
}
