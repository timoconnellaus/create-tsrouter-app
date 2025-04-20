import { json } from '@tanstack/react-start'
import { createAPIFileRoute } from '@tanstack/react-start/api'

import { addToApp, createDefaultEnvironment } from '@tanstack/cta-engine'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

registerReactCra()
registerSolid()

export const APIRoute = createAPIFileRoute('/api/add-add-ons')({
  POST: async ({ request }) => {
    const { addOns } = await request.json()
    console.log(process.env.CTA_PROJECT_PATH)
    process.chdir(process.env.CTA_PROJECT_PATH!)
    console.log(process.cwd())
    const environment = createDefaultEnvironment()
    environment.error = console.error
    environment.warn = console.warn
    environment.info = console.log
    await addToApp(addOns, { silent: true }, environment)
    return json({ message: 'Hello "/api/add-add-ons"!' })
  },
})
