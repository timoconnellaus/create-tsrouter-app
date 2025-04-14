import { basename, resolve } from 'node:path'

import {
  copyAddOnFile,
  getBinaryFile,
  packageManagerExecute,
  writeConfigFile,
} from '@tanstack/cta-core'

import { createPackageJSON } from './package-json.js'
import { createTemplateFile } from './template-file.js'

import type {
  AddOn,
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

  const projectBaseDir = resolve(options.framework.baseDirectory)
  const templateDirBase = resolve(options.framework.baseDirectory, 'base')

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

  async function templateFile(
    templateBase: string,
    file: string,
    targetFileName?: string,
    extraTemplateValues?: Record<string, any>,
  ) {
    const content = await environment.readFile(
      resolve(templateBase, file),
      'utf-8',
    )
    return templateFileFromContent(
      file,
      content.toString(),
      targetFileName,
      extraTemplateValues,
    )
  }

  async function writeFileBundle(bundle: FileBundleHandler) {
    const files = await bundle.getFiles()
    for (const file of files) {
      const binaryFile = getBinaryFile(file)
      if (binaryFile) {
        await environment.writeFile(resolve(targetDir, file), binaryFile)
      } else {
        await templateFile(templateDirBase, file)
      }
    }
  }

  await writeFileBundle(options.framework)

  // Setup the package.json file, optionally with typescript, tailwind and formatter/linter
  await createPackageJSON(
    environment,
    options.projectName,
    options,
    projectBaseDir,
    targetDir,
    options.chosenAddOns.map((addOn) => addOn.packageAdditions),
  )

  await writeConfigFile(environment, targetDir, options)

  const s = silent ? null : environment.spinner()

  // Setup the add-ons
  const isAddOnEnabled = (id: string) =>
    options.chosenAddOns.find((a) => a.id === id)

  async function runAddOn(addOn: AddOn) {
    if (addOn.files) {
      for (const file of Object.keys(addOn.files)) {
        await copyAddOnFile(
          environment,
          addOn.files[file],
          file,
          resolve(targetDir, file),
          (content, targetFileName) =>
            templateFileFromContent(targetFileName, content),
        )
      }
    }

    if (addOn.command && addOn.command.command) {
      await environment.execute(
        addOn.command.command,
        addOn.command.args || [],
        resolve(targetDir),
      )
    }
  }

  // Copy all the asset files from the addons
  for (const type of ['add-on', 'example']) {
    for (const phase of ['setup', 'add-on', 'example']) {
      for (const addOn of options.chosenAddOns.filter(
        (addOn) => addOn.phase === phase && addOn.type === type,
      )) {
        s?.start(`Setting up ${addOn.name}...`)
        await runAddOn(addOn)
        s?.stop(`${addOn.name} setup complete`)
      }
    }
  }

  // Adding starter
  if (options.starter) {
    s?.start(`Setting up starter ${options.starter.name}...`)
    await runAddOn(options.starter)
    s?.stop(`Starter ${options.starter.name} setup complete`)
  }

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
        ['add', '--silent', '--yes', ...shadcnComponents],
        resolve(targetDir),
      )
      s?.stop(`Installed additional shadcn components`)
    }
  }

  const warnings: Array<string> = []
  for (const addOn of options.chosenAddOns) {
    if (addOn.warning) {
      warnings.push(addOn.warning)
    }
  }

  // Install dependencies
  s?.start(`Installing dependencies via ${options.packageManager}...`)
  await environment.execute(
    options.packageManager,
    ['install'],
    resolve(targetDir),
  )
  s?.stop(`Installed dependencies`)

  if (warnings.length > 0) {
    if (!silent) {
      environment.warn('Warnings', warnings.join('\n'))
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

  if (options.git) {
    s?.start(`Initializing git repository...`)
    await environment.execute('git', ['init'], resolve(targetDir))
    s?.stop(`Initialized git repository`)
  }

  environment.finishRun()

  let errorStatement = ''
  if (environment.getErrors().length) {
    errorStatement = `

Errors were encountered during this process:

${environment.getErrors().join('\n')}`
  }

  if (!silent) {
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
