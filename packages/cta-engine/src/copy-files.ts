import { resolve } from 'node:path'

import type { Environment } from '@tanstack/cta-core'

export function createCopyFiles(environment: Environment, targetDir: string) {
  return async function copyFiles(
    templateDir: string,
    files: Array<string>,
    // optionally copy files from a folder to the root
    toRoot?: boolean,
  ) {
    for (const file of files) {
      let targetFileName = file.replace('.tw', '')
      if (toRoot) {
        const fileNoPath = targetFileName.split('/').pop()
        targetFileName = fileNoPath ? `./${fileNoPath}` : targetFileName
      }
      await environment.copyFile(
        resolve(templateDir, file),
        resolve(targetDir, targetFileName),
      )
    }
  }
}
