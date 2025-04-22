import { basename } from 'node:path'

export function cleanUpFiles(
  files: Record<string, string>,
  targetDir?: string,
) {
  return Object.keys(files).reduce<Record<string, string>>((acc, file) => {
    const content = files[file].startsWith('base64::')
      ? '<binary file>'
      : files[file]
    if (basename(file) !== '.cta.json') {
      acc[targetDir ? file.replace(targetDir, '.') : file] = content
    }
    return acc
  }, {})
}

export function cleanUpFileArray(files: Array<string>, targetDir?: string) {
  return files.reduce<Array<string>>((acc, file) => {
    if (basename(file) !== '.cta.json') {
      acc.push(targetDir ? file.replace(targetDir, '.') : file)
    }
    return acc
  }, [])
}
