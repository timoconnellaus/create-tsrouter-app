import type { CODE_ROUTER, FILE_ROUTER } from './constants.js'
import type { PackageManager } from './package-manager.js'

export type TemplateOptions = 'typescript' | 'javascript' | 'file-router'

export type Mode = typeof CODE_ROUTER | typeof FILE_ROUTER

export type FileBundleHandler = {
  getFiles: () => Promise<Array<string>>
  getFileContents: (path: string) => Promise<string>
}

export type AddOnDefinition = {
  id: string
  name: string
  description: string
  type: 'add-on' | 'example' | 'starter' | 'toolchain'
  link: string
  templates: Array<string>
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
  command?: {
    command: string
    args?: Array<string>
  }
  readme?: string
  phase: 'setup' | 'add-on'
  shadcnComponents?: Array<string>
  warning?: string
  dependsOn?: Array<string>
  integrations?: Array<{
    type: 'provider' | 'root-provider' | 'layout' | 'header-user'
    path: string
    jsName: string
  }>
  variables?: Array<Variable>

  files?: Record<string, string>
  deletedFiles?: Array<string>
}

export type StarterDefinition = AddOnDefinition & {
  type: 'starter'
  version: string
  author: string
  link: string
  license: string
  mode: Mode
  framework: string
  typescript: boolean
  tailwind: boolean
}

export type AddOn = AddOnDefinition & FileBundleHandler
export type Starter = StarterDefinition & FileBundleHandler

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
  framework: Framework
  projectName: string
  typescript: boolean
  tailwind: boolean
  packageManager: PackageManager
  mode: Mode
  addOns: boolean
  chosenAddOns: Array<AddOn>
  git: boolean
  variableValues: Record<string, string | number | boolean>
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
  execute: (command: string, args: Array<string>, cwd: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
  exists: (path: string) => boolean
}

type UIEnvironment = {
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

type BooleanVariable = {
  name: string
  default: boolean
  description: string
  type: 'boolean'
}

type NumberVariable = {
  name: string
  default: number
  description: string
  type: 'number'
}

type StringVariable = {
  name: string
  default: string
  description: string
  type: 'string'
}

export type Variable = BooleanVariable | NumberVariable | StringVariable
