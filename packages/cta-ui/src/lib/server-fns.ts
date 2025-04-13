import { createServerFn } from '@tanstack/react-start'
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import {
  getAllAddOns,
  createMemoryEnvironment,
  createAppOptionsFromPersisted,
} from '@tanstack/cta-core'

import { createApp } from '@tanstack/cta-engine'

import type { AddOn, Mode, PersistedOptions } from '@tanstack/cta-core'

export const getAddons = createServerFn({
  method: 'GET',
})
  .validator((data: unknown) => {
    return data as { platform: string; mode: Mode }
  })
  .handler(({ data: { platform, mode } }) => {
    return getAllAddOns(platform, mode)
  })

export const getAddonInfo = createServerFn({
  method: 'GET',
}).handler(async () => {
  const addOnInfo = readFileSync(
    resolve(process.env.PROJECT_PATH, 'add-on.json'),
  )
  return JSON.parse(addOnInfo.toString())
})

export const getOriginalOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  const addOnInfo = readFileSync(resolve(process.env.PROJECT_PATH, '.cta.json'))
  return JSON.parse(addOnInfo.toString()) as PersistedOptions
})

export const runCreateApp = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => {
    return data as { withAddOn: boolean; options: PersistedOptions }
  })
  .handler(
    async ({
      data: { withAddOn, options: persistedOptions },
    }: {
      data: { withAddOn: boolean; options: PersistedOptions }
    }) => {
      const { output, environment } = createMemoryEnvironment()
      const options = await createAppOptionsFromPersisted(persistedOptions)
      options.chosenAddOns = withAddOn
        ? [...options.chosenAddOns, (await getAddonInfo()) as AddOn]
        : [...options.chosenAddOns]
      await createApp(
        {
          ...options,
        },
        {
          silent: true,
          environment,
          cwd: process.env.PROJECT_PATH,
        },
      )

      output.files = Object.keys(output.files).reduce<Record<string, string>>(
        (acc, file) => {
          if (basename(file) !== '.cta.json') {
            acc[file] = output.files[file]
          }
          return acc
        },
        {},
      )

      return output
    },
  )
