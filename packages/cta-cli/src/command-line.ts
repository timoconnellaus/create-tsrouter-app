import { resolve } from 'node:path'

import {
  CODE_ROUTER,
  DEFAULT_PACKAGE_MANAGER,
  FILE_ROUTER,
  finalizeAddOns,
  getFrameworkById,
  getPackageManager,
  loadStarter,
} from '@tanstack/cta-engine'

import type { Mode, Options } from '@tanstack/cta-engine'

import type { CliOptions } from './types.js'

export async function normalizeOptions(
  cliOptions: CliOptions,
  forcedMode?: Mode,
  forcedAddOns?: Array<string>,
): Promise<Options | undefined> {
  const projectName = (cliOptions.projectName ?? '').trim()
  if (!projectName) {
    return undefined
  }

  let typescript =
    cliOptions.template === 'typescript' ||
    cliOptions.template === 'file-router' ||
    cliOptions.framework === 'solid'

  let tailwind = !!cliOptions.tailwind
  if (cliOptions.framework === 'solid') {
    tailwind = true
  }

  let mode: typeof FILE_ROUTER | typeof CODE_ROUTER =
    forcedMode || cliOptions.template === 'file-router'
      ? FILE_ROUTER
      : CODE_ROUTER

  const starter = cliOptions.starter
    ? await loadStarter(cliOptions.starter)
    : undefined

  if (starter) {
    tailwind = starter.tailwind
    typescript = starter.typescript
    cliOptions.framework = starter.framework
    mode = starter.mode as Mode
  }

  const framework = getFrameworkById(cliOptions.framework || 'react-cra')!

  async function selectAddOns() {
    // Edge case for Windows Powershell
    if (Array.isArray(cliOptions.addOns) && cliOptions.addOns.length === 1) {
      const parseSeparatedArgs = cliOptions.addOns[0].split(' ')
      if (parseSeparatedArgs.length > 1) {
        cliOptions.addOns = parseSeparatedArgs
      }
    }

    if (
      Array.isArray(cliOptions.addOns) ||
      starter?.dependsOn ||
      forcedAddOns ||
      cliOptions.toolchain
    ) {
      const selectedAddOns = new Set<string>([
        ...(starter?.dependsOn || []),
        ...(forcedAddOns || []),
      ])
      if (cliOptions.addOns && Array.isArray(cliOptions.addOns)) {
        for (const a of cliOptions.addOns) {
          selectedAddOns.add(a)
        }
      }
      if (cliOptions.toolchain) {
        selectedAddOns.add(cliOptions.toolchain)
      }

      return await finalizeAddOns(framework, mode, Array.from(selectedAddOns))
    }

    return []
  }

  const chosenAddOns = await selectAddOns()

  if (chosenAddOns.length) {
    tailwind = true
    typescript = true
  }

  return {
    projectName: projectName,
    targetDir: resolve(process.cwd(), projectName),
    framework,
    mode,
    typescript,
    tailwind,
    packageManager:
      cliOptions.packageManager ||
      getPackageManager() ||
      DEFAULT_PACKAGE_MANAGER,
    git: !!cliOptions.git,
    chosenAddOns,
    starter: starter,
  }
}
