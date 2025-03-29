import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export function getTemplatesRoot() {
  // Get the parent directory because the compiled code is in the dist folder
  return join(dirname(dirname(fileURLToPath(import.meta.url))), 'templates')
}
