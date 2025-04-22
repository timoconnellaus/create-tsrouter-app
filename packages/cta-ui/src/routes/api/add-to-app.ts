import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { addToApp, createDefaultEnvironment } from '@tanstack/cta-engine'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

registerReactCra()
registerSolid()

export const APIRoute = createAPIFileRoute('/api/add-to-app')({
  POST: async ({ request }) => {
    const { addOns } = await request.json()

    const projectPath = process.env.CTA_PROJECT_PATH!

    const environment = createDefaultEnvironment()
    environment.error = console.error
    environment.warn = console.warn
    environment.info = console.log

    const persistedOptions = JSON.parse(
      readFileSync(resolve(projectPath, '.cta.json')),
    )

    const newAddons: Array<string> = []
    for (const addOn of addOns) {
      if (!persistedOptions.existingAddOns.includes(addOn)) {
        newAddons.push(addOn)
      }
    }

    const stream = new ReadableStream({
      start(controller) {
        environment.startStep = (message) => {
          console.log(message)
          controller.enqueue(new TextEncoder().encode(`${message}\n`))
        }
        environment.finishStep = (message) => {
          console.log(message)
          controller.enqueue(new TextEncoder().encode(`${message}\n`))
        }

        addToApp(environment, newAddons, projectPath, {
          forced: true,
        }).then(() => {
          controller.close()
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  },
})
