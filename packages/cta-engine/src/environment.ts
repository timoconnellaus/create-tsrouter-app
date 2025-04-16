import {
  appendFile,
  copyFile,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { execa } from 'execa'
import { memfs } from 'memfs'

import type { Environment } from './types.js'

export function createDefaultEnvironment(): Environment {
  let errors: Array<string> = []
  return {
    startRun: () => {
      errors = []
    },
    finishRun: () => {},
    getErrors: () => errors,

    appendFile: async (path: string, contents: string) => {
      await mkdir(dirname(path), { recursive: true })
      return appendFile(path, contents)
    },
    copyFile: async (from: string, to: string) => {
      await mkdir(dirname(to), { recursive: true })
      return copyFile(from, to)
    },
    writeFile: async (path: string, contents: string) => {
      await mkdir(dirname(path), { recursive: true })
      return writeFile(path, contents)
    },
    execute: async (command: string, args: Array<string>, cwd: string) => {
      try {
        await execa(command, args, {
          cwd,
        })
      } catch {
        errors.push(
          `Command "${command} ${args.join(' ')}" did not run successfully. Please run this manually in your project.`,
        )
      }
    },
    deleteFile: async (path: string) => {
      await unlink(path)
    },

    exists: (path: string) => existsSync(path),

    appName: 'TanStack',
    intro: () => {},
    outro: () => {},
    info: () => {},
    error: () => {},
    warn: () => {},
    confirm: () => Promise.resolve(true),
    spinner: () => ({
      start: () => {},
      stop: () => {},
    }),
  }
}

export function createMemoryEnvironment() {
  const environment = createDefaultEnvironment()

  const output: {
    files: Record<string, string>
    commands: Array<{
      command: string
      args: Array<string>
    }>
  } = {
    files: {},
    commands: [],
  }

  const { fs, vol } = memfs({})

  const cwd = process.cwd()
  const isInCwd = (path: string) => path.startsWith(cwd)
  const isTemplatePath = (path: string) => !isInCwd(path)

  environment.appendFile = async (path: string, contents: string) => {
    fs.mkdirSync(dirname(path), { recursive: true })
    await fs.appendFileSync(path, contents)
  }
  environment.copyFile = async (from: string, to: string) => {
    if (isTemplatePath(from)) {
      const contents = (await readFile(from)).toString()
      fs.mkdirSync(dirname(to), { recursive: true })
      fs.writeFileSync(to, contents)
    } else {
      fs.mkdirSync(dirname(to), { recursive: true })
      fs.copyFileSync(from, to)
    }
  }
  environment.execute = async (command: string, args: Array<string>) => {
    output.commands.push({
      command,
      args,
    })
    return Promise.resolve()
  }
  environment.writeFile = async (path: string, contents: string) => {
    fs.mkdirSync(dirname(path), { recursive: true })
    await fs.writeFileSync(path, contents)
  }
  environment.deleteFile = async (path: string) => {
    await fs.unlinkSync(path)
  }
  environment.exists = (path: string) => {
    if (isTemplatePath(path)) {
      return existsSync(path)
    }
    return fs.existsSync(path)
  }
  environment.finishRun = () => {
    output.files = vol.toJSON() as Record<string, string>
  }

  return {
    environment,
    output,
  }
}
