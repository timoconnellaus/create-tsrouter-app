import { expect, test, beforeAll } from 'vitest'

import {
  createApp,
  finalizeAddOns,
  getFrameworkById,
} from '@tanstack/cta-engine'

import type { AddOn, Options } from '@tanstack/cta-engine'

import { register as registerReactCra } from '../src/index.js'

import { cleanupOutput, createTestEnvironment } from './test-utilities.js'

beforeAll(async () => {
  await registerReactCra()
})

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
    typescript: false,
    variableValues: {},
  } as Options
}

test('code router in javascript on npm', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName)),
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/cr-js-npm.json',
  )
})

test('code router with form add-on on npm', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName, ['form'])),
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/cr-js-form-npm.json',
  )
})

test('code router in typescript on npm', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName)),
    typescript: true,
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/cr-ts-npm.json',
  )
})

test('file router on npm', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName)),
    mode: 'file-router',
    typescript: true,
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/fr-ts-npm.json',
  )
})

test('file router on npm with biome', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName, ['biome'])),
    mode: 'file-router',
    typescript: true,
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/fr-ts-biome-npm.json',
  )
})

test('file router with tailwind on npm', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName)),
    mode: 'file-router',
    typescript: true,
    tailwind: true,
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/fr-ts-tw-npm.json',
  )
})

test('file router with add-on start on npm', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName, ['start'])),
    tailwind: true,
    typescript: true,
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/cr-ts-start-npm.json',
  )
})

test('file router with add-on start on npm', async () => {
  const projectName = 'TEST'
  const { environment, output, trimProjectRelativePath } =
    createTestEnvironment(projectName)
  await createApp(environment, {
    ...(await createReactOptions(projectName, ['start', 'tanstack-query'])),
    tailwind: true,
    typescript: true,
  })
  cleanupOutput(output, trimProjectRelativePath)
  await expect(JSON.stringify(output, null, 2)).toMatchFileSnapshot(
    './snapshots/react-cra/cr-ts-start-tanstack-query-npm.json',
  )
})
