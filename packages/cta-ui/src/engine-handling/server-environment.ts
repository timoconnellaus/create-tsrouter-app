import type { Mode, SerializedOptions } from '@tanstack/cta-engine'

export function getProjectPath(): string {
  return process.env.CTA_PROJECT_PATH!
}

export function getApplicationMode(): 'add' | 'setup' {
  return process.env.CTA_MODE as 'add' | 'setup'
}

export function getProjectOptions(): SerializedOptions {
  return JSON.parse(process.env.CTA_OPTIONS!)
}

export function getForcedRouterMode(): Mode | undefined {
  if (!process.env.CTA_FORCED_ROUTER_MODE) {
    return undefined
  }
  return process.env.CTA_FORCED_ROUTER_MODE as Mode
}

export function getForcedAddOns(): Array<string> | undefined {
  return (process.env.CTA_FORCED_ADD_ONS?.split(',') || []).filter(
    (addOn: string) => addOn !== '',
  )
}
