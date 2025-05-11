import { basename, resolve } from 'node:path'

import {
  createSerializedOptionsFromPersisted,
  getAllAddOns,
  getFrameworkById,
  getRawRegistry,
  getRegistryAddOns,
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
  getRegistry as getRegistryURL,
} from './server-environment.js'

import type { AddOn, SerializedOptions } from '@tanstack/cta-engine'
import type { AddOnInfo } from '../types.js'

function convertAddOnToAddOnInfo(addOn: AddOn): AddOnInfo {
  return {
    id: addOn.id,
    name: addOn.name,
    description: addOn.description,
    modes: addOn.modes as Array<'code-router' | 'file-router'>,
    type: addOn.type,
    smallLogo: addOn.smallLogo,
    logo: addOn.logo,
    link: addOn.link!,
    dependsOn: addOn.dependsOn,
  }
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

  const rawRegistry = await getRawRegistry(getRegistryURL())
  const registryAddOns = await getRegistryAddOns(getRegistryURL())

  const serializedOptions = await getSerializedOptions()

  const output = await createAppWrapper(serializedOptions, {
    dryRun: true,
  })

  const framework = await getFrameworkById(serializedOptions.framework)

  const codeRouterAddOns = getAllAddOns(framework!, 'code-router').map(
    convertAddOnToAddOnInfo,
  )

  const fileRouterAddOns = getAllAddOns(framework!, 'file-router').map(
    convertAddOnToAddOnInfo,
  )

  for (const addOnInfo of registryAddOns) {
    const addOnFramework = rawRegistry?.['add-ons']?.find(
      (addOn) => addOn.url === addOnInfo.id,
    )
    if (addOnFramework?.framework === serializedOptions.framework) {
      if (addOnInfo.modes.includes('code-router')) {
        codeRouterAddOns.push(convertAddOnToAddOnInfo(addOnInfo))
      }
      if (addOnInfo.modes.includes('file-router')) {
        fileRouterAddOns.push(convertAddOnToAddOnInfo(addOnInfo))
      }
    }
  }

  const serializedRegistry = {
    ['add-ons']: [],
    starters: (rawRegistry?.starters || []).filter(
      (starter) => starter.framework === serializedOptions.framework,
    ),
  }

  return {
    applicationMode,
    localFiles,
    addOns: {
      'code-router': codeRouterAddOns,
      'file-router': fileRouterAddOns,
    },
    options: serializedOptions,
    output,
    forcedRouterMode,
    forcedAddOns: getForcedAddOns(),
    registry: serializedRegistry,
  }
}
