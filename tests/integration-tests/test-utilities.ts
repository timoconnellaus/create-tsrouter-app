import { dirname, join, basename, extname } from 'node:path'

import { createMemoryEnvironment, Environment } from '@tanstack/cta-core'

const IGNORE_EXTENSIONS = ['.png', '.ico', '.svg']

export function createTestEnvironment(projectName: string) {
  const { environment, output } = createMemoryEnvironment()

  const trimProjectRelativePath = (path: string) =>
    join(
      dirname(path).replace(new RegExp(`^.*/${projectName}`), ''),
      basename(path),
    )

  return {
    environment,
    output,
    trimProjectRelativePath,
  }
}

export function cleanupOutput(
  output: {
    files: Record<string, string>
    commands: Array<{
      command: string
      args: Array<string>
    }>
  },
  trimProjectRelativePath: (path: string) => string,
) {
  const filteredFiles = Object.keys(output.files)
    .filter((key) => !IGNORE_EXTENSIONS.includes(extname(key)))
    .reduce(
      (acc, key) => {
        acc[trimProjectRelativePath(key)] = output.files[key]
        return acc
      },
      {} as Record<string, string>,
    )

  const sortedFiles = Object.keys(filteredFiles)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = filteredFiles[key]
        return acc
      },
      {} as Record<string, string>,
    )

  output.files = sortedFiles
}
