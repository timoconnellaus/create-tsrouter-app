import { resolve } from 'node:path'

import type { Environment } from '@tanstack/cta-core'

export async function setupGit(environment: Environment, targetDir: string) {
  await environment.execute('git', ['init'], resolve(targetDir))
}
