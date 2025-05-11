import { CODE_ROUTER, FILE_ROUTER } from '@tanstack/cta-engine'
import type { Mode } from '@tanstack/cta-engine'

import type { TemplateOptions } from './types.js'

export function convertTemplateToMode(template: TemplateOptions): Mode {
  if (template === 'typescript' || template === 'javascript') {
    return CODE_ROUTER
  }
  return FILE_ROUTER
}
