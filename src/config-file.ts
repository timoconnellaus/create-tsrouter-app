import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { CONFIG_FILE } from './constants.js'

import type { Environment, Options } from './types'

export type PersistedOptions = Exclude<
  Partial<Options>,
  'addOns' | 'chosenAddOns'
> & {
  existingAddOns: Array<string>
}

export async function writeConfigFile(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  const persistedOptions: PersistedOptions = {
    ...options,
    existingAddOns: options.chosenAddOns.map((addOn) => addOn.id),
  }
  delete persistedOptions.addOns
  delete persistedOptions.chosenAddOns

  await environment.writeFile(
    resolve(targetDir, CONFIG_FILE),
    JSON.stringify(persistedOptions, null, 2),
  )
}

export async function readConfigFile(
  targetDir: string,
): Promise<PersistedOptions | null> {
  try {
    const configFile = resolve(targetDir, CONFIG_FILE)
    const config = await readFile(configFile, 'utf8')
    return JSON.parse(config)
  } catch {
    return null
  }
}
