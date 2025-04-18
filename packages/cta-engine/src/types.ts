import type { CODE_ROUTER, FILE_ROUTER } from './constants.js'
import type { PackageManager } from './package-manager.js'

export type Mode = typeof CODE_ROUTER | typeof FILE_ROUTER

export type FileBundleHandler = {
  getFiles: () => Promise<Array<string>>
  getFileContents: (path: string) => Promise<string>
}

export type Integration = {
  type: 'provider' | 'root-provider' | 'layout' | 'header-user'
  path: string
  jsName: string
}

export type AddOnBase = {
  id: string
  name: string
  description: string

  author?: string
  version?: string
  link?: string
  license?: string

  warning?: string

  type: 'add-on' | 'example' | 'starter' | 'toolchain'

  command?: {
    command: string
    args?: Array<string>
  }
  routes?: Array<{
    url: string
    name: string
    path: string
    jsName: string
  }>
  packageAdditions: {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    scripts?: Record<string, string>
  }
  shadcnComponents?: Array<string>
  dependsOn?: Array<string>
}

export type StarterInfo = AddOnBase & {
  framework: string
  mode: Mode
  typescript: boolean
  tailwind: boolean
}

export type StarterCompiled = StarterInfo & {
  files?: Record<string, string>
  deletedFiles?: Array<string>
}

export type AddOnInfo = AddOnBase & {
  modes: Array<Mode>
  integrations?: Array<Integration>
  phase: 'setup' | 'add-on'

  readme?: string
}

export type AddOnCompiled = AddOnInfo & {
  files?: Record<string, string>
  deletedFiles?: Array<string>
}

export type AddOn = AddOnInfo & FileBundleHandler

export type FrameworkDefinition = {
  id: string
  name: string
  description: string
  version: string

  baseDirectory: string
  addOnsDirectories: Array<string>
  examplesDirectory: string
}

export type Framework = FrameworkDefinition &
  FileBundleHandler & {
    basePackageJSON: Record<string, any>
    optionalPackages: Record<string, any>

    getAddOns: () => Array<AddOn>
  }

export interface Options {
  projectName: string
  targetDir: string

  framework: Framework
  mode: Mode

  typescript: boolean
  tailwind: boolean

  packageManager: PackageManager
  git: boolean

  chosenAddOns: Array<AddOn>
  starter?: AddOn | undefined
}

type ProjectEnvironment = {
  startRun: () => void
  finishRun: () => void
  getErrors: () => Array<string>
}

type FileEnvironment = {
  appendFile: (path: string, contents: string) => Promise<void>
  copyFile: (from: string, to: string) => Promise<void>
  writeFile: (path: string, contents: string) => Promise<void>
  writeFileBase64: (path: string, base64Contents: string) => Promise<void>
  execute: (command: string, args: Array<string>, cwd: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
  exists: (path: string) => boolean
}

type UIEnvironment = {
  appName: string

  intro: (message: string) => void
  outro: (message: string) => void

  info: (title?: string, message?: string) => void
  error: (title?: string, message?: string) => void
  warn: (title?: string, message?: string) => void

  spinner: () => {
    start: (message: string) => void
    stop: (message: string) => void
  }
  confirm: (message: string) => Promise<boolean>
}

export type Environment = ProjectEnvironment & FileEnvironment & UIEnvironment
