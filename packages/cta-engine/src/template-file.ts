import { resolve } from 'node:path'
import { render } from 'ejs'
import { format } from 'prettier'

import { CODE_ROUTER, FILE_ROUTER } from '@tanstack/cta-core'

import type { Environment, Options } from '@tanstack/cta-core'

export function createTemplateFile(
  environment: Environment,
  projectName: string,
  options: Options,
  targetDir: string,
) {
  return async function templateFile(
    file: string,
    content: string,
    targetFileName?: string,
    extraTemplateValues?: Record<string, any>,
  ) {
    function getPackageManagerAddScript(
      packageName: string,
      isDev: boolean = false,
    ) {
      let command
      switch (options.packageManager) {
        case 'yarn':
        case 'pnpm':
          command = isDev
            ? `${options.packageManager} add ${packageName} --dev`
            : `${options.packageManager} add ${packageName}`
          break
        default:
          command = isDev
            ? `${options.packageManager} install ${packageName} -D`
            : `${options.packageManager} install ${packageName}`
          break
      }
      return command
    }

    function getPackageManagerRunScript(scriptName: string) {
      let command
      switch (options.packageManager) {
        case 'yarn':
        case 'pnpm':
          command = `${options.packageManager} ${scriptName}`
          break
        case 'deno':
          command = `${options.packageManager} task ${scriptName}`
          break
        default:
          command = `${options.packageManager} run ${scriptName}`
          break
      }
      return command
    }

    const templateValues = {
      packageManager: options.packageManager,
      projectName: projectName,
      typescript: options.typescript,
      tailwind: options.tailwind,
      toolchain: options.toolchain,
      js: options.typescript ? 'ts' : 'js',
      jsx: options.typescript ? 'tsx' : 'jsx',
      fileRouter: options.mode === FILE_ROUTER,
      codeRouter: options.mode === CODE_ROUTER,
      addOnEnabled: options.chosenAddOns.reduce<Record<string, boolean>>(
        (acc, addOn) => {
          acc[addOn.id] = true
          return acc
        },
        {},
      ),
      addOns: options.chosenAddOns,

      ...extraTemplateValues,

      getPackageManagerAddScript,
      getPackageManagerRunScript,
    }

    try {
      content = render(content, templateValues)
    } catch (error) {
      environment.error(`EJS error in file ${file}`, error?.toString())
      process.exit(1)
    }
    const target = targetFileName ?? file.replace('.ejs', '')

    if (target.endsWith('.ts') || target.endsWith('.tsx')) {
      content = await format(content, {
        semi: false,
        singleQuote: true,
        trailingComma: 'all',
        parser: 'typescript',
      })
    }

    await environment.writeFile(resolve(targetDir, target), content)
  }
}
