import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerFramework } from '@tanstack/cta-engine'

export function register() {
  registerFramework({
    id: 'solid',
    name: 'solid',
    description: 'Solid templates for Tanstack Router Applications',
    version: '0.1.0',
    baseDirectory: join(
      dirname(dirname(fileURLToPath(import.meta.url))),
      'project',
    ),
    addOnsDirectories: [
      join(dirname(dirname(fileURLToPath(import.meta.url))), 'add-ons'),
      join(dirname(dirname(fileURLToPath(import.meta.url))), 'toolchains'),
      join(dirname(dirname(fileURLToPath(import.meta.url))), 'examples'),
    ],
    supportedModes: {
      'code-router': {
        displayName: 'Code Router',
        description: 'TanStack Router using code to define the routes',
      },
      'file-router': {
        displayName: 'File Router',
        description: 'TanStack Router using files to define the routes',
      },
    },
  })
}
