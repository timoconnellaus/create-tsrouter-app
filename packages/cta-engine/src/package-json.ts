import { FILE_ROUTER, sortObject } from '@tanstack/cta-core'

import type { Options } from '@tanstack/cta-core'

function mergePackageJSON(
  packageJSON: Record<string, any>,
  overlayPackageJSON: Record<string, any>,
) {
  return {
    ...packageJSON,
    dependencies: {
      ...packageJSON.dependencies,
      ...overlayPackageJSON.dependencies,
    },
    devDependencies: {
      ...packageJSON.devDependencies,
      ...overlayPackageJSON.devDependencies,
    },
    scripts: {
      ...packageJSON.scripts,
      ...overlayPackageJSON.scripts,
    },
  }
}

export function createPackageJSON(options: Options) {
  const addOns = options.chosenAddOns.map((addOn) => addOn.packageAdditions)

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
    packageJSON = mergePackageJSON(packageJSON, addition!)
  }

  for (const addOn of addOns) {
    packageJSON = mergePackageJSON(packageJSON, addOn)
  }

  packageJSON.dependencies = sortObject(
    packageJSON.dependencies as Record<string, string>,
  )
  packageJSON.devDependencies = sortObject(
    packageJSON.devDependencies as Record<string, string>,
  )

  return packageJSON
}
