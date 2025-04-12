#!/usr/bin/env node
import { cli } from '@tanstack/cta-cli'

cli({
  name: 'create-start-app',
  appName: 'TanStack Start',
  forcedMode: 'file-router',
  forcedAddOns: ['start'],
})
