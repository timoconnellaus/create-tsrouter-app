import type {
  Framework,
  PackageManager,
  TemplateOptions,
  ToolChain,
} from '@tanstack/cta-engine'

export interface CliOptions {
  template?: TemplateOptions
  framework?: Framework
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
