import { createAPIFileRoute } from '@tanstack/react-start/api'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'
import {
  createApp,
  createDefaultEnvironment,
  finalizeAddOns,
  getFrameworkById,
  loadStarter,
} from '@tanstack/cta-engine'

import type { Starter } from '@tanstack/cta-engine'

let registered = false

export const APIRoute = createAPIFileRoute('/api/create-app')({
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

    const stream = new ReadableStream({
      start(controller) {
        const environment = createDefaultEnvironment()

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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  },
})
