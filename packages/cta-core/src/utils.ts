import { readdirSync, statSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { readFileHelper } from './file-helper.js'

export function sortObject(
  obj: Record<string, string>,
): Record<string, string> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = obj[key]
      return acc
    }, {})
}

export function jsSafeName(name: string) {
  return name
    .split(/[^a-zA-Z0-9]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function relativePath(from: string, to: string) {
  const fromSegments = from.replace(/^./, '').split('/')
  const toSegments = to.replace(/^./, '').split('/')

  fromSegments.pop()
  toSegments.pop()

  let commonIndex = 0
  while (
    commonIndex < fromSegments.length &&
    commonIndex < toSegments.length &&
    fromSegments[commonIndex] === toSegments[commonIndex]
  ) {
    commonIndex++
  }

  const upLevels = fromSegments.length - commonIndex
  const downLevels = toSegments.slice(commonIndex)

  if (upLevels === 0 && downLevels.length === 0) {
    return `./${basename(to)}`
  } else if (upLevels === 0 && downLevels.length > 0) {
    return `./${downLevels.join('/')}/${basename(to)}`
  } else {
    const relativePath = [...Array(upLevels).fill('..'), ...downLevels].join(
      '/',
    )
    return `${relativePath}/${basename(to)}`
  }
}

export function isDirectory(path: string): boolean {
  return statSync(path).isDirectory()
}

export function findFilesRecursively(
  path: string,
  files: Record<string, string>,
) {
  const dirFiles = readdirSync(path)
  for (const file of dirFiles) {
    const filePath = resolve(path, file)
    if (isDirectory(filePath)) {
      findFilesRecursively(filePath, files)
    } else {
      files[filePath] = readFileHelper(filePath)
    }
  }
}
