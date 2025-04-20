import { createAPIFileRoute } from '@tanstack/react-start/api'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'
import {
  createApp,
  createDefaultEnvironment,
  finalizeAddOns,
  getFrameworkById,
} from '@tanstack/cta-engine'

let registered = false

export const APIRoute = createAPIFileRoute('/api/create-app')({
  POST: async ({ request }) => {
    const { options: serializedOptions } = await request.json()

    console.log(serializedOptions)

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
