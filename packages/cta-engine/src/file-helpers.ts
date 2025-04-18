import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, resolve } from 'node:path'

const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico']

export function readFileHelper(path: string): string {
  if (isBinaryFile(path)) {
    return `base64::${readFileSync(path).toString('base64')}`
  } else {
    return readFileSync(path, 'utf-8').toString()
  }
}

export function isBinaryFile(path: string): boolean {
  return BINARY_EXTENSIONS.includes(extname(path))
}

export function convertBinaryContentsToBase64(contents: any): string {
  return `base64::${Buffer.from(contents).toString('base64')}`
}

export function isBase64(content: string): boolean {
  return content.startsWith('base64::')
}

export function getBinaryFile(content: string): string | null {
  if (content.startsWith('base64::')) {
    const binaryContent = Buffer.from(content.replace('base64::', ''), 'base64')
    return binaryContent as unknown as string
  }
  return null
}

export function relativePath(from: string, to: string) {
  const cleanedFrom = from.startsWith('./') ? from.slice(2) : from
  const cleanedTo = to.startsWith('./') ? to.slice(2) : to

  const fromSegments = cleanedFrom.split('/')
  const toSegments = cleanedTo.split('/')

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
