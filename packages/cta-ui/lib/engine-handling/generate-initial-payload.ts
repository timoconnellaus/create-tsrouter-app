import { basename, resolve } from 'node:path'

import {
  createSerializedOptionsFromPersisted,
  getAllAddOns,
  getFrameworkById,
  readConfigFile,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import { cleanUpFiles } from './file-helpers.js'
import { createAppWrapper } from './create-app-wrapper.js'
import { registerFrameworks } from './framework-registration.js'
import {
  getApplicationMode,
  getForcedAddOns,
  getForcedRouterMode,
  getProjectOptions,
  getProjectPath,
  getRegistry,
} from './server-environment.js'

import type { SerializedOptions } from '@tanstack/cta-engine'
import type { Registry } from '../types.js'

function absolutizeUrl(originalUrl: string, relativeUrl: string) {
  if (relativeUrl.startsWith('http') || relativeUrl.startsWith('https')) {
    return relativeUrl
  }
  const baseUrl = originalUrl.replace(/registry.json$/, '')
  return `${baseUrl}${relativeUrl.replace(/^\.\//, '')}`
}

export async function generateInitialPayload() {
  registerFrameworks()

  const projectPath = getProjectPath()
  const applicationMode = getApplicationMode()

  const localFiles =
    applicationMode === 'add'
      ? await cleanUpFiles(await recursivelyGatherFiles(projectPath, false))
      : {}

  const forcedRouterMode = getForcedRouterMode()

  async function getSerializedOptions() {
    if (applicationMode === 'setup') {
      const projectOptions = getProjectOptions()
      return {
        ...projectOptions,
        framework: projectOptions.framework || 'react-cra',
        projectName: projectOptions.projectName || basename(projectPath),
        mode: forcedRouterMode || projectOptions.mode,
        typescript: projectOptions.typescript || true,
        tailwind: projectOptions.tailwind || true,
        git: projectOptions.git || true,
        targetDir:
          projectOptions.targetDir ||
          resolve(projectPath, projectOptions.projectName),
      } as SerializedOptions
    } else {
      const persistedOptions = await readConfigFile(projectPath)
      if (!persistedOptions) {
        throw new Error('No config file found')
      }
      return createSerializedOptionsFromPersisted(persistedOptions)
    }
  }

  const registryUrl = getRegistry()
  let registry: Registry | undefined
  if (registryUrl) {
    registry = (await fetch(registryUrl).then((res) => res.json())) as Registry
    for (const addOn of registry['add-ons']) {
      addOn.url = absolutizeUrl(registryUrl, addOn.url)
    }
    for (const starter of registry.starters) {
      starter.url = absolutizeUrl(registryUrl, starter.url)
      if (starter.banner) {
        starter.banner = absolutizeUrl(registryUrl, starter.banner)
      }
    }
  }

  const serializedOptions = await getSerializedOptions()

  const output = await createAppWrapper(serializedOptions, {
    dryRun: true,
  })

  const framework = await getFrameworkById(serializedOptions.framework)

  const codeRouter = getAllAddOns(framework!, 'code-router').map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    description: addOn.description,
    type: addOn.type,
    smallLogo: addOn.smallLogo,
    logo: addOn.logo,
    link: addOn.link,
    dependsOn: addOn.dependsOn,
  }))

  const fileRouter = getAllAddOns(framework!, 'file-router').map((addOn) => ({
    id: addOn.id,
    name: addOn.name,
    description: addOn.description,
    type: addOn.type,
    smallLogo: addOn.smallLogo,
    logo: addOn.logo,
    link: addOn.link,
    dependsOn: addOn.dependsOn,
  }))

  return {
    applicationMode,
    localFiles,
    addOns: {
      'code-router': codeRouter,
      'file-router': fileRouter,
    },
    options: serializedOptions,
    output,
    forcedRouterMode,
    forcedAddOns: getForcedAddOns(),
    registry,
  }
}
