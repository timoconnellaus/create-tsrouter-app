import { describe, expect, it } from 'vitest'

import {
  camelCase,
  createPackageAdditions,
} from '../../src/custom-add-ons/shared.js'

describe('camelCase', () => {
  it('should convert a string to camel case', () => {
    expect(camelCase('test-case')).toBe('TestCase')
    expect(camelCase('demo.test-case')).toBe('DemoTestCase')
    expect(camelCase('demo/test-case')).toBe('DemoTestCase')
    expect(camelCase('demo/test/case')).toBe('DemoTestCase')
  })
})

describe('createPackageAdditions', () => {
  it('should handles scripts', () => {
    const packageAdditions = createPackageAdditions(
      {
        scripts: {
          dev: 'vinxi dev',
        },
      },
      {
        scripts: {
          dev: 'vinxi dev',
          foo: 'bar',
        },
      },
    )
    expect(packageAdditions).toEqual({
      scripts: {
        foo: 'bar',
      },
    })
  })

  it('should handles dependencies', () => {
    const packageAdditions = createPackageAdditions(
      {
        dependencies: {
          react: '^18.0.0',
        },
        devDependencies: {
          'foo-dev-dependency': '^18.0.0',
          'updated-dev-dependency': '^18.0.0',
        },
      },
      {
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^20.0.0',
        },
        devDependencies: {
          'foo-dev-dependency': '^18.0.0',
          'bar-dev-dependency': '^18.0.0',
          'updated-dev-dependency': '^20.0.0',
        },
      },
    )
    expect(packageAdditions).toEqual({
      dependencies: {
        'react-dom': '^20.0.0',
      },
      devDependencies: {
        'bar-dev-dependency': '^18.0.0',
        'updated-dev-dependency': '^20.0.0',
      },
    })
  })
})
