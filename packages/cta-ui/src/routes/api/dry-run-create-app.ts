import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { createAppWrapper } from '@/engine-handling/create-app-wrapper'

export const APIRoute = createAPIFileRoute('/api/dry-run-create-app')({
  POST: async ({ request }) => {
    const { options: serializedOptions } = await request.json()

    return json(
      await createAppWrapper(serializedOptions, {
        dryRun: true,
      }),
    )
  },
})
