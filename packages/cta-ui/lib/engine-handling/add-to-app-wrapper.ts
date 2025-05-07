import { resolve } from 'node:path'

import {
  addToApp,
  createAppOptionsFromPersisted,
  createDefaultEnvironment,
  createMemoryEnvironment,
  createSerializedOptionsFromPersisted,
  readConfigFile,
  recursivelyGatherFiles,
  writeConfigFileToEnvironment,
} from '@tanstack/cta-engine'

import { cleanUpFileArray, cleanUpFiles } from './file-helpers.js'
import { getProjectPath } from './server-environment.js'
import { createAppWrapper } from './create-app-wrapper.js'

import type { Environment } from '@tanstack/cta-engine'
import type { Response } from 'express'
import type { DryRunOutput } from '../types.js'

export async function addToAppWrapper(
  addOns: Array<string>,
  opts: {
    dryRun?: boolean
    response?: Response
  },
) {
  const projectPath = getProjectPath()

  const persistedOptions = await readConfigFile(projectPath)

  if (!persistedOptions) {
    throw new Error('No config file found')
  }

  const options = await createAppOptionsFromPersisted(persistedOptions)
  options.targetDir = projectPath

  const newAddons: Array<string> = []
  for (const addOn of addOns) {
    if (!options.chosenAddOns.some((a) => a.id === addOn)) {
      newAddons.push(addOn)
    }
  }

  if (newAddons.length === 0) {
    const serializedOptions =
      createSerializedOptionsFromPersisted(persistedOptions)
    return await createAppWrapper(serializedOptions, opts)
  }

  async function createEnvironment(): Promise<{
    environment: Environment
    output: DryRunOutput
  }> {
    if (opts.dryRun) {
      const { environment, output } = createMemoryEnvironment(projectPath)

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

    environment.startStep = ({
      id,
      type,
      message,
    }: {
      id: string
      type: string
      message: string
    }) => {
      opts.response!.write(
        JSON.stringify({
          msgType: 'start',
          id,
          type,
          message,
        }) + '\n',
      )
    }
    environment.finishStep = (id: string, message: string) => {
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
    writeConfigFileToEnvironment(environment, options)
    environment.finishRun()

    output.files = cleanUpFiles(output.files, projectPath)
    output.deletedFiles = cleanUpFileArray(output.deletedFiles, projectPath)
    return output
  }
}
