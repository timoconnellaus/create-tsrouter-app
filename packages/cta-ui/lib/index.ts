import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function launchUI({
  mode,
  addOns,
}: {
  mode: 'add' | 'add-on' | 'starter'
  addOns: Array<string>
}) {
  const projectPath = process.cwd()

  process.env.CTA_PROJECT_PATH = projectPath
  process.env.CTA_ADD_ONS = addOns.join(',')
  process.env.CTA_MODE = mode

  const developerPath = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const configPath = resolve(developerPath, './app.config.js')

  process.chdir(developerPath)

  import(configPath).then(async (config) => {
    const out = await config.default
    await out.dev()
  })
}
