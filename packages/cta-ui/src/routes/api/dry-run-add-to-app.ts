import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import {
  addToApp,
  createMemoryEnvironment,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

import { cleanUpFileArray, cleanUpFiles } from '@/lib/file-helpers'

registerReactCra()
registerSolid()

export const APIRoute = createAPIFileRoute('/api/dry-run-add-to-app')({
  POST: async ({ request }) => {
    const { addOns } = await request.json()

    const projectPath = process.env.CTA_PROJECT_PATH!

    const { environment, output } = createMemoryEnvironment(projectPath)

    // Preload the environment with the existing project files
    const persistedOptions = JSON.parse(
      readFileSync(resolve(projectPath, '.cta.json')),
    )
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

    const newAddons: Array<string> = []
    for (const addOn of addOns) {
      if (!persistedOptions.existingAddOns.includes(addOn)) {
        newAddons.push(addOn)
      }
    }

    // Add the new add-ons
    environment.startRun()

    await addToApp(environment, newAddons, projectPath, {
      forced: true,
    })

    environment.finishRun()

    output.files = cleanUpFiles(output.files, projectPath)
    output.deletedFiles = cleanUpFileArray(output.deletedFiles, projectPath)

    return json(output)
  },
})
