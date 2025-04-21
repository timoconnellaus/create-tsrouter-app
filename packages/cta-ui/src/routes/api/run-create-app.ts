import { resolve } from 'node:path'

import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'
import {
  createApp,
  createMemoryEnvironment,
  finalizeAddOns,
  getFrameworkById,
  loadStarter,
} from '@tanstack/cta-engine'

import type { Starter } from '@tanstack/cta-engine'

import { cleanUpFiles } from '@/lib/file-helpers'

let registered = false

export const APIRoute = createAPIFileRoute('/api/run-create-app')({
  POST: async ({ request }) => {
    const { options: serializedOptions } = await request.json()

    if (!registered) {
      registerReactCra()
      registerSolid()
      registered = true
    }

    let starter: Starter | undefined
    const addOns: Array<string> = [...serializedOptions.chosenAddOns]
    if (serializedOptions.starter) {
      starter = await loadStarter(serializedOptions.starter)
      for (const addOn of starter?.dependsOn ?? []) {
        addOns.push(addOn)
      }
    }

    const framework = getFrameworkById(serializedOptions.framework)
    const options = {
      ...serializedOptions,
      starter,
      framework,
      chosenAddOns: await finalizeAddOns(
        framework,
        serializedOptions.mode,
        addOns,
      ),
    }

    const projectPath = process.env.CTA_PROJECT_PATH!
    const targetDir = resolve(projectPath, options.projectName)

    const { output, environment } = createMemoryEnvironment()
    await createApp(environment, {
      ...options,
      targetDir,
    })

    output.files = cleanUpFiles(output.files, targetDir)

    return json(output)
  },
})
