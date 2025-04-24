import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import {
  createSerializedOptionsFromPersisted,
  getAllAddOns,
  getFrameworkById,
  recursivelyGatherFiles,
} from '@tanstack/cta-engine'

import { cleanUpFiles } from './file-helpers.js'
import { createAppWrapper } from './create-app-wrapper.js'
import { registerFrameworks } from './framework-registration.js'
import {
  getApplicationMode,
  getProjectOptions,
  getProjectPath,
} from './server-environment.js'

import type { SerializedOptions } from '@tanstack/cta-engine'

export async function generateInitialPayload() {
  registerFrameworks()

  const projectPath = getProjectPath()
  const applicationMode = getApplicationMode()

  const localFiles =
    applicationMode === 'add'
      ? await cleanUpFiles(await recursivelyGatherFiles(projectPath, false))
      : {}

  function getSerializedOptions() {
    if (applicationMode === 'setup') {
      const projectOptions = getProjectOptions()
      return {
        ...projectOptions,
        framework: projectOptions.framework || 'react-cra',
        projectName: projectOptions.projectName || basename(projectPath),
        mode: projectOptions.mode || 'file-router',
        typescript: projectOptions.typescript || true,
        tailwind: projectOptions.tailwind || true,
        git: projectOptions.git || true,
      } as SerializedOptions
    } else {
      const persistedOptions = JSON.parse(
        readFileSync(resolve(projectPath, '.cta.json')),
      )
      return createSerializedOptionsFromPersisted(persistedOptions)
    }
  }

  const serializedOptions = getSerializedOptions()

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
  }
}
