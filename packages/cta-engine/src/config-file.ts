import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { CONFIG_FILE } from './constants.js'

import type { Environment, Options } from './types.js'

export type PersistedOptions = Omit<
  Partial<Options>,
  'addOns' | 'chosenAddOns' | 'framework' | 'starter'
> & {
  framework: string
  version: number
  existingAddOns: Array<string>
  starter?: string
}

export async function writeConfigFile(
  environment: Environment,
  targetDir: string,
  options: Options,
) {
  /* eslint-disable unused-imports/no-unused-vars */
  const { chosenAddOns, framework, ...rest } = options
  /* eslint-enable unused-imports/no-unused-vars */
  const persistedOptions: PersistedOptions = {
    ...rest,
    version: 1,
    framework: options.framework.id,
    existingAddOns: options.chosenAddOns.map((addOn) => addOn.id),
    starter: options.starter?.id ?? undefined,
  }

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

    // TODO: Look for old config files and convert them to the new format

    return JSON.parse(config)
  } catch {
    return null
  }
}
