import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fs, vol } from 'memfs'

vi.mock('node:fs', () => fs)
vi.mock('node:fs/promises', () => fs.promises)

beforeEach(() => {
  vol.reset()
})

import {
  createMemoryEnvironment,
  createDefaultEnvironment,
} from '../src/environment.js'

describe('createMemoryEnvironment', () => {
  it('should handle basic file operations', async () => {
    const { environment, output } = createMemoryEnvironment()

    environment.startRun()

    await environment.writeFile('/test.txt', 'test')

    environment.deleteFile('/test.txt')
    expect(environment.exists('/test.txt')).toBe(false)

    await environment.writeFile('/test.txt', 'test')

    environment.finishRun()

    expect(output.files['/test.txt']).toEqual('test')
  })

  it('should track command execution', async () => {
    const { environment, output } = createMemoryEnvironment()

    environment.startRun()
    await environment.execute('echo', ['test'], '')
    environment.finishRun()

    expect(output.commands.length).toEqual(1)
    expect(output.commands[0].command).toEqual('echo')
    expect(output.commands[0].args).toEqual(['test'])
  })
})

describe('createDefaultEnvironment', () => {
  it('should create a default environment', async () => {
    const environment = createDefaultEnvironment()
    expect(environment).toBeDefined()
  })

  it('should write to the file system', async () => {
    const environment = createDefaultEnvironment()
    environment.startRun()
    await environment.writeFile('/test.txt', 'test')
    await environment.appendFile('/test.txt', 'test2')
    await environment.copyFile('/test.txt', '/test2.txt')
    environment.finishRun()

    expect(fs.readFileSync('/test.txt', 'utf8')).toEqual('testtest2')
  })

  it('should allow deletes', async () => {
    const environment = createDefaultEnvironment()
    await environment.writeFile('/test.txt', 'test')
    expect(fs.readFileSync('/test.txt', 'utf8')).toEqual('test')
    await environment.deleteFile('/test.txt')
    expect(environment.exists('/test.txt')).toBe(false)
  })

  it('should record errors', async () => {
    const environment = createDefaultEnvironment()
    environment.startRun()
    await environment.execute('command-that-does-not-exist', ['test'], '')
    environment.finishRun()
    expect(environment.getErrors()).toEqual([
      'Command "command-that-does-not-exist test" did not run successfully. Please run this manually in your project.',
    ])
  })

  it('should have UI methods', async () => {
    const environment = createDefaultEnvironment()
    environment.startRun()
    environment.intro('test')
    environment.outro('test')
    environment.info('test')
    environment.error('test')
    environment.warn('test')
    const s = environment.spinner()
    s.start('foo')
    s.stop('bar')
    environment.finishRun()
    expect(await environment.confirm('test')).toEqual(true)
  })
})
