import { describe, expect, it } from 'vitest'

import { createMemoryEnvironment } from '../src/environment.js'

describe('createMemoryEnvironment', () => {
  it('should handle basic file operations', async () => {
    const { environment, output } = createMemoryEnvironment()

    environment.startRun()
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
