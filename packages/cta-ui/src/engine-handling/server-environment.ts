import type { SerializedOptions } from '@tanstack/cta-engine'

export function getProjectPath(): string {
  return process.env.CTA_PROJECT_PATH!
}

export function getApplicationMode(): 'add' | 'setup' {
  return process.env.CTA_MODE as 'add' | 'setup'
}

export function getProjectOptions(): SerializedOptions {
  return JSON.parse(process.env.CTA_OPTIONS!)
}
