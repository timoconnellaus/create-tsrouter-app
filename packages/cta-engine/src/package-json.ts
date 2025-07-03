import { render } from 'ejs'
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
    options.mode ? options.framework.optionalPackages[options.mode] : undefined,
  ]
  for (const addition of additions.filter(Boolean)) {
    packageJSON = mergePackageJSON(packageJSON, addition)
  }

  for (const addOn of options.chosenAddOns) {
    let addOnPackageJSON = addOn.packageAdditions
    
    // Process EJS template if present
    if (addOn.packageTemplate) {
      const templateValues = {
        packageManager: options.packageManager,
        projectName: options.projectName,
        typescript: options.typescript,
        tailwind: options.tailwind,
        js: options.typescript ? 'ts' : 'js',
        jsx: options.typescript ? 'tsx' : 'jsx',
        fileRouter: options.mode === 'file-router',
        codeRouter: options.mode === 'code-router',
        addOnEnabled: options.chosenAddOns.reduce<Record<string, boolean>>(
          (acc, addon) => {
            acc[addon.id] = true
            return acc
          },
          {},
        ),
        addOnOption: options.addOnOptions,
        addOns: options.chosenAddOns,
      }
      
      try {
        const renderedTemplate = render(addOn.packageTemplate, templateValues)
        addOnPackageJSON = JSON.parse(renderedTemplate)
      } catch (error) {
        console.error(`Error processing package.json.ejs for add-on ${addOn.id}:`, error)
        // Fall back to packageAdditions if template processing fails
      }
    }
    
    packageJSON = mergePackageJSON(packageJSON, addOnPackageJSON)
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
