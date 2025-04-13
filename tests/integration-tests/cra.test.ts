import { describe, expect, test } from 'vitest'

import { createApp } from '@tanstack/cta-engine'
import { finalizeAddOns, getFrameworkById } from '@tanstack/cta-core'

import type { AddOn, Options } from '@tanstack/cta-core'

import { register as registerReactCra } from '@tanstack/cta-templates-react-cra'
import { register as registerSolid } from '@tanstack/cta-templates-solid'

import { cleanupOutput, createTestEnvironment } from './test-utilities.js'

registerReactCra()
registerSolid()

async function createReactOptions(projectName: string, addOns?: Array<string>) {
  const framework = getFrameworkById('react-cra')!

  let chosenAddOns: Array<AddOn> = []
  let mode = 'code-router'
  if (addOns) {
    mode = 'file-router'
    chosenAddOns = await finalizeAddOns(framework, mode, addOns)
  }

  return {
    framework,
    addOns: !!chosenAddOns.length,
    chosenAddOns,
    git: true,
    mode,
    packageManager: 'npm',
    projectName,
    tailwind: false,
    toolchain: 'none',
    typescript: false,
    variableValues: {},
  } as Options
}

async function createSolidOptions(projectName: string, addOns?: Array<string>) {
  const framework = getFrameworkById('solid')!

  let chosenAddOns: Array<AddOn> = []
  let mode = 'code-router'
  if (addOns) {
    mode = 'file-router'
    chosenAddOns = await finalizeAddOns(framework, mode, addOns)
  }

  return {
    framework,
    addOns: !!chosenAddOns.length,
    chosenAddOns,
    git: true,
    mode,
    packageManager: 'npm',
    projectName,
    tailwind: false,
    toolchain: 'none',
    typescript: false,
    variableValues: {},
  } as Options
}

describe('React Templates', () => {
  test('code router in javascript on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createReactOptions(projectName)),
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/cr-js-npm.json',
    )
  })

  test('code router in typescript on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createReactOptions(projectName)),
        typescript: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/cr-ts-npm.json',
    )
  })

  test('file router on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createReactOptions(projectName)),
        mode: 'file-router',
        typescript: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/fr-ts-npm.json',
    )
  })

  test('file router with tailwind on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createReactOptions(projectName)),
        mode: 'file-router',
        typescript: true,
        tailwind: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/fr-ts-tw-npm.json',
    )
  })

  test('file router with add-on start on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createReactOptions(projectName, ['start'])),
        tailwind: true,
        typescript: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/cr-ts-start-npm.json',
    )
  })
})

describe('Solid Templates', () => {
  test('code router in javascript on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createSolidOptions(projectName)),
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/solid-cr-js-npm.json',
    )
  })

  test('code router in typescript on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createSolidOptions(projectName)),
        typescript: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/solid-cr-ts-npm.json',
    )
  })

  test('file router on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createSolidOptions(projectName)),
        mode: 'file-router',
        typescript: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/solid-fr-ts-npm.json',
    )
  })

  test('file router with tailwind on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createSolidOptions(projectName)),
        mode: 'file-router',
        typescript: true,
        tailwind: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/solid-fr-ts-tw-npm.json',
    )
  })

  test('file router with add-on start on npm', async () => {
    const projectName = 'TEST'
    const { environment, output, trimProjectRelativePath } =
      createTestEnvironment(projectName)
    await createApp(
      {
        ...(await createSolidOptions(projectName, ['start'])),
        tailwind: true,
        typescript: true,
      },
      {
        silent: true,
        environment,
      },
    )
    cleanupOutput(output, trimProjectRelativePath)
    await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
      './snapshots/cra/solid-cr-ts-start-npm.json',
    )
  })
})
