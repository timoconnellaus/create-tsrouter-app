import z from 'zod'

import type { CODE_ROUTER, FILE_ROUTER } from './constants.js'
import type { PackageManager } from './package-manager.js'

export type Mode = typeof CODE_ROUTER | typeof FILE_ROUTER

export const AddOnBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string().optional(),
  version: z.string().optional(),
  link: z.string().optional(),
  license: z.string().optional(),
  warning: z.string().optional(),
  type: z.enum(['add-on', 'example', 'starter', 'toolchain']),
  command: z
    .object({
      command: z.string(),
      args: z.array(z.string()).optional(),
    })
    .optional(),
  routes: z
    .array(
      z.object({
        url: z.string().optional(),
        name: z.string().optional(),
        path: z.string(),
        jsName: z.string(),
      }),
    )
    .optional(),
  packageAdditions: z
    .object({
      dependencies: z.record(z.string(), z.string()).optional(),
      devDependencies: z.record(z.string(), z.string()).optional(),
      scripts: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  shadcnComponents: z.array(z.string()).optional(),
  dependsOn: z.array(z.string()).optional(),
})

export const StarterSchema = AddOnBaseSchema.extend({
  framework: z.string(),
  mode: z.string(),
  typescript: z.boolean(),
  tailwind: z.boolean(),
  banner: z.string().optional(),
})

export const StarterCompiledSchema = StarterSchema.extend({
  files: z.record(z.string(), z.string()),
  deletedFiles: z.array(z.string()),
})

export const IntegrationSchema = z.object({
  type: z.string(),
  path: z.string(),
  jsName: z.string(),
})

export const AddOnInfoSchema = AddOnBaseSchema.extend({
  modes: z.array(z.string()),
  integrations: z.array(IntegrationSchema).optional(),
  phase: z.enum(['setup', 'add-on']),
  readme: z.string().optional(),
})

export const AddOnCompiledSchema = AddOnInfoSchema.extend({
  files: z.record(z.string(), z.string()),
  deletedFiles: z.array(z.string()),
})

export type Integration = z.infer<typeof IntegrationSchema>

export type AddOnBase = z.infer<typeof AddOnBaseSchema>

export type StarterInfo = z.infer<typeof StarterSchema>

export type StarterCompiled = z.infer<typeof StarterCompiledSchema>

export type AddOnInfo = z.infer<typeof AddOnInfoSchema>

export type AddOnCompiled = z.infer<typeof AddOnCompiledSchema>

export type FileBundleHandler = {
  getFiles: () => Promise<Array<string>>
  getFileContents: (path: string) => Promise<string>
  getDeletedFiles: () => Promise<Array<string>>
}

export type AddOn = AddOnInfo & FileBundleHandler

export type Starter = StarterCompiled & FileBundleHandler

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
  starter?: Starter | undefined
}

export type SerializedOptions = Omit<
  Options,
  'chosenAddOns' | 'starter' | 'framework'
> & {
  chosenAddOns: Array<string>
  starter?: string | undefined
  framework?: string | undefined
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

  startStep: (message: string) => void
  finishStep: (message: string) => void

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
