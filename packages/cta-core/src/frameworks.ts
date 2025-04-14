import { resolve } from 'node:path'

import { findFilesRecursively } from './utils.js'
import { readFileHelper } from './file-helper.js'

import type { Framework, FrameworkDefinition } from './types.js'

const frameworks: Array<Framework> = []

export function registerFramework(framework: FrameworkDefinition) {
  const baseAssetsDirectory = resolve(framework.baseDirectory, 'base')
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
