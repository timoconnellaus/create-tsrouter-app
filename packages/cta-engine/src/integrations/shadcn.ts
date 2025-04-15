import { resolve } from 'node:path'
import { packageManagerExecute } from '../package-manager.js'
import type { Environment, Options } from '../types.js'

export async function installShadcnComponents(
  environment: Environment,
  targetDir: string,
  options: Options,
  silent: boolean,
) {
  const s = silent ? null : environment.spinner()

  if (options.chosenAddOns.find((a) => a.id === 'shadcn')) {
    const shadcnComponents = new Set<string>()
    for (const addOn of options.chosenAddOns) {
      if (addOn.shadcnComponents) {
        for (const component of addOn.shadcnComponents) {
          shadcnComponents.add(component)
        }
      }
    }
    if (options.starter) {
      if (options.starter.shadcnComponents) {
        for (const component of options.starter.shadcnComponents) {
          shadcnComponents.add(component)
        }
      }
    }

    if (shadcnComponents.size > 0) {
      s?.start(
        `Installing shadcn components (${Array.from(shadcnComponents).join(', ')})...`,
      )
      await packageManagerExecute(
        environment,
        resolve(targetDir),
        options.packageManager,
        'shadcn@latest',
        ['add', '--silent', '--yes', ...Array.from(shadcnComponents)],
      )
      s?.stop(`Installed additional shadcn components`)
    }
  }
}
