import { resolve } from 'node:path'

import {
  createApp,
  createDefaultEnvironment,
  createMemoryEnvironment,
  finalizeAddOns,
  getFrameworkById,
  loadStarter,
} from '@tanstack/cta-engine'

import { registerFrameworks } from './framework-registration'

import { cleanUpFileArray, cleanUpFiles } from './file-helpers'
import { getApplicationMode, getProjectPath } from './server-environment'

import type { Options, SerializedOptions, Starter } from '@tanstack/cta-engine'

export async function createAppWrapper(
  projectOptions: SerializedOptions,
  opts: { dryRun?: boolean; stream?: boolean },
) {
  registerFrameworks()

  const framework = getFrameworkById(projectOptions.framework)!

  let starter: Starter | undefined
  const addOns: Array<string> = [...projectOptions.chosenAddOns]
  if (projectOptions.starter) {
    starter = await loadStarter(projectOptions.starter)
    for (const addOn of starter.dependsOn ?? []) {
      addOns.push(addOn)
    }
  }
  const chosenAddOns = await finalizeAddOns(
    framework,
    projectOptions.mode,
    addOns,
  )

  const projectPath = getProjectPath()
  const targetDir =
    getApplicationMode() === 'add'
      ? projectOptions.targetDir
      : resolve(projectPath, projectOptions.projectName)

  const options: Options = {
    ...projectOptions,
    targetDir,
    starter,
    framework,
    chosenAddOns,
  }

  function createEnvironment() {
    if (opts.dryRun) {
      return createMemoryEnvironment(targetDir)
    }
    return {
      environment: createDefaultEnvironment(),
      output: { files: {}, deletedFiles: [], commands: [] },
    }
  }

  const { environment, output } = createEnvironment()

  if (opts.stream) {
    return new ReadableStream({
      start(controller) {
        environment.startStep = (message) => {
          console.log(message)
          controller.enqueue(new TextEncoder().encode(`${message}\n`))
        }
        environment.finishStep = (message) => {
          console.log(message)
          controller.enqueue(new TextEncoder().encode(`${message}\n`))
        }

        createApp(environment, options).then(() => {
          controller.close()
        })
      },
    })
  } else {
    await createApp(environment, options)

    output.files = cleanUpFiles(output.files, targetDir)
    output.deletedFiles = cleanUpFileArray(output.deletedFiles, targetDir)

    return output
  }
}
