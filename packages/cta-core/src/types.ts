import type { CODE_ROUTER, FILE_ROUTER } from './constants.js'
import type { PackageManager } from './package-manager.js'
import type { ToolChain } from './toolchain.js'

export type TemplateOptions = 'typescript' | 'javascript' | 'file-router'

export type Mode = typeof CODE_ROUTER | typeof FILE_ROUTER

export type FrameworkDefinition = {
  id: string
  name: string
  description: string
  version: string

  baseDirectory: string
  addOnsDirectory: string
  examplesDirectory: string
}

export interface Options {
  framework: FrameworkDefinition
  projectName: string
  typescript: boolean
  tailwind: boolean
  packageManager: PackageManager
  toolchain: ToolChain
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

  readFile: (path: string, encoding?: BufferEncoding) => Promise<string>
  exists: (path: string) => boolean
  readdir: (path: string) => Array<string>
  isDirectory: (path: string) => boolean
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

export type AddOn = {
  id: string
  name: string
  description: string
  type: 'add-on' | 'example' | 'starter'
  link: string
  templates: Array<string>
  routes: Array<{
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

export type Starter = AddOn & {
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
