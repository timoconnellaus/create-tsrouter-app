import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import {
  AddOnCompiledSchema,
  StarterCompiledSchema,
} from '@tanstack/cta-engine'

import { addToAppWrapper } from './engine-handling/add-to-app-wrapper.js'
import { createAppWrapper } from './engine-handling/create-app-wrapper.js'
import { generateInitialPayload } from './engine-handling/generate-initial-payload.js'
import { setServerEnvironment } from './engine-handling/server-environment.js'

import type { ServerEnvironment } from './engine-handling/server-environment.js'

export function launchUI(
  options: Partial<ServerEnvironment> & {
    port?: number
  },
) {
  const { port: requestedPort, ...rest } = options
  setServerEnvironment(rest)

  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  const launchUI = !process.env.CTA_DISABLE_UI
  if (launchUI) {
    const packagePath = resolve(dirname(fileURLToPath(import.meta.url)), '..')
    app.use(express.static(resolve(packagePath, 'dist')))
  }

  app.post('/api/add-to-app', async (req, res) => {
    await addToAppWrapper(req.body.addOns, {
      response: res,
    })
  })

  app.post('/api/create-app', async (req, res) => {
    await createAppWrapper(req.body.options, {
      response: res,
    })
  })

  app.post('/api/dry-run-add-to-app', async (req, res) => {
    res.send(
      await addToAppWrapper(req.body.addOns, {
        dryRun: true,
      }),
    )
  })

  app.post('/api/dry-run-create-app', async (req, res) => {
    res.send(
      await createAppWrapper(req.body.options, {
        dryRun: true,
      }),
    )
  })

  app.get('/api/initial-payload', async (_req, res) => {
    res.send(await generateInitialPayload())
  })

  app.get('/api/load-remote-add-on', async (req, res) => {
    const { url } = req.query
    if (!url) {
      res.status(400).send('URL is required')
      return
    }
    try {
      const response = await fetch(url as string)
      const data = await response.json()
      const parsed = AddOnCompiledSchema.safeParse(data)
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid add-on data' })
      } else {
        res.json({
          id: url,
          name: parsed.data.name,
          description: parsed.data.description,
          version: parsed.data.version,
          author: parsed.data.author,
          license: parsed.data.license,
          link: parsed.data.link,
          smallLogo: parsed.data.smallLogo,
          logo: parsed.data.logo,
          type: parsed.data.type,
          modes: parsed.data.modes,
        })
      }
    } catch {
      res.status(500).send('Failed to load add-on')
    }
  })

  app.get('/api/load-starter', async (req, res) => {
    const { url } = req.query
    if (!url) {
      res.status(400).send('URL is required')
      return
    }
    try {
      const response = await fetch(url as string)
      const data = await response.json()
      const parsed = StarterCompiledSchema.safeParse(data)
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid starter data' })
      } else {
        res.json({
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
            ? (url as string).replace('starter.json', parsed.data.banner)
            : undefined,
        })
      }
    } catch {
      res.status(500).send('Failed to load starter')
    }
  })

  app.post('/api/shutdown', (_req, res) => {
    setTimeout(() => {
      process.exit(0)
    }, 50)
    res.send({ shutdown: true })
  })

  const port = requestedPort || process.env.PORT || 8080
  app.listen(port, () => {
    console.log(
      `Create TanStack ${launchUI ? 'App' : 'API'} is running on http://localhost:${port}`,
    )
  })
}
