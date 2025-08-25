#!/usr/bin/env node
import { cli } from '@tanstack/cta-cli'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

registerReactCra()
registerSolid()

cli({
  name: '@tanstack/create-start',
  appName: 'TanStack Start',
  forcedMode: 'file-router',
  forcedAddOns: ['start'],
  craCompatible: true,
})
