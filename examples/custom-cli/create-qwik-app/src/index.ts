#!/usr/bin/env node
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerFramework } from '@tanstack/cta-engine'
import { cli } from '@tanstack/cta-cli'

registerFramework({
  id: 'qwik',
  name: 'qwik',
  description: 'Templates for Qwik',
  version: '0.1.0',
  baseDirectory: join(
    dirname(dirname(fileURLToPath(import.meta.url))),
    'project',
  ),
  addOnsDirectories: [
    join(dirname(dirname(fileURLToPath(import.meta.url))), 'add-ons'),
  ],
  supportedModes: {
    default: {
      displayName: 'Default',
      description: 'Default Qwik template',
      forceTypescript: true,
    },
  },
})

cli({
  name: 'create-qwik-app',
  appName: 'Qwik',
  defaultFramework: 'qwik',
  webBase: join(
    dirname(dirname(fileURLToPath(import.meta.url))),
    'customized-ui/dist',
  ),
})
