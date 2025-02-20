import { Command, InvalidArgumentError } from 'commander'
import { intro, log } from '@clack/prompts'

import { createApp } from './create-app.js'
import { normalizeOptions, promptForOptions } from './options.js'
import { SUPPORTED_PACKAGE_MANAGERS } from './package-manager.js'

import type { PackageManager } from './package-manager.js'
import type { CliOptions } from './types.js'

export function cli() {
  const program = new Command()

  program
    .name('create-tsrouter-app')
    .description('CLI to create a new TanStack application')
    .argument('[project-name]', 'name of the project')
    .option('--no-git', 'do not create a git repository')
    .option<'typescript' | 'javascript' | 'file-router'>(
      '--template <type>',
      'project template (typescript, javascript, file-router)',
      (value) => {
        if (
          value !== 'typescript' &&
          value !== 'javascript' &&
          value !== 'file-router'
        ) {
          throw new InvalidArgumentError(
            `Invalid template: ${value}. Only the following are allowed: typescript, javascript, file-router`,
          )
        }
        return value
      },
    )
    .option<PackageManager>(
      `--package-manager <${SUPPORTED_PACKAGE_MANAGERS.join('|')}>`,
      `Explicitly tell the CLI to use this package manager`,
      (value) => {
        if (!SUPPORTED_PACKAGE_MANAGERS.includes(value as PackageManager)) {
          throw new InvalidArgumentError(
            `Invalid package manager: ${value}. Only the following are allowed: ${SUPPORTED_PACKAGE_MANAGERS.join(
              ', ',
            )}`,
          )
        }
        return value as PackageManager
      },
    )
    .option('--tailwind', 'add Tailwind CSS', false)
    .option('--add-ons', 'pick from a list of available add-ons', false)
    .action(async (projectName: string, options: CliOptions) => {
      try {
        const cliOptions = {
          projectName,
          ...options,
        } as CliOptions
        let finalOptions = normalizeOptions(cliOptions)
        if (finalOptions) {
          intro(`Creating a new TanStack app in ${projectName}...`)
        } else {
          intro("Let's configure your TanStack application")
          finalOptions = await promptForOptions(cliOptions)
        }
        await createApp(finalOptions)
      } catch (error) {
        log.error(
          error instanceof Error ? error.message : 'An unknown error occurred',
        )
        process.exit(1)
      }
    })

  program.parse()
}
