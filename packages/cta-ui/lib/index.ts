import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Mode, SerializedOptions } from '@tanstack/cta-engine'

export function launchUI({
  mode,
  addOns,
  options,
  forcedMode,
  forcedAddOns,
}: {
  mode: 'add' | 'setup'
  addOns?: Array<string>
  options?: SerializedOptions
  forcedMode?: Mode
  forcedAddOns?: Array<string>
}) {
  const projectPath = process.cwd()

  delete process.env.NODE_ENV

  process.env.CTA_ADD_ONS = addOns?.join(',') || ''
  process.env.CTA_PROJECT_PATH = projectPath
  process.env.CTA_OPTIONS = options ? JSON.stringify(options) : ''
  process.env.CTA_MODE = mode
  if (forcedMode) {
    process.env.CTA_FORCED_ROUTER_MODE = forcedMode
  }
  if (forcedAddOns) {
    process.env.CTA_FORCED_ADD_ONS = forcedAddOns.join(',')
  }

  const developerPath = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const configPath = resolve(developerPath, './app.config.js')

  process.chdir(developerPath)

  import(configPath).then(async (config) => {
    const out = await config.default
    await out.dev()
  })
}
