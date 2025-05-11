import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  findFilesRecursively,
  isDirectory,
  readFileHelper,
} from './file-helpers.js'

import type { AddOn, Framework, FrameworkDefinition } from './types.js'

const frameworks: Array<Framework> = []

function getAddOns(framework: FrameworkDefinition) {
  const addOns: Array<AddOn> = []

  for (const addOnsBase of framework.addOnsDirectories) {
    for (const dir of readdirSync(addOnsBase).filter((file) =>
      isDirectory(resolve(addOnsBase, file)),
    )) {
      const filePath = resolve(addOnsBase, dir, 'info.json')
      const fileContent = readFileSync(filePath, 'utf-8')
      const info = JSON.parse(fileContent)

      let packageAdditions: Record<string, string> = {}
      if (existsSync(resolve(addOnsBase, dir, 'package.json'))) {
        packageAdditions = JSON.parse(
          readFileSync(resolve(addOnsBase, dir, 'package.json'), 'utf-8'),
        )
      }

      let readme: string | undefined
      if (existsSync(resolve(addOnsBase, dir, 'README.md'))) {
        readme = readFileSync(resolve(addOnsBase, dir, 'README.md'), 'utf-8')
      }

      let smallLogo: string | undefined
      if (existsSync(resolve(addOnsBase, dir, 'small-logo.svg'))) {
        smallLogo = readFileSync(
          resolve(addOnsBase, dir, 'small-logo.svg'),
          'utf-8',
        )
      }

      const absoluteFiles: Record<string, string> = {}
      const assetsDir = resolve(addOnsBase, dir, 'assets')
      if (existsSync(assetsDir)) {
        findFilesRecursively(assetsDir, absoluteFiles)
      }
      const files: Record<string, string> = {}
      for (const file of Object.keys(absoluteFiles)) {
        files[file.replace(assetsDir, '.')] = readFileHelper(file)
      }

      const getFiles = () => {
        return Promise.resolve(Object.keys(files))
      }
      const getFileContents = (path: string) => {
        return Promise.resolve(files[path])
      }

      addOns.push({
        ...info,
        id: dir,
        packageAdditions,
        readme,
        files,
        smallLogo,
        getFiles,
        getFileContents,
        getDeletedFiles: () => Promise.resolve(info.deletedFiles ?? []),
      })
    }
  }

  return addOns
}

export function __testRegisterFramework(framework: Framework) {
  frameworks.push(framework)
}

export function __testClearFrameworks() {
  frameworks.length = 0
}

export function registerFramework(framework: FrameworkDefinition) {
  const baseAssetsDirectory = resolve(framework.baseDirectory, 'base')

  const basePackageJSON = JSON.parse(
    readFileSync(resolve(baseAssetsDirectory, 'package.json'), 'utf8'),
  )
  const optionalPackages = JSON.parse(
    readFileSync(resolve(framework.baseDirectory, 'packages.json'), 'utf8'),
  )

  const addOns = getAddOns(framework)

  const frameworkWithBundler: Framework = {
    ...framework,
    getFiles: () => {
      const files: Record<string, string> = {}
      findFilesRecursively(baseAssetsDirectory, files)
      return Promise.resolve(
        Object.keys(files).map((path) =>
          path.replace(baseAssetsDirectory, '.'),
        ),
      )
    },
    getFileContents: (path: string) => {
      return Promise.resolve(readFileHelper(resolve(baseAssetsDirectory, path)))
    },
    getDeletedFiles: () => {
      return Promise.resolve([])
    },
    basePackageJSON,
    optionalPackages,
    getAddOns: () => addOns,
  }

  frameworks.push(frameworkWithBundler)
}

export function getFrameworkById(id: string) {
  return frameworks.find((framework) => framework.id === id)
}

export function getFrameworkByName(name: string) {
  return frameworks.find((framework) => framework.name === name)
}

export function getFrameworks() {
  return frameworks
}
