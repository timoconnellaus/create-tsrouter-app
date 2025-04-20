import { createAPIFileRoute } from '@tanstack/react-start/api'

import { addToApp, createDefaultEnvironment } from '@tanstack/cta-engine'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

registerReactCra()
registerSolid()

export const APIRoute = createAPIFileRoute('/api/add-to-app')({
  POST: async ({ request }) => {
    const { addOns } = await request.json()

    process.chdir(process.env.CTA_PROJECT_PATH!)

    const environment = createDefaultEnvironment()
    environment.error = console.error
    environment.warn = console.warn
    environment.info = console.log

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

        addToApp(addOns, { silent: true }, environment).then(() => {
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
