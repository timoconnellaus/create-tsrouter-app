import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  addToApp,
  createDefaultEnvironment,
  createMemoryEnvironment,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import { cleanUpFileArray, cleanUpFiles } from './file-helpers.js'
import { getProjectPath } from './server-environment.js'
import { createAppWrapper } from './create-app-wrapper.js'

import type { Response } from 'express'

export async function addToAppWrapper(
  addOns: Array<string>,
  opts: {
    dryRun?: boolean
    response?: Response
  },
) {
  const projectPath = getProjectPath()

  const persistedOptions = JSON.parse(
    readFileSync(resolve(projectPath, '.cta.json')).toString(),
  )

  persistedOptions.targetDir = projectPath

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

  if (opts.response) {
    opts.response.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
    })

    environment.startStep = ({ id, type, message }) => {
      opts.response!.write(
        JSON.stringify({
          msgType: 'start',
          id,
          type,
          message,
        }) + '\n',
      )
    }
    environment.finishStep = (id, message) => {
      opts.response!.write(
        JSON.stringify({
          msgType: 'finish',
          id,
          message,
        }) + '\n',
      )
    }

    environment.startRun()
    await addToApp(environment, newAddons, projectPath, {
      forced: true,
    })
    environment.finishRun()
    opts.response.end()
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
