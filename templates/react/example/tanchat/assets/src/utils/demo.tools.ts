import { experimental_createMCPClient, tool } from 'ai'
import { z } from 'zod'
import guitars from '../data/example-guitars'

// Example of using an MCP server to get tools
// const mcpCient = await experimental_createMCPClient({
//   transport: {
//     type: 'stdio',
//     args: [
//       '--directory',
//       '~/mcp/servers/src/sqlite',
//       'run',
//       'mcp-server-sqlite',
//       '--db-path',
//       '~/sqlite-example/orders.db',
//     ],
//     command: 'uv',
//   },
// })

const getProducts = tool({
  description: 'Get all products from the database',
  parameters: z.object({}),
  execute: async () => {
    return Promise.resolve(guitars)
  },
})

const recommendGuitar = tool({
  description: 'Use this tool to recommend a guitar to the user',
  parameters: z.object({
    id: z.string().describe('The id of the guitar to recommend'),
  }),
})

export default async function getTools() {
  // const mcpTools = await mcpCient.tools()
  return {
    // ...mcpTools,
    getProducts,
    recommendGuitar,
  }
}
