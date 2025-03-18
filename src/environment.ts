import {
  appendFile,
  copyFile,
  mkdir,
  readFile,
  writeFile,
} from 'node:fs/promises'
import { existsSync, readdir, readdirSync, statSync } from 'node:fs'
import { dirname } from 'node:path'
import { execa } from 'execa'
import { memfs } from 'memfs'

export type Environment = {
  startRun: () => void
  finishRun: () => void
  getErrors: () => Array<string>

  appendFile: (path: string, contents: string) => Promise<void>
  copyFile: (from: string, to: string) => Promise<void>
  writeFile: (path: string, contents: string) => Promise<void>
  execute: (command: string, args: Array<string>, cwd: string) => Promise<void>

  readFile: (path: string, encoding?: BufferEncoding) => Promise<string>
  exists: (path: string) => boolean
  readdir: (path: string) => Array<string>
  isDirectory: (path: string) => boolean
}

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

    readFile: (path: string, encoding?: BufferEncoding) =>
      readFile(path, { encoding: encoding || 'utf8' }),
    exists: (path: string) => existsSync(path),
    readdir: (path) => readdirSync(path),
    isDirectory: (path) => {
      const stat = statSync(path)
      return stat.isDirectory()
    },
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
  }
  environment.readFile = async (path: string, encoding?: BufferEncoding) => {
    if (isTemplatePath(path)) {
      return (await readFile(path, encoding)).toString()
    }
    return fs.readFileSync(path, 'utf8').toString()
  }
  environment.writeFile = async (path: string, contents: string) => {
    fs.mkdirSync(dirname(path), { recursive: true })
    await fs.writeFileSync(path, contents)
  }
  environment.exists = (path: string) => {
    if (isTemplatePath(path)) {
      return existsSync(path)
    }
    return fs.existsSync(path)
  }
  environment.readdir = (path: string) => {
    if (isTemplatePath(path)) {
      return readdirSync(path)
    }
    return fs.readdirSync(path).map((file) => file.toString())
  }
  environment.isDirectory = (path) => {
    if (isTemplatePath(path)) {
      const stat = statSync(path)
      return stat.isDirectory()
    }
    return fs.statSync(path).isDirectory()
  }
  environment.finishRun = () => {
    output.files = vol.toJSON() as Record<string, string>
  }

  return {
    environment,
    output,
  }
}
