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
  getPackageManager,
} from './package-manager.js'
import { CODE_ROUTER, FILE_ROUTER } from './constants.js'
import { getAllAddOns } from './add-ons.js'

import type { CliOptions, Options } from './types.js'

// If all CLI options are provided, use them directly
export function normalizeOptions(
  cliOptions: CliOptions,
): Required<Options> | undefined {
  if (cliOptions.projectName) {
    const typescript =
      cliOptions.template === 'typescript' ||
      cliOptions.template === 'file-router'

    return {
      projectName: cliOptions.projectName,
      typescript,
      tailwind: !!cliOptions.tailwind,
      packageManager: cliOptions.packageManager || DEFAULT_PACKAGE_MANAGER,
      mode: cliOptions.template === 'file-router' ? FILE_ROUTER : CODE_ROUTER,
      git: !!cliOptions.git,
      addOns: !!cliOptions.addOns,
      chosenAddOns: [],
    }
  }
}

export async function promptForOptions(
  cliOptions: CliOptions,
): Promise<Required<Options>> {
  const options = {} as Required<Options>

  if (!cliOptions.projectName) {
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
    options.projectName = value
  }

  // Router type selection
  if (!cliOptions.template) {
    const routerType = await select({
      message: 'Select the router type:',
      options: [
        {
          value: FILE_ROUTER,
          label: 'File Router - File-based routing structure',
        },
        {
          value: CODE_ROUTER,
          label: 'Code Router - Traditional code-based routing',
        },
      ],
      initialValue: FILE_ROUTER,
    })
    if (isCancel(routerType)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
    options.mode = routerType as typeof CODE_ROUTER | typeof FILE_ROUTER
  } else {
    options.mode = cliOptions.template as
      | typeof CODE_ROUTER
      | typeof FILE_ROUTER
    if (options.mode === FILE_ROUTER) {
      options.typescript = true
    }
  }

  // TypeScript selection (if using Code Router)
  if (!options.typescript) {
    if (options.mode === CODE_ROUTER) {
      const typescriptEnable = await confirm({
        message: 'Would you like to use TypeScript?',
        initialValue: true,
      })
      if (isCancel(typescriptEnable)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      options.typescript = typescriptEnable
    } else {
      options.typescript = true
    }
  }

  // Tailwind selection
  if (cliOptions.tailwind === undefined) {
    const tailwind = await confirm({
      message: 'Would you like to use Tailwind CSS?',
      initialValue: true,
    })
    if (isCancel(tailwind)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
    options.tailwind = tailwind
  } else {
    options.tailwind = cliOptions.tailwind
  }

  // Package manager selection
  if (cliOptions.packageManager === undefined) {
    const detectedPackageManager = getPackageManager()
    if (!detectedPackageManager) {
      const pm = await select({
        message: 'Select package manager:',
        options: SUPPORTED_PACKAGE_MANAGERS.map((pm) => ({
          value: pm,
          label: pm,
        })),
        initialValue: DEFAULT_PACKAGE_MANAGER,
      })
      if (isCancel(pm)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      options.packageManager = pm
    } else {
      options.packageManager = detectedPackageManager
    }
  } else {
    options.packageManager = cliOptions.packageManager
  }

  // Select any add-ons
  if (options.mode === FILE_ROUTER && cliOptions.addOns) {
    const addOns = await getAllAddOns()

    const selectedAddOns = await multiselect({
      message: 'Select add-ons:',
      options: addOns.map((addOn) => ({
        value: addOn.id,
        label: addOn.name,
        hint: addOn.description,
      })),
      required: false,
    })

    if (isCancel(selectedAddOns)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }

    options.chosenAddOns = addOns.filter((addOn) =>
      selectedAddOns.includes(addOn.id),
    )
    options.tailwind = true
  } else {
    options.chosenAddOns = []
  }

  // Git selection
  if (cliOptions.git === undefined) {
    const git = await confirm({
      message: 'Would you like to initialize a new git repository?',
      initialValue: true,
    })
    if (isCancel(git)) {
      cancel('Operation cancelled.')
      process.exit(0)
    }
    options.git = git
  } else {
    options.git = !!cliOptions.git
  }

  return options
}
