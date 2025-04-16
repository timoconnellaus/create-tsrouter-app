import { dirname, join, basename, extname } from 'node:path'

import { formatCommand, Options } from '@tanstack/cta-engine'

const IGNORE_EXTENSIONS = ['.png', '.ico', '.svg']

export function cleanupOutput(
  options: Options,
  output: {
    files: Record<string, string>
    commands: Array<{
      command: string
      args: Array<string>
    }>
  },
) {
  const trimProjectRelativePath = (path: string) =>
    join(dirname(path).replace(options.targetDir, ''), basename(path))

  const filteredFiles = Object.keys(output.files)
    .filter((key) => !IGNORE_EXTENSIONS.includes(extname(key)))
    .reduce(
      (acc, key) => {
        acc[trimProjectRelativePath(key)] = output.files[key]
        return acc
      },
      {} as Record<string, string>,
    )

  const files = Object.keys(filteredFiles)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = filteredFiles[key]
        return acc
      },
      {} as Record<string, string>,
    )

  return {
    files,
    commands: output.commands.map((c) => formatCommand(c)),
  }
}
