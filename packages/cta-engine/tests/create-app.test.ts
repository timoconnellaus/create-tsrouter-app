import { describe, expect, it } from 'vitest'
import { createApp } from '../src/create-app.js'

import { createMemoryEnvironment } from '../src/environment.js'
import { FILE_ROUTER } from '../src/constants.js'
import { Options } from '../src/types.js'

const simpleOptions = {
  projectName: 'test',
  framework: {
    id: 'test',
    name: 'Test',
    basePackageJSON: {
      scripts: {
        dev: 'react-scripts start',
      },
    },
    optionalPackages: {
      typescript: {
        devDependencies: {
          typescript: '^5.0.0',
        },
      },
      tailwindcss: {
        dependencies: {
          tailwindcss: '^3.0.0',
        },
      },
      'file-router': {
        dependencies: {
          'file-router': '^1.0.0',
        },
      },
    },
    getFiles: () => ['./src/test.txt'],
    getFileContents: () => 'Hello',
  },
  chosenAddOns: [],
  packageManager: 'pnpm',
  typescript: true,
  tailwind: true,
  mode: FILE_ROUTER,
  variableValues: {},
} as unknown as Options

describe('createApp', () => {
  it('should create an app', async () => {
    const { environment, output } = createMemoryEnvironment()
    await createApp(simpleOptions, {
      silent: true,
      environment,
      name: 'Test',
      cwd: '/',
      appName: 'TanStack App',
    })

    expect(output.files['/src/test.txt']).toEqual('Hello')
  })
})
