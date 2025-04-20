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
} from '@tanstack/cta-engine'

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

    const framework = getFrameworkById(serializedOptions.framework!)
    const options = {
      ...serializedOptions,
      framework,
      chosenAddOns: await finalizeAddOns(
        framework,
        serializedOptions.mode,
        serializedOptions.chosenAddOns,
      ),
    }

    const projectPath = process.env.CTA_PROJECT_PATH!

    const { output, environment } = createMemoryEnvironment()
    await createApp(environment, {
      ...options,
      targetDir: resolve(projectPath, options.projectName),
    })

    output.files = cleanUpFiles(output.files, projectPath)

    return json(output)
  },
})
