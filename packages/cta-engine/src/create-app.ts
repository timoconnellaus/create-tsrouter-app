import { basename, resolve } from 'node:path'

import { isBase64 } from './file-helpers.js'
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

async function writeFiles(environment: Environment, options: Options) {
  const templateFileFromContent = createTemplateFile(environment, options)

  async function writeFileBundle(bundle: FileBundleHandler) {
    const files = await bundle.getFiles()
    for (const file of files) {
      const contents = await bundle.getFileContents(file)
      const isBinaryFile = isBase64(contents)
      if (isBinaryFile) {
        await environment.writeFileBase64(
          resolve(options.targetDir, file),
          contents,
        )
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
    resolve(options.targetDir, './package.json'),
    JSON.stringify(createPackageJSON(options), null, 2),
  )

  await writeConfigFile(environment, options.targetDir, options)
}

async function runCommandsAndInstallDependencies(
  environment: Environment,
  options: Options,
) {
  const s = environment.spinner()

  // Setup git
  if (options.git) {
    s.start(`Initializing git repository...`)
    await setupGit(environment, options.targetDir)
    s.stop(`Initialized git repository`)
  }

  // Install dependencies
  s.start(`Installing dependencies via ${options.packageManager}...`)
  await packageManagerInstall(
    environment,
    options.targetDir,
    options.packageManager,
  )
  s.stop(`Installed dependencies`)

  for (const phase of ['setup', 'add-on', 'example']) {
    for (const addOn of options.chosenAddOns.filter(
      (addOn) =>
        addOn.phase === phase && addOn.command && addOn.command.command,
    )) {
      s.start(`Setting up ${addOn.name}...`)
      await environment.execute(
        addOn.command!.command,
        addOn.command!.args || [],
        options.targetDir,
      )
      s.stop(`${addOn.name} setup complete`)
    }
  }

  // Adding starter
  if (
    options.starter &&
    options.starter.command &&
    options.starter.command.command
  ) {
    s.start(`Setting up starter ${options.starter.name}...`)
    await environment.execute(
      options.starter.command.command,
      options.starter.command.args || [],
      options.targetDir,
    )
    s.stop(`Starter ${options.starter.name} setup complete`)
  }

  await installShadcnComponents(environment, options.targetDir, options)
}

function report(environment: Environment, options: Options) {
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

  environment.outro(
    `Your ${environment.appName} app is ready in '${basename(options.targetDir)}'.

Use the following commands to start your app:
% cd ${options.projectName}
% ${formatCommand(
      getPackageManagerScriptCommand(options.packageManager, ['dev']),
    )}

  Please check the README.md for more information on testing, styling, adding routes, etc.${errorStatement}`,
  )
}

export async function createApp(environment: Environment, options: Options) {
  environment.startRun()
  await writeFiles(environment, options)
  await runCommandsAndInstallDependencies(environment, options)
  environment.finishRun()

  report(environment, options)
}
