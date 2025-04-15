import type { PackageManager, TemplateOptions } from '@tanstack/cta-engine'

export interface CliOptions {
  template?: TemplateOptions
  framework?: string
  tailwind?: boolean
  packageManager?: PackageManager
  toolchain?: string
  projectName?: string
  git?: boolean
  addOns?: Array<string> | boolean
  listAddOns?: boolean
  mcp?: boolean
  mcpSse?: boolean
  starter?: string
  targetDir?: string
}
