import { beforeEach, describe, expect, it } from 'vitest'

import { normalizeOptions } from '../src/command-line.js'
import {
  __testRegisterFramework,
  __testClearFrameworks,
} from '@tanstack/cta-engine/dist/frameworks.js'

beforeEach(() => {
  __testClearFrameworks()
})

describe('normalizeOptions', () => {
  it('should return undefined if project name is not provided', async () => {
    const options = await normalizeOptions({})
    expect(options).toBeUndefined()
  })

  it('should return enable typescript based on the framework', async () => {
    const jsOptions = await normalizeOptions({
      projectName: 'test',
      template: 'javascript',
    })
    expect(jsOptions?.typescript).toBe(false)
    expect(jsOptions?.mode).toBe('code-router')

    const tsOptions = await normalizeOptions({
      projectName: 'test',
      template: 'typescript',
    })
    expect(tsOptions?.typescript).toBe(true)
    expect(tsOptions?.mode).toBe('code-router')

    const frOptions = await normalizeOptions({
      projectName: 'test',
      template: 'file-router',
    })
    expect(frOptions?.typescript).toBe(true)
    expect(frOptions?.mode).toBe('file-router')
  })

  it('should return enable tailwind if the framework is solid', async () => {
    const solidOptions = await normalizeOptions({
      projectName: 'test',
      framework: 'solid',
    })
    expect(solidOptions?.tailwind).toBe(true)

    const twOptions = await normalizeOptions({
      projectName: 'test',
      tailwind: true,
    })
    expect(twOptions?.tailwind).toBe(true)

    const noOptions = await normalizeOptions({
      projectName: 'test',
    })
    expect(noOptions?.tailwind).toBe(false)
  })

  it('should handle a starter url', async () => {
    __testRegisterFramework({
      id: 'solid',
      name: 'Solid',
    })
    fetch.mockResponseOnce(
      JSON.stringify({
        tailwind: true,
        typescript: false,
        framework: 'solid',
        mode: 'file-router',
      }),
    )

    const options = await normalizeOptions({
      projectName: 'test',
      starter: 'https://github.com/cta-dev/cta-starter-solid',
    })
    expect(options?.mode).toBe('file-router')
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(false)
    expect(options?.framework?.id).toBe('solid')
  })

  it('should default to react-cra if no framework is provided', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
    })
    const options = await normalizeOptions({
      projectName: 'test',
    })
    expect(options?.framework?.id).toBe('react-cra')
  })

  it('should handle forced addons', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'foo',
          name: 'foobar',
          templates: ['file-router'],
        },
      ],
    })
    const options = await normalizeOptions(
      {
        projectName: 'test',
      },
      'file-router',
      ['foo'],
    )
    expect(options?.chosenAddOns.map((a) => a.id).includes('foo')).toBe(true)
  })

  it('should handle additional addons from the CLI', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'foo',
          name: 'foobar',
          templates: ['file-router'],
        },
        {
          id: 'baz',
          name: 'baz',
          templates: ['file-router'],
        },
      ],
    })
    const options = await normalizeOptions(
      {
        projectName: 'test',
        addOns: ['baz'],
      },
      'file-router',
      ['foo'],
    )
    expect(options?.chosenAddOns.map((a) => a.id).includes('foo')).toBe(true)
    expect(options?.chosenAddOns.map((a) => a.id).includes('baz')).toBe(true)
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
  })

  it('should handle toolchain as an addon', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'biome',
          name: 'Biome',
          templates: ['file-router', 'code-router'],
        },
      ],
    })
    const options = await normalizeOptions({
      projectName: 'test',
      toolchain: 'biome',
    })
    expect(options?.chosenAddOns.map((a) => a.id).includes('biome')).toBe(true)
    expect(options?.tailwind).toBe(true)
    expect(options?.typescript).toBe(true)
  })

  it('should handle the funky Windows edge case with CLI parsing', async () => {
    __testRegisterFramework({
      id: 'react-cra',
      name: 'react',
      getAddOns: () => [
        {
          id: 'foo',
          name: 'foobar',
          templates: ['file-router', 'code-router'],
        },
        {
          id: 'baz',
          name: 'baz',
          templates: ['file-router', 'code-router'],
        },
      ],
    })
    const options = await normalizeOptions({
      projectName: 'test',
      addOns: ['baz foo'],
    })
    expect(options?.chosenAddOns.map((a) => a.id).includes('foo')).toBe(true)
    expect(options?.chosenAddOns.map((a) => a.id).includes('baz')).toBe(true)
  })
})
