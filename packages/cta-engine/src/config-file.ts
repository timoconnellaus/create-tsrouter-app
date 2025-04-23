import { resolve } from 'node:path'

import { CONFIG_FILE } from './constants.js'

import type { Environment, Options } from './types.js'

export type PersistedOptions = Omit<
  Partial<Options>,
  'addOns' | 'chosenAddOns' | 'framework' | 'starter' | 'targetDir'
> & {
  framework: string
  version: number
  existingAddOns: Array<string>
  starter?: string
}

function createPersistedOptions(options: Options): PersistedOptions {
  /* eslint-disable unused-imports/no-unused-vars */
  const { chosenAddOns, framework, targetDir, ...rest } = options
  /* eslint-enable unused-imports/no-unused-vars */
  return {
    ...rest,
    version: 1,
    framework: options.framework.id,
    existingAddOns: options.chosenAddOns.map((addOn) => addOn.id),
    starter: options.starter?.id ?? undefined,
  }
}

export async function writeConfigFileToEnvironment(
  environment: Environment,
  options: Options,
) {
  await environment.writeFile(
    resolve(options.targetDir, CONFIG_FILE),
    JSON.stringify(createPersistedOptions(options), null, 2),
  )
}

export async function readConfigFileFromEnvironment(
  environment: Environment,
  targetDir: string,
): Promise<PersistedOptions | null> {
  try {
    const configFile = resolve(targetDir, CONFIG_FILE)
    const config = await environment.readFile(configFile)

    // TODO: Look for old config files and convert them to the new format

    return JSON.parse(config)
  } catch {
    return null
  }
}
