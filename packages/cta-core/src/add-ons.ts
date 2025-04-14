import { readFile } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

import { getBinaryFile } from './file-helper.js'
import { findFilesRecursively, isDirectory } from './utils.js'

import type { AddOn, Environment, FrameworkDefinition } from './types.js'

export async function getAllAddOns(
  framework: FrameworkDefinition,
  template: string,
): Promise<Array<AddOn>> {
  const addOns: Array<AddOn> = []

  for (const type of ['add-on', 'example']) {
    const addOnsBase = framework.addOnsDirectory

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
  framework: FrameworkDefinition,
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

function loadAddOn(addOn: AddOn): AddOn {
  return addOn
}

export async function loadRemoteAddOn(url: string): Promise<AddOn> {
  const response = await fetch(url)
  const fileContent = await response.json()
  fileContent.id = url
  return fileContent
}

export async function copyAddOnFile(
  environment: Environment,
  content: string,
  target: string,
  targetPath: string,
  templateFile: (content: string, targetFileName: string) => Promise<void>,
) {
  let targetFile = basename(target).replace(/^_dot_/, '.')
  let isTemplate = false
  if (targetFile.endsWith('.ejs')) {
    targetFile = targetFile.replace('.ejs', '')
    isTemplate = true
  }
  let isAppend = false
  if (targetFile.endsWith('.append')) {
    targetFile = targetFile.replace('.append', '')
    isAppend = true
  }

  const finalTargetPath = resolve(dirname(targetPath), targetFile)

  const binaryContent = getBinaryFile(content)
  if (binaryContent) {
    await environment.writeFile(
      finalTargetPath,
      binaryContent as unknown as string,
    )
    return
  }

  if (isTemplate) {
    await templateFile(content, finalTargetPath)
  } else {
    if (isAppend) {
      await environment.appendFile(finalTargetPath, content)
    } else {
      await environment.writeFile(finalTargetPath, content)
    }
  }
}
