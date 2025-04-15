import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'

import { writeConfigFile } from '../src/config-file.js'
import { CONFIG_FILE } from '../src/constants.js'

import type { AddOn, Environment, Framework, Options } from '../src/types.js'

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
      addOns: [],
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
