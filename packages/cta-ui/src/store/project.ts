import { atom, getDefaultStore } from 'jotai'
import { atomWithQuery } from 'jotai-tanstack-query'

import { getAddOnStatus } from './add-ons'

import type { Mode, SerializedOptions } from '@tanstack/cta-engine'

import type {
  AddOnInfo,
  DryRunOutput,
  ProjectFiles,
  StarterInfo,
} from '@/types.js'

export const isInitialized = atom(false)

export const projectFiles = atom<ProjectFiles>({
  originalOutput: {
    files: {},
    commands: [],
  },
})

export const projectLocalFiles = atom<Record<string, string>>({})

export const applicationMode = atom<'add' | 'setup'>('add')

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

export const codeRouterAddOns = atom<Array<AddOnInfo>>([])

export const fileRouterAddOns = atom<Array<AddOnInfo>>([])

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
  queryKey: ['dry-run', get(projectOptions), get(selectedAddOns)],
  queryFn: async () => {
    if (get(applicationMode) === 'setup') {
      const options = {
        ...get(projectOptions),
        starter: get(projectStarter)?.url || undefined,
      }
      options.chosenAddOns = get(selectedAddOns).map((addOn) => addOn.id)
      const outputReq = await fetch('/api/dry-run-create-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options,
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
        addOns: get(selectedAddOns).map((addOn) => addOn.id),
      }),
    })
    return outputReq.json()
  },
  initialData: {
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

export const loadInitialSetup = atom(null, async (get, set) => {
  console.log('write')

  const payloadReq = await fetch('/api/initial-payload')
  const {
    addOns,
    localFiles,
    options,
    output,
    applicationMode: appMode,
  } = await payloadReq.json()

  set(applicationMode, appMode)
  set(codeRouterAddOns, addOns['code-router'])
  set(fileRouterAddOns, addOns['file-router'])
  set(projectFiles, {
    originalOutput: output,
  })
  set(projectOptions, options)
  set(originalSelectedAddOns, options.chosenAddOns)
  set(projectLocalFiles, localFiles)

  set(isInitialized, true)
})

if (typeof window !== 'undefined') {
  getDefaultStore().set(loadInitialSetup)
}
