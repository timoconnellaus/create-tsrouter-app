import { basename, resolve } from 'node:path'

import {
  getBinaryFile,
  packageManagerExecute,
  writeConfigFile,
} from '@tanstack/cta-core'

import { createPackageJSON } from './package-json.js'
import { createTemplateFile } from './template-file.js'

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
    options.projectName,
    options,
    targetDir,
  )

  async function writeFileBundle(bundle: FileBundleHandler) {
    const files = await bundle.getFiles()
    for (const file of files) {
      const binaryFile = getBinaryFile(file)
      if (binaryFile) {
        await environment.writeFile(resolve(targetDir, file), binaryFile)
      } else {
        await templateFileFromContent(file, await bundle.getFileContents(file))
      }
    }
  }

  await writeFileBundle(options.framework)

  for (const type of ['add-on', 'example']) {
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

  // Setup the package.json file
  await environment.writeFile(
    resolve(targetDir, './package.json'),
    JSON.stringify(createPackageJSON(options), null, 2),
  )

  await writeConfigFile(environment, targetDir, options)

  const s = silent ? null : environment.spinner()

  // Setup the add-ons
  const isAddOnEnabled = (id: string) =>
    options.chosenAddOns.find((a) => a.id === id)

  // Copy all the asset files from the addons
  for (const type of ['add-on', 'example']) {
    for (const phase of ['setup', 'add-on', 'example']) {
      for (const addOn of options.chosenAddOns.filter(
        (addOn) =>
          addOn.phase === phase &&
          addOn.type === type &&
          addOn.command &&
          addOn.command.command,
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
  await environment.execute(
    options.packageManager,
    ['install'],
    resolve(targetDir),
  )
  s?.stop(`Installed dependencies`)

  // Run all the commands
  if (isAddOnEnabled('shadcn')) {
    const shadcnComponents = new Set<string>()
    for (const addOn of options.chosenAddOns) {
      if (addOn.shadcnComponents) {
        for (const component of addOn.shadcnComponents) {
          shadcnComponents.add(component)
        }
      }
    }
    if (options.starter) {
      if (options.starter.shadcnComponents) {
        for (const component of options.starter.shadcnComponents) {
          shadcnComponents.add(component)
        }
      }
    }

    if (shadcnComponents.size > 0) {
      s?.start(
        `Installing shadcn components (${Array.from(shadcnComponents).join(', ')})...`,
      )
      await packageManagerExecute(
        environment,
        options.packageManager,
        'shadcn@latest',
        ['add', '--force', '--silent', '--yes', ...shadcnComponents],
        resolve(targetDir),
      )
      s?.stop(`Installed additional shadcn components`)
    }
  }

  if (options.toolchain === 'biome') {
    s?.start(`Applying toolchain ${options.toolchain}...`)
    switch (options.packageManager) {
      case 'pnpm':
        // pnpm automatically forwards extra arguments
        await environment.execute(
          options.packageManager,
          ['run', 'check', '--fix'],
          resolve(targetDir),
        )
        break
      default:
        await environment.execute(
          options.packageManager,
          ['run', 'check', '--', '--fix'],
          resolve(targetDir),
        )
        break
    }
    s?.stop(`Applied toolchain ${options.toolchain}...`)
  }

  if (options.toolchain === 'eslint+prettier') {
    s?.start(`Applying toolchain ${options.toolchain}...`)
    await environment.execute(
      options.packageManager,
      ['run', 'check'],
      targetDir,
    )
    s?.stop(`Applied toolchain ${options.toolchain}...`)
  }

  environment.finishRun()

  if (!silent) {
    // Check for warnings
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

    let startCommand = `${options.packageManager} ${isAddOnEnabled('start') ? 'dev' : 'start'}`
    if (options.packageManager === 'deno') {
      startCommand = `deno ${isAddOnEnabled('start') ? 'task dev' : 'start'}`
    }

    environment.outro(`Your ${appName} app is ready in '${basename(targetDir)}'.

Use the following commands to start your app:
% cd ${options.projectName}
% ${startCommand}

Please check the README.md for more information on testing, styling, adding routes, etc.${errorStatement}`)
  }
}
