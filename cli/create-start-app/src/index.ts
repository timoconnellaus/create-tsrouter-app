#!/usr/bin/env node
import { cli } from '@tanstack/cta-engine'

cli({
  name: 'create-start-app',
  appName: 'TanStack Start',
  forcedMode: 'file-router',
  forcedAddOns: ['start'],
})
