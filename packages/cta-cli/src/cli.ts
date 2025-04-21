import { resolve } from 'node:path'
import { Command, InvalidArgumentError } from 'commander'
import { intro, log } from '@clack/prompts'
import chalk from 'chalk'

import {
  SUPPORTED_PACKAGE_MANAGERS,
  addToApp,
  compileAddOn,
  compileStarter,
  createApp,
  createSerializedOptions,
  getAllAddOns,
  getFrameworkById,
  getFrameworkByName,
  getFrameworks,
  initAddOn,
  initStarter,
} from '@tanstack/cta-engine'

import { launchUI } from '@tanstack/cta-ui'

import { runMCPServer } from './mcp.js'

import { promptForOptions } from './options.js'
import { normalizeOptions } from './command-line.js'

import { createUIEnvironment } from './ui-environment.js'
import { convertTemplateToMode } from './utils.js'

import type { Mode, Options, PackageManager } from '@tanstack/cta-engine'

import type { CliOptions, TemplateOptions } from './types.js'

async function listAddOns(
  options: CliOptions,
  {
    forcedMode,
    forcedAddOns,
    defaultTemplate,
  }: {
    forcedMode?: Mode
    forcedAddOns: Array<string>
    defaultTemplate?: TemplateOptions
  },
) {
  const addOns = await getAllAddOns(
    getFrameworkById(options.framework || 'react-cra')!,
    forcedMode ||
      convertTemplateToMode(
        options.template || defaultTemplate || 'javascript',
      ),
  )
  for (const addOn of addOns.filter((a) => !forcedAddOns.includes(a.id))) {
    console.log(`${chalk.bold(addOn.id)}: ${addOn.description}`)
  }
}

export function cli({
  name,
  appName,
  forcedMode,
  forcedAddOns = [],
  defaultTemplate = 'javascript',
}: {
  name: string
  appName: string
  forcedMode?: Mode
  forcedAddOns?: Array<string>
  defaultTemplate?: TemplateOptions
}) {
  const environment = createUIEnvironment(appName, false)

  const program = new Command()

  const availableFrameworks = getFrameworks().map((f) => f.name)

  const toolchains = new Set<string>()
  for (const framework of getFrameworks()) {
    for (const addOn of framework.getAddOns()) {
      if (addOn.type === 'toolchain') {
        toolchains.add(addOn.id)
      }
    }
  }

  program.name(name).description(`CLI to create a new ${appName} application`)

  program
    .command('add')
    .argument(
      '[add-on...]',
      'Name of the add-ons (or add-ons separated by spaces or commas)',
    )
    .option('--ui', 'Add with the UI')
    .action(async (addOns: Array<string>) => {
      const parsedAddOns: Array<string> = []
      for (const addOn of addOns) {
        if (addOn.includes(',') || addOn.includes(' ')) {
          parsedAddOns.push(
            ...addOn.split(/[\s,]+/).map((addon) => addon.trim()),
          )
        } else {
          parsedAddOns.push(addOn.trim())
        }
      }
      if (program.opts().ui) {
        launchUI({
          mode: 'add',
          addOns: parsedAddOns,
        })
      } else {
        await addToApp(
          parsedAddOns,
          {
            silent: false,
          },
          environment,
        )
      }
    })

  const addOnCommand = program.command('add-on')
  addOnCommand
    .command('init')
    .description('Initialize an add-on from the current project')
    .action(async () => {
      await initAddOn(environment)
    })
  addOnCommand
    .command('compile')
    .description('Update add-on from the current project')
    .action(async () => {
      await compileAddOn(environment)
    })

  const starterCommand = program.command('starter')
  starterCommand
    .command('init')
    .description('Initialize a project starter from the current project')
    .action(async () => {
      await initStarter(environment)
    })
  starterCommand
    .command('compile')
    .description('Compile the starter JSON file for the current project')
    .action(async () => {
      await compileStarter(environment)
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
    .option<string>(
      '--framework <type>',
      `project framework (${availableFrameworks.join(', ')})`,
      (value) => {
        if (!availableFrameworks.includes(value)) {
          throw new InvalidArgumentError(
            `Invalid framework: ${value}. Only the following are allowed: ${availableFrameworks.join(', ')}`,
          )
        }
        return value
      },
      'react',
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
    .option<string>(
      `--toolchain <${Array.from(toolchains).join('|')}>`,
      `Explicitly tell the CLI to use this toolchain`,
      (value) => {
        if (!toolchains.has(value)) {
          throw new InvalidArgumentError(
            `Invalid toolchain: ${value}. The following are allowed: ${Array.from(
              toolchains,
            ).join(', ')}`,
          )
        }
        return value
      },
    )
    .option('--interactive', 'interactive mode', false)
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
    .option('--ui', 'Add with the UI')

  program.action(async (projectName: string, options: CliOptions) => {
    if (options.listAddOns) {
      await listAddOns(options, {
        forcedMode,
        forcedAddOns,
        defaultTemplate,
      })
    } else if (options.mcp || options.mcpSse) {
      await runMCPServer(!!options.mcpSse, {
        forcedMode,
        forcedAddOns,
        appName,
      })
    } else {
      try {
        const cliOptions = {
          projectName,
          ...options,
        } as CliOptions

        cliOptions.framework = getFrameworkByName(
          options.framework || 'react',
        )!.id

        if (forcedMode) {
          cliOptions.template = forcedMode as TemplateOptions
        }

        let finalOptions: Options | undefined
        if (cliOptions.interactive) {
          cliOptions.addOns = true
        } else {
          finalOptions = await normalizeOptions(
            cliOptions,
            forcedMode,
            forcedAddOns,
          )
        }

        if (options.ui) {
          const defaultOptions: Options = {
            framework: getFrameworkByName(cliOptions.framework || 'react')!,
            mode: 'file-router',
            chosenAddOns: [],
            packageManager: 'pnpm',
            projectName: projectName || 'my-app',
            targetDir: resolve(process.cwd(), projectName || 'my-app'),
            typescript: true,
            tailwind: true,
            git: true,
          }
          launchUI({
            mode: 'setup',
            options: createSerializedOptions(finalOptions || defaultOptions),
          })
          return
        }

        if (finalOptions) {
          intro(`Creating a new ${appName} app in ${projectName}...`)
        } else {
          intro(`Let's configure your ${appName} application`)
          finalOptions = await promptForOptions(cliOptions, {
            forcedMode,
            forcedAddOns,
          })
        }

        if (!finalOptions) {
          throw new Error('No options were provided')
        }

        finalOptions.targetDir =
          options.targetDir || resolve(process.cwd(), finalOptions.projectName)

        await createApp(environment, finalOptions)
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
