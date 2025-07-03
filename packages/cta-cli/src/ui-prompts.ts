import {
  cancel,
  confirm,
  isCancel,
  multiselect,
  select,
  text,
} from '@clack/prompts'

import {
  DEFAULT_PACKAGE_MANAGER,
  SUPPORTED_PACKAGE_MANAGERS,
  getAllAddOns,
} from '@tanstack/cta-engine'

import type { AddOn, PackageManager } from '@tanstack/cta-engine'

import type { Framework } from '@tanstack/cta-engine/dist/types/types.js'

export async function getProjectName(): Promise<string> {
  const value = await text({
    message: 'What would you like to name your project?',
    defaultValue: 'my-app',
    validate(value) {
      if (!value) {
        return 'Please enter a name'
      }
    },
  })

  if (isCancel(value)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return value
}

export async function selectRouterType(): Promise<string> {
  const routerType = await select({
    message: 'Select the router type:',
    options: [
      {
        value: 'file-router',
        label: 'File Router - File-based routing structure',
      },
      {
        value: 'code-router',
        label: 'Code Router - Traditional code-based routing',
      },
    ],
    initialValue: 'file-router',
  })

  if (isCancel(routerType)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return routerType
}

export async function selectTypescript(): Promise<boolean> {
  const typescriptEnable = await confirm({
    message: 'Would you like to use TypeScript?',
    initialValue: true,
  })
  if (isCancel(typescriptEnable)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
  return typescriptEnable
}

export async function selectTailwind(): Promise<boolean> {
  const tailwind = await confirm({
    message: 'Would you like to use Tailwind CSS?',
    initialValue: true,
  })

  if (isCancel(tailwind)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return tailwind
}

export async function selectPackageManager(): Promise<PackageManager> {
  const packageManager = await select({
    message: 'Select package manager:',
    options: SUPPORTED_PACKAGE_MANAGERS.map((pm) => ({
      value: pm,
      label: pm,
    })),
    initialValue: DEFAULT_PACKAGE_MANAGER,
  })
  if (isCancel(packageManager)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
  return packageManager
}

export async function selectAddOns(
  framework: Framework,
  mode: string,
  type: string,
  message: string,
  forcedAddOns: Array<string> = [],
): Promise<Array<string>> {
  const allAddOns = await getAllAddOns(framework, mode)
  const addOns = allAddOns.filter((addOn) => addOn.type === type)
  if (addOns.length === 0) {
    return []
  }

  const value = await multiselect({
    message,
    options: addOns
      .filter((addOn) => !forcedAddOns.includes(addOn.id))
      .map((addOn) => ({
        value: addOn.id,
        label: addOn.name,
        hint: addOn.description,
      })),
    required: false,
  })

  if (isCancel(value)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return value
}

export async function selectGit(): Promise<boolean> {
  const git = await confirm({
    message: 'Would you like to initialize a new git repository?',
    initialValue: true,
  })
  if (isCancel(git)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }
  return git
}

export async function selectToolchain(
  framework: Framework,
  toolchain?: string,
): Promise<string | undefined> {
  const toolchains = new Set<AddOn>()
  for (const addOn of framework.getAddOns()) {
    if (addOn.type === 'toolchain') {
      toolchains.add(addOn)
      if (toolchain && addOn.id === toolchain) {
        return toolchain
      }
    }
  }

  const tc = await select({
    message: 'Select toolchain',
    options: [
      {
        value: undefined,
        label: 'None',
      },
      ...Array.from(toolchains).map((tc) => ({
        value: tc.id,
        label: tc.name,
      })),
    ],
    initialValue: undefined,
  })

  if (isCancel(tc)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  return tc
}

export async function promptForAddOnOptions(
  addOnIds: Array<string>,
  framework: Framework,
): Promise<Record<string, Record<string, any>>> {
  const addOnOptions: Record<string, Record<string, any>> = {}
  
  for (const addOnId of addOnIds) {
    const addOn = framework.getAddOns().find(a => a.id === addOnId)
    if (!addOn || !addOn.options) continue
    
    addOnOptions[addOnId] = {}
    
    for (const [optionName, option] of Object.entries(addOn.options)) {
      if (option && typeof option === 'object' && 'type' in option) {
        if (option.type === 'select') {
          const selectOption = option as { type: 'select'; label: string; description?: string; default: string; options: Array<{ value: string; label: string }> }
          
          const value = await select({
            message: `${addOn.name}: ${selectOption.label}`,
            options: selectOption.options.map(opt => ({
              value: opt.value,
              label: opt.label,
            })),
            initialValue: selectOption.default,
          })
          
          if (isCancel(value)) {
            cancel('Operation cancelled.')
            process.exit(0)
          }
          
          addOnOptions[addOnId][optionName] = value
        }
        // Future option types can be added here
      }
    }
  }
  
  return addOnOptions
}
