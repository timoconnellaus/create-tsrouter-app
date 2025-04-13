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
  routerDir: string,
  targetDir: string,
  addOns: Array<{
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }>,
) {
  let packageJSON = JSON.parse(
    await environment.readFile(resolve(templateDir, 'package.json'), 'utf8'),
  )
  packageJSON.name = projectName

  const additions = [
    options.typescript ? 'package.ts.json' : undefined,
    options.tailwind ? 'package.tw.json' : undefined,
    options.toolchain === 'biome' ? 'package.biome.json' : undefined,
    options.toolchain === 'eslint+prettier'
      ? 'package.eslintprettier.json'
      : undefined,
  ]
  for (const addition of additions.filter(Boolean)) {
    packageJSON = await appendPackageJSON(
      environment,
      packageJSON,
      templateDir,
      addition!,
    )
  }

  if (options.mode === FILE_ROUTER) {
    packageJSON = await appendPackageJSON(
      environment,
      packageJSON,
      routerDir,
      'package.fr.json',
    )
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
