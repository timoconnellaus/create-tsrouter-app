import { basename } from 'node:path'

export function cleanUpFiles(
  files: Record<string, string>,
  targetDir?: string,
) {
  return Object.keys(files).reduce<Record<string, string>>((acc, file) => {
    let content = files[file]
    if (content.startsWith('base64::')) {
      content = '<binary file>'
    }
    if (basename(file) !== '.cta.json') {
      acc[targetDir ? file.replace(targetDir, '.') : file] = content
    }
    return acc
  }, {})
}
