#!/usr/bin/env node
import { cli } from '@tanstack/cta-engine'

cli({
  name: 'create-start-app',
  forcedMode: 'file-router',
  forcedAddOns: ['start'],
})
