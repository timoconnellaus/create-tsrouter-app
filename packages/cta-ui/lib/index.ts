import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function launchUI() {
  const projectPath = process.cwd()

  process.env.PROJECT_PATH = projectPath

  const configPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../app.config.js',
  )

  const developerPath = resolve(dirname(fileURLToPath(import.meta.url)), '..')

  process.chdir(developerPath)

  import(configPath).then(async (config) => {
    const out = await config.default
    await out.dev()
  })
}
