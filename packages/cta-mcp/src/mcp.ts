import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import express from 'express'
import { z } from 'zod'

import {
  createApp,
  createDefaultEnvironment,
  finalizeAddOns,
  getFrameworkById,
} from '@tanstack/cta-engine'

import type { TemplateOptions } from '@tanstack/cta-engine'

const tanStackReactAddOns = [
  {
    id: 'clerk',
    description: 'Enable authentication with Clerk',
  },
  {
    id: 'convex',
    description: 'Enable a database using Convex',
  },
  {
    id: 'form',
    description: 'Form handling library',
  },
  {
    id: 'netlify',
    description: 'Enable deployments to Netlify',
  },
  {
    id: 'sentry',
    description: 'Enable Sentry error tracking',
  },
  {
    id: 'shadcn',
    description: 'Enable integration of the Shadcn UI component library',
  },
  {
    id: 'start',
    description:
      'Set this if you want a TanStack Start application that supports server functions or APIs',
  },
  {
    id: 'tanstack-query',
    description: 'Enable TanStack Query for data fetching',
  },
  {
    id: 'store',
    description: 'Enable the TanStack Store state management library',
  },
  {
    id: 'tanchat',
    description: 'Add an AI chatbot example to the application',
  },
]

const tanStackSolidAddOns = [
  {
    id: 'solid-ui',
    description: 'Enable integration of the Solid UI component library',
  },
  {
    id: 'form',
    description: 'Form handling library',
  },
  {
    id: 'sentry',
    description: 'Enable Sentry error tracking',
  },
  {
    id: 'store',
    description: 'Enable the TanStack Store state management library',
  },
  {
    id: 'start',
    description:
      'Set this if you want a TanStack Start application that supports server functions or APIs',
  },
  {
    id: 'tanstack-query',
    description: 'Enable TanStack Query for data fetching',
  },
  {
    id: 'tanchat',
    description: 'Add an AI chatbot example to the application',
  },
]

function createServer({
  appName,
  forcedAddOns = [],
  name,
}: {
  appName?: string
  forcedAddOns?: Array<string>
  name?: string
}) {
  const server = new McpServer({
    name: `${appName} Application Builder`,
    version: '1.0.0',
  })

  server.tool('listTanStackReactAddOns', {}, () => {
    return {
      content: [{ type: 'text', text: JSON.stringify(tanStackReactAddOns) }],
    }
  })

  server.tool(
    'createTanStackReactApplication',
    {
      projectName: z
        .string()
        .describe(
          'The package.json module name of the application (will also be the directory name)',
        ),
      cwd: z.string().describe('The directory to create the application in'),
      addOns: z
        .array(
          z.enum([
            'clerk',
            'convex',
            'form',
            'netlify',
            'sentry',
            'shadcn',
            'start',
            'store',
            'tanstack-query',
            'tanchat',
          ]),
        )
        .describe('The IDs of the add-ons to install'),
      targetDir: z
        .string()
        .describe(
          'The directory to create the application in. Use the absolute path of the directory you want the application to be created in',
        ),
    },
    async ({ projectName, addOns, cwd, targetDir }) => {
      const framework = getFrameworkById('react')!
      try {
        process.chdir(cwd)
        const chosenAddOns = await finalizeAddOns(
          framework,
          'file-router',
          Array.from(
            new Set([...(addOns as unknown as Array<string>), ...forcedAddOns]),
          ),
        )
        await createApp(
          {
            projectName: projectName.replace(/^\//, './'),
            framework,
            typescript: true,
            tailwind: true,
            packageManager: 'pnpm',
            mode: 'file-router',
            addOns: true,
            chosenAddOns,
            git: true,
            variableValues: {},
          },
          {
            silent: true,
            environment: createDefaultEnvironment(),
            name,
            cwd: targetDir,
          },
        )
        return {
          content: [{ type: 'text', text: 'Application created successfully' }],
        }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error creating application: ${error}` },
          ],
        }
      }
    },
  )

  server.tool('listTanStackSolidAddOns', {}, () => {
    return {
      content: [{ type: 'text', text: JSON.stringify(tanStackSolidAddOns) }],
    }
  })

  server.tool(
    'createTanStackSolidApplication',
    {
      projectName: z
        .string()
        .describe(
          'The package.json module name of the application (will also be the directory name)',
        ),
      cwd: z.string().describe('The directory to create the application in'),
      addOns: z
        .array(
          z.enum([
            'solid-ui',
            'form',
            'sentry',
            'store',
            'tanstack-query',
            'tanchat',
          ]),
        )
        .describe('The IDs of the add-ons to install'),
      targetDir: z
        .string()
        .describe(
          'The directory to create the application in. Use the absolute path of the directory you want the application to be created in',
        ),
    },
    async ({ projectName, addOns, cwd, targetDir }) => {
      const framework = getFrameworkById('solid')!
      try {
        process.chdir(cwd)
        const chosenAddOns = await finalizeAddOns(
          framework,
          'file-router',
          Array.from(
            new Set([...(addOns as unknown as Array<string>), ...forcedAddOns]),
          ),
        )
        await createApp(
          {
            projectName: projectName.replace(/^\//, './'),
            framework,
            typescript: true,
            tailwind: true,
            packageManager: 'pnpm',
            mode: 'file-router',
            addOns: true,
            chosenAddOns,
            git: true,
            variableValues: {},
          },
          {
            silent: true,
            environment: createDefaultEnvironment(),
            name,
            cwd: targetDir,
          },
        )
        return {
          content: [{ type: 'text', text: 'Application created successfully' }],
        }
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error creating application: ${error}` },
          ],
        }
      }
    },
  )

  return server
}

export async function runMCPServer(
  sse: boolean,
  {
    forcedAddOns,
    appName,
    name,
  }: {
    forcedMode?: TemplateOptions
    forcedAddOns?: Array<string>
    appName?: string
    name?: string
  },
) {
  let transport: SSEServerTransport | null = null

  const server = createServer({ appName, forcedAddOns, name })
  if (sse) {
    const app = express()

    app.get('/sse', (req, res) => {
      transport = new SSEServerTransport('/messages', res)
      server.connect(transport)
    })

    app.post('/messages', (req, res) => {
      if (transport) {
        transport.handlePostMessage(req, res)
      }
    })

    const port = process.env.PORT || 8080
    app.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}/sse`)
    })
  } else {
    const transport = new StdioServerTransport()
    await server.connect(transport)
  }
}
