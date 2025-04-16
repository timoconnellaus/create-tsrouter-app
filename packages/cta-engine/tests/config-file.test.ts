import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'
import { resolve } from 'node:path'

import { readConfigFile, writeConfigFile } from '../src/config-file.js'
import { CONFIG_FILE } from '../src/constants.js'

import type { AddOn, Environment, Framework, Options } from '../src/types.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()
})

describe('writeConfigFile', () => {
  it('should write the config file', async () => {
    const options = {
      framework: {
        id: 'react-cra',
        getAddOns: () => [],
      } as unknown as Framework,
      chosenAddOns: [
        {
          id: 'add-on-1',
          description: 'Add-on 1',
          templates: ['file-router'],
        } as AddOn,
      ],
    } as unknown as Options
    const targetDir = 'test-dir'
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
    await writeConfigFile(env, targetDir, options)
  })
})

describe('readConfigFile', () => {
  it('should read the config file', async () => {
    const persistedOptions = {
      version: 1,
      framework: 'react-cra',
      existingAddOns: ['add-on-1'],
    }
    vol.mkdirSync('/test')
    vol.writeFileSync(
      resolve('/test', CONFIG_FILE),
      JSON.stringify(persistedOptions, null, 2),
    )
    const config = await readConfigFile('/test')
    expect(config).toEqual(persistedOptions)
  })
})
