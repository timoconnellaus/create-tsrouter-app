import type { Mode } from '@tanstack/cta-engine'

export type StarterInfo = {
  url: string
  id: string
  name: string
  description: string
  version: string
  author: string
  license: string
  mode: Mode
  typescript: boolean
  tailwind: boolean
  banner?: string
  dependsOn?: Array<string>
}

// Files

export type DryRunOutput = {
  files: Record<string, string>
  commands: Array<{
    command: string
    args: Array<string>
  }>
  deletedFiles: Array<string>
}

export type ProjectFiles = {
  originalOutput: {
    files: Record<string, string>
    commands: Array<{
      command: string
      args: Array<string>
    }>
  }
}

export type AddOnInfo = {
  id: string
  name: string
  description: string
  type: 'add-on' | 'example' | 'starter' | 'toolchain'
  modes: Array<'code-router' | 'file-router'>
  smallLogo?: string
  logo?: string
  link: string
  dependsOn?: Array<string>
}

export type FileClass =
  | 'unchanged'
  | 'added'
  | 'modified'
  | 'deleted'
  | 'overwritten'

export type FileTreeItem = TreeDataItem & {
  contents: string
  fullPath: string
  fileClass: FileClass | undefined
  originalFile?: string
  modifiedFile?: string
}
