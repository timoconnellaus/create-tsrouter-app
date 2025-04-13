import type {
  PackageManager,
  TemplateOptions,
  ToolChain,
} from '@tanstack/cta-core'

export interface CliOptions {
  template?: TemplateOptions
  framework?: string
  tailwind?: boolean
  packageManager?: PackageManager
  toolchain?: ToolChain
  projectName?: string
  git?: boolean
  addOns?: Array<string> | boolean
  listAddOns?: boolean
  mcp?: boolean
  mcpSse?: boolean
  starter?: string
  targetDir?: string
}
