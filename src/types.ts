import type { AddOn } from './add-ons.js'
import type { CODE_ROUTER, FILE_ROUTER } from './constants.js'
import type { PackageManager } from './package-manager.js'

export interface Options {
  projectName: string
  typescript: boolean
  tailwind: boolean
  packageManager: PackageManager
  mode: typeof CODE_ROUTER | typeof FILE_ROUTER
  addOns: boolean
  chosenAddOns: Array<AddOn>
  git: boolean
}

export interface CliOptions {
  template?: 'typescript' | 'javascript' | 'file-router'
  tailwind?: boolean
  packageManager?: PackageManager
  projectName?: string
  git?: boolean
  addOns?: boolean
}
