import { describe, expect, it } from 'vitest'

import { formatCommand, jsSafeName, sortObject } from '../src/utils.js'

describe('formatCommand', () => {
  it('should format a command', () => {
    expect(formatCommand({ command: 'echo', args: ['test'] })).toEqual(
      'echo test',
    )
  })
})

describe('jsSafeName', () => {
  it('should convert a string to a safe JS name', () => {
    expect(jsSafeName('test.foo')).toEqual('TestFoo')
  })
})

describe('sortObject', () => {
  it('should sort an object', () => {
    expect(sortObject({ b: 'b', a: 'a' })).toEqual({ a: 'a', b: 'b' })
  })
})
