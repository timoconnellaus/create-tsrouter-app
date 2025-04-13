import { resolve } from 'node:path'

import { FILE_ROUTER, sortObject } from '@tanstack/cta-core'

import type { Environment, Options } from '@tanstack/cta-core'

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

async function appendPackageJSON(
  environment: Environment,
  packageJSON: Record<string, any>,
  templateDir: string,
  packageJSONFile: string,
) {
  const overlayPackageJSON = JSON.parse(
    await environment.readFile(resolve(templateDir, packageJSONFile), 'utf8'),
  )
  return mergePackageJSON(packageJSON, overlayPackageJSON)
}

export async function createPackageJSON(
  environment: Environment,
  projectName: string,
  options: Options,
  templateDir: string,
  targetDir: string,
  addOns: Array<{
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }>,
) {
  let packageJSON = JSON.parse(
    await environment.readFile(
      resolve(templateDir, 'base', 'package.json'),
      'utf8',
    ),
  )
  packageJSON.name = projectName

  const packages = JSON.parse(
    await environment.readFile(resolve(templateDir, 'packages.json'), 'utf8'),
  )

  const additions: Array<Record<string, any> | undefined> = [
    options.typescript ? packages.typescript : undefined,
    options.tailwind ? packages.tailwindcss : undefined,
    options.toolchain === 'biome' ? packages.biome : undefined,
    options.toolchain === 'eslint+prettier'
      ? packages.eslintprettier
      : undefined,
    options.mode === FILE_ROUTER ? packages['file-router'] : undefined,
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

  await environment.writeFile(
    resolve(targetDir, 'package.json'),
    JSON.stringify(packageJSON, null, 2),
  )
}
