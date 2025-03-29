import { readFile } from 'node:fs/promises'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import chalk from 'chalk'
import { getTemplatesRoot } from './templates.js'

import { DEFAULT_FRAMEWORK } from './constants.js'
import type { AddOn, CliOptions, Framework } from './types.js'

function isDirectory(path: string): boolean {
  return statSync(path).isDirectory()
}

function findFilesRecursively(path: string, files: Record<string, string>) {
  const dirFiles = readdirSync(path)
  for (const file of dirFiles) {
    const filePath = resolve(path, file)
    if (isDirectory(filePath)) {
      findFilesRecursively(filePath, files)
    } else {
      files[filePath] = readFileSync(filePath, 'utf-8').toString()
    }
  }
}

export async function getAllAddOns(
  framework: Framework,
  template: string,
): Promise<Array<AddOn>> {
  const addOns: Array<AddOn> = []

  for (const type of ['add-on', 'example']) {
    const addOnsBase = resolve(getTemplatesRoot(), framework, type)

    if (!existsSync(addOnsBase)) {
      continue
    }

    for (const dir of await readdirSync(addOnsBase).filter((file) =>
      isDirectory(resolve(addOnsBase, file)),
    )) {
      const filePath = resolve(addOnsBase, dir, 'info.json')
      const fileContent = await readFile(filePath, 'utf-8')
      const info = JSON.parse(fileContent)

      if (!info.templates.includes(template)) {
        continue
      }

      let packageAdditions: Record<string, string> = {}
      if (existsSync(resolve(addOnsBase, dir, 'package.json'))) {
        packageAdditions = JSON.parse(
          await readFile(resolve(addOnsBase, dir, 'package.json'), 'utf-8'),
        )
      }

      let readme: string | undefined
      if (existsSync(resolve(addOnsBase, dir, 'README.md'))) {
        readme = await readFile(resolve(addOnsBase, dir, 'README.md'), 'utf-8')
      }

      const absoluteFiles: Record<string, string> = {}
      const assetsDir = resolve(addOnsBase, dir, 'assets')
      if (existsSync(assetsDir)) {
        await findFilesRecursively(assetsDir, absoluteFiles)
      }
      const files: Record<string, string> = {}
      for (const file of Object.keys(absoluteFiles)) {
        files[file.replace(assetsDir, '.')] = absoluteFiles[file]
      }

      addOns.push({
        ...info,
        id: dir,
        type,
        packageAdditions,
        readme,
        files,
        deletedFiles: [],
      })
    }
  }

  return addOns
}

// Turn the list of chosen add-on IDs into a final list of add-ons by resolving dependencies
export async function finalizeAddOns(
  framework: Framework,
  template: string,
  chosenAddOnIDs: Array<string>,
): Promise<Array<AddOn>> {
  const finalAddOnIDs = new Set(chosenAddOnIDs)

  const addOns = await getAllAddOns(framework, template)

  for (const addOnID of finalAddOnIDs) {
    let addOn: AddOn | undefined
    const localAddOn = addOns.find((a) => a.id === addOnID)
    if (localAddOn) {
      addOn = loadAddOn(localAddOn)
    } else if (addOnID.startsWith('http')) {
      addOn = await loadRemoteAddOn(addOnID)
      addOns.push(addOn)
    } else {
      throw new Error(`Add-on ${addOnID} not found`)
    }

    for (const dependsOn of addOn.dependsOn || []) {
      const dep = addOns.find((a) => a.id === dependsOn)
      if (!dep) {
        throw new Error(`Dependency ${dependsOn} not found`)
      }
      finalAddOnIDs.add(dep.id)
    }
  }

  const finalAddOns = [...finalAddOnIDs].map(
    (id) => addOns.find((a) => a.id === id)!,
  )
  return finalAddOns
}

export async function listAddOns(options: CliOptions) {
  const mode =
    options.template === 'file-router' ? 'file-router' : 'code-router'
  const addOns = await getAllAddOns(
    options.framework || DEFAULT_FRAMEWORK,
    mode,
  )
  for (const addOn of addOns) {
    console.log(`${chalk.bold(addOn.id)}: ${addOn.description}`)
  }
}

function loadAddOn(addOn: AddOn): AddOn {
  return addOn
}

export async function loadRemoteAddOn(url: string): Promise<AddOn> {
  const response = await fetch(url)
  const fileContent = await response.json()
  fileContent.id = url
  return fileContent
}
