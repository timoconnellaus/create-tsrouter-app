import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

import {
  createApp,
  createAppOptionsFromPersisted,
  createMemoryEnvironment,
  finalizeAddOns,
  getAllAddOns,
  getFrameworkById,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import type { Options, SerializedOptions } from '@tanstack/cta-engine'

import { cleanUpFiles } from '@/lib/file-helpers'

let registered = false

export const APIRoute = createAPIFileRoute('/api/initial-payload')({
  GET: async () => {
    if (!registered) {
      registerReactCra()
      registerSolid()
      registered = true
    }

    const projectPath = process.env.CTA_PROJECT_PATH!

    const localFiles = await cleanUpFiles(
      await recursivelyGatherFiles(projectPath),
    )

    const framework = await getFrameworkById('react-cra')

    const codeRouter = getAllAddOns(framework!, 'code-router').map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      description: addOn.description,
      type: addOn.type,
    }))

    const fileRouter = getAllAddOns(framework!, 'file-router').map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      description: addOn.description,
      type: addOn.type,
    }))

    const applicationMode = process.env.CTA_MODE as 'add' | 'add-on' | 'setup'

    let options: Options | undefined

    if (applicationMode === 'setup') {
      const serializedOptions = JSON.parse(process.env.CTA_OPTIONS!)
      options = {
        ...serializedOptions,
        framework,
        chosenAddOns: await finalizeAddOns(
          framework!,
          serializedOptions.mode,
          serializedOptions.chosenAddOns,
        ),
        projectName: serializedOptions.projectName || basename(projectPath),
        mode: serializedOptions.mode || 'file-router',
        typescript: serializedOptions.typescript || true,
        tailwind: serializedOptions.tailwind || true,
        git: serializedOptions.git || true,
      }
    } else {
      const persistedOptions = JSON.parse(
        readFileSync(resolve(projectPath, '.cta.json')),
      )
      options = await createAppOptionsFromPersisted(persistedOptions)
    }

    const { output, environment } = createMemoryEnvironment()
    await createApp(environment, {
      ...options,
      targetDir: projectPath,
    } as Required<Options>)

    output.files = cleanUpFiles(output.files, projectPath)

    const serializedOptions: SerializedOptions = {
      ...options,
      chosenAddOns: options.chosenAddOns.map((addOn) => addOn.id),
      framework: framework!.id,
      starter: options.starter?.id,
    }

    return json({
      applicationMode: process.env.CTA_MODE,
      localFiles,
      addOns: {
        'code-router': codeRouter,
        'file-router': fileRouter,
      },
      options: serializedOptions,
      output,
    })
  },
})
