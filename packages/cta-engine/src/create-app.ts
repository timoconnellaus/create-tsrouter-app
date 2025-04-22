import { basename, resolve } from 'node:path'

import { isBase64 } from './file-helpers.js'
import { formatCommand } from './utils.js'
import { writeConfigFileToEnvironment } from './config-file.js'
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

    const deletedFiles = await bundle.getDeletedFiles()
    for (const file of deletedFiles) {
      await environment.deleteFile(resolve(options.targetDir, file))
    }
  }

  environment.startStep('Writing framework files...')
  await writeFileBundle(options.framework)
  environment.finishStep('Framework files written')

  for (const type of ['add-on', 'example', 'toolchain']) {
    for (const phase of ['setup', 'add-on', 'example']) {
      for (const addOn of options.chosenAddOns.filter(
        (addOn) => addOn.phase === phase && addOn.type === type,
      )) {
        environment.startStep(`Writing ${addOn.name} files...`)
        await writeFileBundle(addOn)
        environment.finishStep(`${addOn.name} files written`)
      }
    }
  }

  if (options.starter) {
    environment.startStep(`Writing starter files...`)
    await writeFileBundle(options.starter)
    environment.finishStep(`Starter files written`)
  }

  environment.startStep(`Writing package.json...`)
  await environment.writeFile(
    resolve(options.targetDir, './package.json'),
    JSON.stringify(createPackageJSON(options), null, 2),
  )
  environment.finishStep(`package.json written`)

  environment.startStep(`Writing config file...`)
  await writeConfigFileToEnvironment(environment, options)
  environment.finishStep(`Config file written`)
}

async function runCommandsAndInstallDependencies(
  environment: Environment,
  options: Options,
) {
  const s = environment.spinner()

  // Setup git
  if (options.git) {
    s.start(`Initializing git repository...`)
    environment.startStep(`Initializing git repository...`)

    await setupGit(environment, options.targetDir)

    environment.finishStep(`Initialized git repository`)
    s.stop(`Initialized git repository`)
  }

  // Install dependencies
  s.start(`Installing dependencies via ${options.packageManager}...`)
  environment.startStep(
    `Installing dependencies via ${options.packageManager}...`,
  )
  await packageManagerInstall(
    environment,
    options.targetDir,
    options.packageManager,
  )
  environment.finishStep(`Installed dependencies`)
  s.stop(`Installed dependencies`)

  for (const phase of ['setup', 'add-on', 'example']) {
    for (const addOn of options.chosenAddOns.filter(
      (addOn) =>
        addOn.phase === phase && addOn.command && addOn.command.command,
    )) {
      s.start(`Setting up ${addOn.name}...`)
      environment.startStep(`Setting up ${addOn.name}...`)
      await environment.execute(
        addOn.command!.command,
        addOn.command!.args || [],
        options.targetDir,
      )
      environment.finishStep(`${addOn.name} setup complete`)
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
    environment.startStep(`Setting up starter ${options.starter.name}...`)

    await environment.execute(
      options.starter.command.command,
      options.starter.command.args || [],
      options.targetDir,
    )

    environment.finishStep(`Starter ${options.starter.name} setup complete`)
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
