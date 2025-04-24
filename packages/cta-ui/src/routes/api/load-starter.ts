import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { StarterCompiledSchema } from '@tanstack/cta-engine'

export const APIRoute = createAPIFileRoute('/api/load-starter')({
  GET: async ({ request }) => {
    const incomingUrl = new URL(request.url)
    const url = incomingUrl.searchParams.get('url')

    if (!url) {
      return json({ error: 'url is required' }, { status: 400 })
    }

    try {
      const response = await fetch(url)
      const data = await response.json()

      const parsed = StarterCompiledSchema.safeParse(data)

      if (!parsed.success) {
        return json({ error: 'Invalid starter data' }, { status: 400 })
      }

      return json({
        url,

        id: parsed.data.id,
        name: parsed.data.name,
        description: parsed.data.description,
        version: parsed.data.version,
        author: parsed.data.author,
        license: parsed.data.license,
        dependsOn: parsed.data.dependsOn,

        mode: parsed.data.mode,
        typescript: parsed.data.typescript,
        tailwind: parsed.data.tailwind,
        banner: parsed.data.banner
          ? url.replace('starter.json', parsed.data.banner)
          : undefined,
      })
    } catch {
      return json({ error: 'Failed to load starter' }, { status: 500 })
    }
  },
})
