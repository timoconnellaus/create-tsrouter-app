import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { generateInitialPayload } from '@/engine-handling/generate-initial-payload'

export const APIRoute = createAPIFileRoute('/api/initial-payload')({
  GET: async () => {
    return json(await generateInitialPayload())
  },
})
