import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

import {
  createApp,
  createAppOptionsFromPersisted,
  createMemoryEnvironment,
  getAllAddOns,
  getFrameworkById,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import type { Mode, PersistedOptions } from '@tanstack/cta-engine'

let registered = false

export const register = createServerFn({
  method: 'POST',
}).handler(() => {
  if (!registered) {
    registerReactCra()
    registerSolid()
    registered = true
  }
})

function cleanUpFiles(files: Record<string, string>, targetDir?: string) {
  return Object.keys(files).reduce<Record<string, string>>((acc, file) => {
    let content = files[file]
    if (content.startsWith('base64::')) {
      content = '<binary file>'
    }
    if (basename(file) !== '.cta.json') {
      acc[targetDir ? file.replace(targetDir, '.') : file] = content
    }
    return acc
  }, {})
}

export const getLocalFiles = createServerFn({
  method: 'GET',
}).handler(async () => {
  if (!registered) {
    await register()
  }
  return cleanUpFiles(
    await recursivelyGatherFiles(process.env.CTA_PROJECT_PATH!),
  )
})

export const getAddons = createServerFn({
  method: 'GET',
})
  .validator((data: unknown) => {
    return data as { platform: string; mode: Mode }
  })
  .handler(async ({ data: { platform, mode } }) => {
    if (!registered) {
      await register()
    }
    const framework = await getFrameworkById(platform)
    return getAllAddOns(framework!, mode).map((addOn) => ({
      id: addOn.id,
      name: addOn.name,
      description: addOn.description,
      type: addOn.type,
    }))
  })

export const getAddonInfo = createServerFn({
  method: 'GET',
}).handler(async () => {
  if (!registered) {
    await register()
  }
  const addOnInfo = readFileSync(
    resolve(process.env.CTA_PROJECT_PATH!, 'add-on.json'),
  )
  return JSON.parse(addOnInfo.toString())
})

export const getOriginalOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  if (!registered) {
    await register()
  }
  const addOnInfo = readFileSync(
    resolve(process.env.CTA_PROJECT_PATH!, '.cta.json'),
  )
  return JSON.parse(addOnInfo.toString()) as PersistedOptions
})

export const runCreateApp = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => {
    return data as { options: PersistedOptions }
  })
  .handler(
    async ({
      data: { options: persistedOptions },
    }: {
      data: { options: PersistedOptions }
    }) => {
      if (!registered) {
        await register()
      }

      try {
        const targetDir = process.env.CTA_PROJECT_PATH!
        const { output, environment } = createMemoryEnvironment()
        const options = await createAppOptionsFromPersisted(persistedOptions)
        await createApp(environment, {
          ...options,
          targetDir,
        })

        output.files = Object.keys(output.files).reduce<Record<string, string>>(
          (acc, file) => {
            let content = output.files[file]
            if (content.startsWith('base64::')) {
              content = '<binary file>'
            }
            if (basename(file) !== '.cta.json') {
              acc[file.replace(targetDir, '.')] = content
            }
            return acc
          },
          {},
        )

        return output
      } catch (e) {
        console.error(e)
        return {
          files: {},
          commands: [],
        }
      }
    },
  )
