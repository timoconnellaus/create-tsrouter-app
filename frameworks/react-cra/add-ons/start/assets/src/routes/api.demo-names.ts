import { createServerFileRoute } from '@tanstack/react-start/server'

export const ServerRoute = createServerFileRoute().methods({
  GET: ({ request }) => {
    return new Response(JSON.stringify(['Alice', 'Bob', 'Charlie']), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
})
