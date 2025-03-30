import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico']

export function readFileHelper(path: string): string {
  if (BINARY_EXTENSIONS.includes(extname(path))) {
    return `base64::${readFileSync(path).toString('base64')}`
  } else {
    return readFileSync(path, 'utf-8').toString()
  }
}

export function getBinaryFile(content: string): string | null {
  if (content.startsWith('base64::')) {
    const binaryContent = Buffer.from(content.replace('base64::', ''), 'base64')
    return binaryContent as unknown as string
  }
  return null
}
