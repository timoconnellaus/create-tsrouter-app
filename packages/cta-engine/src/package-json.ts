import { FILE_ROUTER } from './constants.js'
import { sortObject } from './utils.js'

import type { Options } from './types.js'

export function mergePackageJSON(
  packageJSON: Record<string, any>,
  overlayPackageJSON?: Record<string, any>,
) {
  return {
    ...packageJSON,
    dependencies: {
      ...packageJSON.dependencies,
      ...(overlayPackageJSON?.dependencies || {}),
    },
    devDependencies: {
      ...packageJSON.devDependencies,
      ...(overlayPackageJSON?.devDependencies || {}),
    },
    scripts: {
      ...packageJSON.scripts,
      ...(overlayPackageJSON?.scripts || {}),
    },
  }
}

export function createPackageJSON(options: Options) {
  let packageJSON = {
    ...JSON.parse(JSON.stringify(options.framework.basePackageJSON)),
    name: options.projectName,
  }

  const additions: Array<Record<string, any> | undefined> = [
    options.typescript
      ? options.framework.optionalPackages.typescript
      : undefined,
    options.tailwind
      ? options.framework.optionalPackages.tailwindcss
      : undefined,
    options.mode === FILE_ROUTER
      ? options.framework.optionalPackages['file-router']
      : undefined,
  ]
  for (const addition of additions.filter(Boolean)) {
    packageJSON = mergePackageJSON(packageJSON, addition)
  }

  for (const addOn of options.chosenAddOns.map(
    (addOn) => addOn.packageAdditions,
  )) {
    packageJSON = mergePackageJSON(packageJSON, addOn)
  }

  if (options.starter) {
    packageJSON = mergePackageJSON(
      packageJSON,
      options.starter.packageAdditions,
    )
  }

  packageJSON.dependencies = sortObject(
    (packageJSON.dependencies ?? {}) as Record<string, string>,
  )
  packageJSON.devDependencies = sortObject(
    (packageJSON.devDependencies ?? {}) as Record<string, string>,
  )

  return packageJSON
}
