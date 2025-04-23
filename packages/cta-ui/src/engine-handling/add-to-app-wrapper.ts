import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  addToApp,
  createDefaultEnvironment,
  createMemoryEnvironment,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import { createAppWrapper } from './create-app-wrapper.js'

import { getProjectPath } from '@/engine-handling/server-environment.js'
import {
  cleanUpFileArray,
  cleanUpFiles,
} from '@/engine-handling/file-helpers.js'

export async function addToAppWrapper(
  addOns: Array<string>,
  opts: {
    dryRun?: boolean
    stream?: boolean
  },
) {
  const projectPath = getProjectPath()

  const persistedOptions = JSON.parse(
    readFileSync(resolve(projectPath, '.cta.json')),
  )

  const newAddons: Array<string> = []
  for (const addOn of addOns) {
    if (!persistedOptions.existingAddOns.includes(addOn)) {
      newAddons.push(addOn)
    }
  }

  if (newAddons.length === 0) {
    return await createAppWrapper(persistedOptions, opts)
  }

  async function createEnvironment() {
    if (opts.dryRun) {
      const { environment, output } = createMemoryEnvironment(projectPath)
      environment.writeFile(
        resolve(projectPath, '.cta.json'),
        JSON.stringify(persistedOptions, null, 2),
      )

      const localFiles = await cleanUpFiles(
        await recursivelyGatherFiles(projectPath, false),
      )
      for (const file of Object.keys(localFiles)) {
        environment.writeFile(resolve(projectPath, file), localFiles[file])
      }
      return { environment, output }
    }
    return {
      environment: createDefaultEnvironment(),
      output: { files: {}, deletedFiles: [], commands: [] },
    }
  }

  const { environment, output } = await createEnvironment()

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

        environment.startRun()
        addToApp(environment, newAddons, projectPath, {
          forced: true,
        }).then(() => {
          environment.finishRun()
          controller.close()
        })
      },
    })
  } else {
    environment.startRun()
    await addToApp(environment, newAddons, projectPath, {
      forced: true,
    })
    environment.finishRun()

    output.files = cleanUpFiles(output.files, projectPath)
    output.deletedFiles = cleanUpFileArray(output.deletedFiles, projectPath)
    return output
  }
}
