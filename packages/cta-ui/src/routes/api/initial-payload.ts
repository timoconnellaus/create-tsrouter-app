import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

import {
  createApp,
  createAppOptionsFromPersisted,
  createMemoryEnvironment,
  getAllAddOns,
  getFrameworkById,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import { cleanUpFiles } from '@/lib/file-helpers'

import type { SerializedOptions } from '@tanstack/cta-engine'

let registered = false

export const APIRoute = createAPIFileRoute('/api/initial-payload')({
  GET: async ({ request, params }) => {
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

    const persistedOptions = JSON.parse(
      readFileSync(resolve(projectPath, '.cta.json')),
    )

    const { output, environment } = createMemoryEnvironment()
    const appBuildOptions =
      await createAppOptionsFromPersisted(persistedOptions)
    await createApp(environment, {
      ...appBuildOptions,
      targetDir: projectPath,
    })

    output.files = cleanUpFiles(output.files, projectPath)

    const serializedOptions: SerializedOptions = {
      ...appBuildOptions,
      chosenAddOns: appBuildOptions.chosenAddOns.map((addOn) => addOn.id),
      framework: framework!.id,
      starter: appBuildOptions.starter?.id,
    }

    return json({
      localFiles,
      addOns: {
        'code-router': codeRouter,
        'file-router': fileRouter,
      },
      options: serializedOptions,
      ctaJSON: persistedOptions,
      appBuildOptions,
      output,
    })
  },
})
