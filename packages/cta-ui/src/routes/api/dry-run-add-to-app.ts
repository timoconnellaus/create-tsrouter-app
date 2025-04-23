import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { addToAppWrapper } from '@/engine-handling/add-to-app-wrapper'

export const APIRoute = createAPIFileRoute('/api/dry-run-add-to-app')({
  POST: async ({ request }) => {
    const { addOns } = await request.json()

    return json(
      await addToAppWrapper(addOns, {
        dryRun: true,
      }),
    )
  },
})
