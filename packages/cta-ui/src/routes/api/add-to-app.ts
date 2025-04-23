import { createAPIFileRoute } from '@tanstack/react-start/api'

import { addToAppWrapper } from '@/engine-handling/add-to-app-wrapper'

export const APIRoute = createAPIFileRoute('/api/add-to-app')({
  POST: async ({ request }) => {
    const { addOns } = await request.json()

    const stream = await addToAppWrapper(addOns, {
      stream: true,
    })

    return new Response(stream as ReadableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  },
})
