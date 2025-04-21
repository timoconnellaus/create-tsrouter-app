import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { AddOnCompiledSchema } from '@tanstack/cta-engine'

export const APIRoute = createAPIFileRoute('/api/load-remote-add-on')({
  GET: async ({ request }) => {
    const incomingUrl = new URL(request.url)
    const url = incomingUrl.searchParams.get('url')

    if (!url) {
      return json({ error: 'url is required' }, { status: 400 })
    }

    try {
      const response = await fetch(url)
      const data = await response.json()

      const parsed = AddOnCompiledSchema.safeParse(data)

      if (!parsed.success) {
        return json({ error: 'Invalid add-on data' }, { status: 400 })
      }

      return json({
        id: url,
        name: parsed.data.name,
        description: parsed.data.description,
        version: parsed.data.version,
        author: parsed.data.author,
        license: parsed.data.license,

        type: parsed.data.type,
        modes: parsed.data.modes,
      })
    } catch {
      return json({ error: 'Failed to load add-on' }, { status: 500 })
    }
  },
})
