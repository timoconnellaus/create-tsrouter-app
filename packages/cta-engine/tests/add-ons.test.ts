import { describe, expect, it } from 'vitest'

import { finalizeAddOns, getAllAddOns } from '../src/add-ons.js'

import type { AddOn, Framework } from '../src/types.js'

describe('getAllAddOns', () => {
  it('filter add-ons', () => {
    const addOns = getAllAddOns(
      {
        id: 'react-cra',
        getAddOns: () => [
          {
            id: 'add-on-1',
            description: 'Add-on 1',
            modes: ['file-router'],
          } as AddOn,
          {
            id: 'add-on-2',
            description: 'Add-on 2',
            modes: ['code-router'],
          } as AddOn,
        ],
      } as Framework,
      'file-router',
    )

    expect(addOns.length).toEqual(1)
    expect(addOns[0].id).toEqual('add-on-1')
  })
})

describe('finalizeAddOns', () => {
  it('should finalize add-ons', async () => {
    const addOns = await finalizeAddOns(
      {
        id: 'react-cra',
        getAddOns: () => [
          {
            id: 'add-on-1',
            description: 'Add-on 1',
            modes: ['file-router'],
            dependsOn: ['add-on-2'],
          } as AddOn,
          {
            id: 'add-on-2',
            description: 'Add-on 2',
            modes: ['file-router'],
          } as AddOn,
          {
            id: 'add-on-3',
            description: 'Add-on 3',
            modes: ['file-router'],
          } as AddOn,
        ],
      } as Framework,
      'file-router',
      ['add-on-1'],
    )

    expect(addOns.length).toEqual(2)
    const addOnIds = addOns.map((a) => a.id)
    expect(addOnIds.includes('add-on-1')).toEqual(true)
    expect(addOnIds.includes('add-on-2')).toEqual(true)
    expect(addOnIds.includes('add-on-3')).toEqual(false)
  })
})
