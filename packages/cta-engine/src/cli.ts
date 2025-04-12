import { Command, InvalidArgumentError } from 'commander'
import { intro, log } from '@clack/prompts'

import { createApp } from './create-app.js'
import { normalizeOptions, promptForOptions } from './options.js'
import { SUPPORTED_PACKAGE_MANAGERS } from './package-manager.js'
import { SUPPORTED_TOOLCHAINS } from './toolchain.js'

import runServer from './mcp.js'
import { listAddOns } from './add-ons.js'
import { DEFAULT_FRAMEWORK, SUPPORTED_FRAMEWORKS } from './constants.js'
import { initAddOn } from './custom-add-on.js'

import { createDefaultEnvironment } from './environment.js'
import { add } from './add.js'

import type { PackageManager } from './package-manager.js'
import type { ToolChain } from './toolchain.js'
import type { CliOptions, Framework, Mode, TemplateOptions } from './types.js'

export function cli({
  name,
  appName,
  forcedMode,
  forcedAddOns,
}: {
  name: string
  appName: string
  forcedMode?: Mode
  forcedAddOns?: Array<string>
}) {
  const program = new Command()

  program.name(name).description(`CLI to create a new ${appName} application`)

  program
    .command('add')
    .argument('add-on', 'Name of the add-on (or add-ons separated by commas)')
    .action(async (addOn: string) => {
      await add(addOn.split(',').map((addon) => addon.trim()))
    })

  program
    .command('update-add-on')
    .description('Create or update an add-on from the current project')
    .action(async () => {
      await initAddOn('add-on')
    })

  program
    .command('update-starter')
    .description('Create or update a project starter from the current project')
    .action(async () => {
      await initAddOn('starter')
    })

  program.argument('[project-name]', 'name of the project')

  if (!forcedMode) {
    program.option<'typescript' | 'javascript' | 'file-router'>(
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
  }
  program
    .option<Framework>(
      '--framework <type>',
      'project framework (solid, react)',
      (value) => {
        if (!SUPPORTED_FRAMEWORKS.includes(value as Framework)) {
          throw new InvalidArgumentError(
            `Invalid framework: ${value}. Only the following are allowed: ${SUPPORTED_FRAMEWORKS.join(
              ', ',
            )}`,
          )
        }
        return value as Framework
      },
      DEFAULT_FRAMEWORK,
    )
    .option(
      '--starter [url]',
      'initialize this project from a starter URL',
      false,
    )
    .option<PackageManager>(
      `--package-manager <${SUPPORTED_PACKAGE_MANAGERS.join('|')}>`,
      `Explicitly tell the CLI to use this package manager`,
      (value) => {
        if (!SUPPORTED_PACKAGE_MANAGERS.includes(value as PackageManager)) {
          throw new InvalidArgumentError(
            `Invalid package manager: ${value}. The following are allowed: ${SUPPORTED_PACKAGE_MANAGERS.join(
              ', ',
            )}`,
          )
        }
        return value as PackageManager
      },
    )
    .option<ToolChain>(
      `--toolchain <${SUPPORTED_TOOLCHAINS.join('|')}>`,
      `Explicitly tell the CLI to use this toolchain`,
      (value) => {
        if (!SUPPORTED_TOOLCHAINS.includes(value as ToolChain)) {
          throw new InvalidArgumentError(
            `Invalid toolchain: ${value}. The following are allowed: ${SUPPORTED_TOOLCHAINS.join(
              ', ',
            )}`,
          )
        }
        return value as ToolChain
      },
    )
    .option('--tailwind', 'add Tailwind CSS', false)
    .option<Array<string> | boolean>(
      '--add-ons [...add-ons]',
      'pick from a list of available add-ons (comma separated list)',
      (value: string) => {
        let addOns: Array<string> | boolean = !!value
        if (typeof value === 'string') {
          addOns = value.split(',').map((addon) => addon.trim())
        }
        return addOns
      },
    )
    .option('--list-add-ons', 'list all available add-ons', false)
    .option('--no-git', 'do not create a git repository')
    .option(
      '--target-dir <path>',
      'the target directory for the application root',
    )
    .option('--mcp', 'run the MCP server', false)
    .option('--mcp-sse', 'run the MCP server in SSE mode', false)

  program.action(async (projectName: string, options: CliOptions) => {
    if (options.listAddOns) {
      await listAddOns(options, {
        forcedMode: forcedMode as TemplateOptions,
        forcedAddOns,
      })
    } else if (options.mcp || options.mcpSse) {
      await runServer(!!options.mcpSse, {
        forcedMode: forcedMode as TemplateOptions,
        forcedAddOns,
        appName,
      })
    } else {
      try {
        const cliOptions = {
          projectName,
          ...options,
        } as CliOptions

        if (forcedMode) {
          cliOptions.template = forcedMode as TemplateOptions
        }

        let finalOptions = await normalizeOptions(
          cliOptions,
          forcedMode,
          forcedAddOns,
        )
        if (finalOptions) {
          intro(`Creating a new ${appName} app in ${projectName}...`)
        } else {
          intro(`Let's configure your ${appName} application`)
          finalOptions = await promptForOptions(cliOptions, {
            forcedMode: forcedMode as TemplateOptions,
            forcedAddOns,
          })
        }
        await createApp(finalOptions, {
          environment: createDefaultEnvironment(),
          cwd: options.targetDir || undefined,
          name,
          appName,
        })
      } catch (error) {
        log.error(
          error instanceof Error ? error.message : 'An unknown error occurred',
        )
        process.exit(1)
      }
    }
  })

  program.parse()
}
