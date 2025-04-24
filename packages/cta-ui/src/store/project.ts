import { atom, getDefaultStore } from 'jotai'
import { atomWithQuery } from 'jotai-tanstack-query'

import { getAddOnStatus } from './add-ons'

import type { Mode, SerializedOptions } from '@tanstack/cta-engine'

import type { AddOnInfo, ProjectFiles, StarterInfo } from '@/types.js'

// Options

export const projectOptions = atom<SerializedOptions>({
  framework: 'react-cra',
  mode: 'file-router',
  projectName: 'my-app',
  targetDir: 'my-app',
  typescript: true,
  tailwind: true,
  git: true,
  chosenAddOns: [],
  packageManager: 'pnpm',
})

export const projectStarter = atom<StarterInfo | undefined>(undefined)

// Addons

export const customAddOns = atom<Array<AddOnInfo>>([])

export const availableAddOns = atom<Array<AddOnInfo>>((get) => {
  const mode = get(projectOptions).mode
  const baseAddOns =
    mode === 'code-router' ? get(codeRouterAddOns) : get(fileRouterAddOns)
  return [
    ...baseAddOns,
    ...get(customAddOns).filter((addOn) => addOn.modes.includes(mode)),
  ]
})

export const modeEditable = atom((get) => get(projectStarter) === undefined)

export const typeScriptEditable = atom(
  (get) =>
    get(projectStarter) === undefined &&
    get(projectOptions).mode === 'code-router',
)

export const tailwindEditable = atom((get) => get(projectStarter) === undefined)

export const originalSelectedAddOns = atom<Array<string>>([])

export const userSelectedAddOns = atom<Array<string>>([])

export const addOnState = atom<
  Record<
    string,
    {
      selected: boolean
      enabled: boolean
    }
  >
>((get) => {
  const originalAddOns: Set<string> = new Set()
  for (const addOn of get(projectStarter)?.dependsOn || []) {
    originalAddOns.add(addOn)
  }
  for (const addOn of get(originalSelectedAddOns)) {
    originalAddOns.add(addOn)
  }

  return getAddOnStatus(
    get(availableAddOns),
    get(userSelectedAddOns),
    get(originalSelectedAddOns),
  )
})

export const selectedAddOns = atom<Array<AddOnInfo>>((get) =>
  get(availableAddOns).filter((addOn) => get(addOnState)[addOn.id].selected),
)

export const dryRunAtom = atomWithQuery((get) => ({
  queryKey: [
    'dry-run',
    get(applicationMode),
    JSON.stringify(get(projectOptions)),
    JSON.stringify(get(selectedAddOns).map((addOn) => addOn.id)),
    get(projectStarter)?.url,
  ],
  queryFn: async () => {
    if (get(applicationMode) === 'none') {
      return {
        files: {},
        commands: [],
        deletedFiles: [],
      }
    }

    const addOns = get(selectedAddOns).map((addOn) => addOn.id)
    if (get(applicationMode) === 'setup') {
      const outputReq = await fetch('/api/dry-run-create-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: {
            ...get(projectOptions),
            chosenAddOns: addOns,
            starter: get(projectStarter)?.url,
          },
        }),
      })
      return outputReq.json()
    }
    const outputReq = await fetch('/api/dry-run-add-to-app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        addOns,
      }),
    })
    return outputReq.json()
  },
  initialData: get(initialPayloadAtom).data.output || {
    files: {},
    commands: [],
    deletedFiles: [],
  },
}))

export const toggleAddOn = atom(null, (get, set, addOnId: string) => {
  const status = get(addOnState)[addOnId]
  if (status.enabled) {
    if (status.selected) {
      set(userSelectedAddOns, (state) =>
        state.filter((addOn) => addOn !== addOnId),
      )
    } else {
      set(userSelectedAddOns, (state) => [...state, addOnId])
    }
  }
})

// Application setup

export const includeFiles = atom<Array<string>>([
  'unchanged',
  'added',
  'modified',
  'deleted',
  'overwritten',
])

export const setMode = atom(null, (get, set, mode: Mode) => {
  set(userSelectedAddOns, [])
  set(projectOptions, (state) => ({
    ...state,
    mode,
    typescript: mode === 'file-router' ? true : state.typescript,
  }))
})

export const setStarter = atom(null, (get, set, starter: StarterInfo) => {
  set(projectStarter, starter)
  set(projectOptions, (state) => ({
    ...state,
    mode: starter.mode,
    typescript: starter.typescript,
    tailwind: starter.tailwind,
  }))
})

export const removeStarter = atom(null, (get, set) => {
  set(projectStarter, undefined)
})

export const initialPayloadAtom = atomWithQuery(() => ({
  queryKey: ['initial-payload'],
  queryFn: async () => {
    const payloadReq = await fetch('/api/initial-payload')
    const data = await payloadReq.json()
    getDefaultStore().set(projectOptions, data.options)
    getDefaultStore().set(originalSelectedAddOns, data.options.chosenAddOns)
    return data
  },
  initialData: {
    addOns: {
      'code-router': [] as Array<AddOnInfo>,
      'file-router': [] as Array<AddOnInfo>,
    },
    localFiles: {} as Record<string, string>,
    options: {} as SerializedOptions,
    output: {
      files: {},
      commands: [],
    } as ProjectFiles,
    applicationMode: 'none' as 'add' | 'setup' | 'none',
  },
}))

export const codeRouterAddOns = atom<Array<AddOnInfo>>(
  (get) => get(initialPayloadAtom).data.addOns['code-router'] || [],
)

export const fileRouterAddOns = atom<Array<AddOnInfo>>(
  (get) => get(initialPayloadAtom).data.addOns['file-router'] || [],
)

export const applicationMode = atom<'add' | 'setup' | 'none'>(
  (get) => get(initialPayloadAtom).data.applicationMode || 'none',
)

export const projectLocalFiles = atom<Record<string, string>>(
  (get) => get(initialPayloadAtom).data.localFiles || {},
)

export const projectFiles = atom<ProjectFiles>(
  (get) => get(initialPayloadAtom).data.output,
)

export const isInitialized = atom((get) => get(initialPayloadAtom).isFetched)
