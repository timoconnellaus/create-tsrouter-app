#!/usr/bin/env node
import { cli } from '@tanstack/cta-cli'

import { register as registerReactCra } from '@tanstack/cta-templates-react-cra'
import { register as registerSolid } from '@tanstack/cta-templates-solid'

registerReactCra()
registerSolid()

cli({
  name: 'create-tanstack',
  appName: 'TanStack',
  defaultTemplate: 'file-router',
})
