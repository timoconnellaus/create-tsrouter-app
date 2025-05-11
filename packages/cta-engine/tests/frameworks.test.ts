import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'

import {
  getFrameworks,
  getFrameworkById,
  getFrameworkByName,
  registerFramework,
} from '../src/frameworks.js'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()
})

describe('registerFramework', () => {
  it('should register a framework', async () => {
    const addOnPackageJSON = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      version: '1.0.0',
    }
    const basePackageJSON = {
      name: 'Test',
      version: '1.0.0',
    }

    vol.mkdirSync('/test/add-ons/test/assets', { recursive: true })
    vol.writeFileSync(
      '/test/add-ons/test/info.json',
      JSON.stringify({
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
      }),
    )
    vol.writeFileSync(
      '/test/add-ons/test/package.json',
      JSON.stringify({
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
      }),
    )
    vol.writeFileSync(
      '/test/add-ons/test/assets/package.json',
      JSON.stringify(addOnPackageJSON),
    )
    vol.writeFileSync('/test/add-ons/test/README.md', 'foo')
    vol.mkdirSync('/test/project/base/assets', { recursive: true })
    vol.writeFileSync(
      '/test/project/base/package.json',
      JSON.stringify(basePackageJSON),
    )
    vol.writeFileSync(
      '/test/project/packages.json',
      JSON.stringify({
        typescript: {},
      }),
    )

    registerFramework({
      id: 'test',
      name: 'Test',
      addOnsDirectories: ['/test/add-ons'],
      description: 'Test',
      version: '1.0.0',
      baseDirectory: '/test/project',
      examplesDirectory: '/test/examples',
    })

    const f = getFrameworkById('test')!

    const baseFiles = await f.getFiles()
    expect(baseFiles).toEqual(['./package.json'])

    const fileContents = await f.getFileContents('./package.json')
    expect(fileContents).toEqual(JSON.stringify(basePackageJSON))

    const addOns = await f.getAddOns()
    const addOnFiles = await addOns[0].getFiles()
    expect(addOnFiles).toEqual(['./package.json'])

    const addOnFileContents = await addOns[0].getFileContents('./package.json')
    expect(addOnFileContents).toEqual(JSON.stringify(addOnPackageJSON))

    expect(getFrameworkByName('Test')).not.toBeUndefined()
    expect(getFrameworks().length).toEqual(1)
  })
})
