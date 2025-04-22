import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'
import { resolve } from 'node:path'

import {
  readConfigFileFromEnvironment,
  writeConfigFileToEnvironment,
} from '../src/config-file.js'
import { CONFIG_FILE } from '../src/constants.js'
import { createMemoryEnvironment } from '../src/environment.js'
import type { AddOn, Environment, Framework, Options } from '../src/types.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()
})

describe('writeConfigFile', () => {
  it('should write the config file', async () => {
    const targetDir = 'test-dir'
    const options = {
      framework: {
        id: 'react-cra',
        getAddOns: () => [],
      } as unknown as Framework,
      chosenAddOns: [
        {
          id: 'add-on-1',
          description: 'Add-on 1',
          modes: ['file-router'],
        } as AddOn,
      ],
      targetDir,
    } as unknown as Options
    const persistedOptions = {
      version: 1,
      framework: options.framework.id,
      existingAddOns: options.chosenAddOns.map((addOn) => addOn.id),
    }
    const env = {
      writeFile: (path, optionsString) => {
        expect(path).toEqual(resolve(targetDir, CONFIG_FILE))
        expect(optionsString).toEqual(JSON.stringify(persistedOptions, null, 2))
      },
    } as Environment
    await writeConfigFileToEnvironment(env, options)
  })
})

describe('readConfigFileFromEnvironment', () => {
  it('should read the config file', async () => {
    const targetDir = 'test-dir'
    const persistedOptions = {
      version: 1,
      framework: 'react-cra',
      existingAddOns: ['add-on-1'],
    }
    const { environment } = createMemoryEnvironment()
    environment.writeFile(
      resolve(targetDir, CONFIG_FILE),
      JSON.stringify(persistedOptions, null, 2),
    )
    const config = await readConfigFileFromEnvironment(environment, targetDir)
    expect(config).toEqual(persistedOptions)
  })
})
