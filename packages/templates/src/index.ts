import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export function getModuleRoot() {
  // Get the parent directory because the compiled code is in the dist folder
  return dirname(dirname(fileURLToPath(import.meta.url)))
}
