import { readFile } from 'node:fs/promises'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export type AddOn = {
  id: string
  name: string
  description: string
  link: string
  main?: Array<{
    imports: Array<string>
    initialize: Array<string>
    providers: Array<{
      open: string
      close: string
    }>
  }>
  layout?: {
    imports: Array<string>
    jsx: string
  }
  routes: Array<{
    url: string
    name: string
  }>
  userUi?: {
    import: string
    jsx: string
  }
  directory: string
  packageAdditions: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }
  command?: {
    command: string
    args?: Array<string>
  }
  readme?: string
  phase: 'setup' | 'add-on'
  shadcnComponents?: Array<string>
  warning?: string
}

function isDirectory(path: string): boolean {
  return statSync(path).isDirectory()
}

export async function getAllAddOns(): Promise<Array<AddOn>> {
  const addOnsBase = fileURLToPath(
    new URL('../templates/add-ons', import.meta.url),
  )

  const addOns: Array<AddOn> = []

  for (const dir of await readdirSync(addOnsBase).filter((file) =>
    isDirectory(resolve(addOnsBase, file)),
  )) {
    const filePath = resolve(addOnsBase, dir, 'info.json')
    const fileContent = await readFile(filePath, 'utf-8')

    let packageAdditions: Record<string, string> = {}
    if (existsSync(resolve(addOnsBase, dir, 'package.json'))) {
      packageAdditions = JSON.parse(
        await readFile(resolve(addOnsBase, dir, 'package.json'), 'utf-8'),
      )
    }

    let readme: string | undefined
    if (existsSync(resolve(addOnsBase, dir, 'README.md'))) {
      readme = await readFile(resolve(addOnsBase, dir, 'README.md'), 'utf-8')
    }

    addOns.push({
      id: dir,
      ...JSON.parse(fileContent),
      directory: resolve(addOnsBase, dir),
      packageAdditions,
      readme,
    })
  }
  return addOns
}
