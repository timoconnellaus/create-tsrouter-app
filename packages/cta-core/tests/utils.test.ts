import { describe, expect, it } from 'vitest'

import { relativePath } from '../src/file-helpers.js'

describe('relativePath', () => {
  it('relative path with the same directory', () => {
    expect(relativePath('src/utils.ts', 'src/index.ts')).toBe('./index.ts')
  })
  it('relative from a subdirectory', () => {
    expect(relativePath('src/something/utils.ts', 'src/index.ts')).toBe(
      '../index.ts',
    )
  })
  it('relative to a subdirectory', () => {
    expect(relativePath('src/utils.ts', 'src/something/index.ts')).toBe(
      './something/index.ts',
    )
  })
  it('same deep directory', () => {
    expect(
      relativePath('src/foo/bar/baz/utils.ts', 'src/foo/bar/baz/index.ts'),
    ).toBe('./index.ts')
  })
  it('up several levels and down several levels', () => {
    expect(relativePath('src/bar/baz/utils.ts', 'src/foo/bar/index.ts')).toBe(
      '../../foo/bar/index.ts',
    )
  })
  it('relative path with a different directory', () => {
    expect(
      relativePath(
        './src/routes/__root.tsx.ejs',
        'src/integrations/tanstack-query/layout.tsx',
      ),
    ).toBe('../integrations/tanstack-query/layout.tsx')
  })
})
