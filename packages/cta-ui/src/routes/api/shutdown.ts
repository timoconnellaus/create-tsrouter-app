import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/shutdown')({
  POST: () => {
    setTimeout(() => {
      process.exit(0)
    }, 50)
    return json({ shutdown: true })
  },
})
