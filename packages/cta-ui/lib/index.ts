import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { SerializedOptions } from '@tanstack/cta-engine'

export function launchUI({
  mode,
  addOns,
  options,
}: {
  mode: 'add' | 'setup'
  addOns?: Array<string>
  options?: SerializedOptions
}) {
  const projectPath = process.cwd()

  process.env.CTA_PROJECT_PATH = projectPath
  process.env.CTA_ADD_ONS = addOns?.join(',') || ''
  process.env.CTA_OPTIONS = options ? JSON.stringify(options) : ''
  process.env.CTA_MODE = mode

  const developerPath = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const configPath = resolve(developerPath, './app.config.js')

  process.chdir(developerPath)

  import(configPath).then(async (config) => {
    const out = await config.default
    await out.dev()
  })
}
