import { createAPIFileRoute } from '@tanstack/react-start/api'

import { createAppWrapper } from '@/engine-handling/create-app-wrapper'

export const APIRoute = createAPIFileRoute('/api/create-app')({
  POST: async ({ request }) => {
    const { options: serializedOptions } = await request.json()

    const stream = await createAppWrapper(serializedOptions, {
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
