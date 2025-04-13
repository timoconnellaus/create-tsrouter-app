import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  spinner,
} from '@clack/prompts'
import chalk from 'chalk'

import { createDefaultEnvironment } from '@tanstack/cta-core'

import type { Environment } from '@tanstack/cta-core'

export function createUIEnvironment(): Environment {
  const defaultEnvironment = createDefaultEnvironment()

  return {
    ...defaultEnvironment,
    intro: (message: string) => {
      intro(message)
    },
    outro: (message: string) => {
      outro(message)
    },
    info: (title?: string, message?: string) => {
      console.log('info', title, message)
      log.info(
        `${title ? chalk.red(title) : ''}${message ? chalk.green(message) : ''}`,
      )
    },
    error: (title?: string, message?: string) => {
      console.log('error', title, message)
      log.error(`${title ? `${title}: ` : ''}${message}`)
    },
    warn: (title?: string, message?: string) => {
      console.log('warn', title, message)
      log.warn(`${title ? `${title}: ` : ''}${message}`)
    },
    confirm: async (message: string) => {
      console.log('confirm', message)
      const shouldContinue = await confirm({
        message,
      })
      if (isCancel(shouldContinue)) {
        cancel('Operation cancelled.')
        process.exit(0)
      }
      return shouldContinue
    },
    spinner: () => {
      const s = spinner()
      return {
        start: (message: string) => {
          s.start(message)
        },
        stop: (message: string) => {
          s.stop(message)
        },
      }
    },
  }
}
