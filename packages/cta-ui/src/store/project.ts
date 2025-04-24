import { Derived, Effect, Store } from '@tanstack/react-store'

import { getAddOnStatus } from './add-ons'

import type { Mode, SerializedOptions } from '@tanstack/cta-engine'

import type { AddOnInfo, ProjectFiles, StarterInfo } from '@/types.js'

export const isInitialized = new Store<boolean>(false)

export const projectFiles = new Store<ProjectFiles>({
  originalOutput: {
    files: {},
    commands: [],
  },
  output: {
    files: {},
    commands: [],
  },
})

export const projectLocalFiles = new Store<Record<string, string>>({})

export const applicationMode = new Store<'add' | 'setup'>('add')

// Options

export const projectOptions = new Store<SerializedOptions>({
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

export const projectStarter = new Store<StarterInfo | undefined>(undefined)

// Addons

export const codeRouterAddOns = new Store<Array<AddOnInfo>>([])

export const fileRouterAddOns = new Store<Array<AddOnInfo>>([])

export const customAddOns = new Store<Array<AddOnInfo>>([])

export const availableAddOns = new Derived<Array<AddOnInfo>>({
  fn: () => {
    const mode = projectOptions.state.mode
    const baseAddOns =
      mode === 'code-router' ? codeRouterAddOns.state : fileRouterAddOns.state
    return [
      ...baseAddOns,
      ...customAddOns.state.filter((addOn) => addOn.modes.includes(mode)),
    ]
  },
  deps: [codeRouterAddOns, fileRouterAddOns, projectOptions, customAddOns],
})
availableAddOns.mount()

export const modeEditable = new Derived<boolean>({
  fn: () => {
    return projectStarter.state === undefined
  },
  deps: [projectStarter],
})
modeEditable.mount()

export const typeScriptEditable = new Derived<boolean>({
  fn: () => {
    return (
      projectStarter.state === undefined &&
      projectOptions.state.mode === 'code-router'
    )
  },
  deps: [projectStarter, projectOptions],
})
typeScriptEditable.mount()

export const tailwindEditable = new Derived<boolean>({
  fn: () => {
    return projectStarter.state === undefined
  },
  deps: [projectStarter],
})
tailwindEditable.mount()

export const originalSelectedAddOns = new Store<Array<string>>([])
export const userSelectedAddOns = new Store<Array<string>>([])

export const addOnState = new Derived<
  Record<
    string,
    {
      selected: boolean
      enabled: boolean
    }
  >
>({
  fn: () => {
    const originalAddOns: Set<string> = new Set()
    for (const addOn of projectStarter.state?.dependsOn || []) {
      originalAddOns.add(addOn)
    }
    for (const addOn of originalSelectedAddOns.state) {
      originalAddOns.add(addOn)
    }

    return getAddOnStatus(
      availableAddOns.state,
      userSelectedAddOns.state,
      originalSelectedAddOns.state,
    )
  },
  deps: [availableAddOns, userSelectedAddOns, originalSelectedAddOns],
})
addOnState.mount()

export const selectedAddOns = new Derived<Array<AddOnInfo>>({
  fn: () => {
    return availableAddOns.state.filter(
      (addOn) => addOnState.state[addOn.id].selected,
    )
  },
  deps: [availableAddOns, addOnState],
})

const onProjectChange = new Effect({
  fn: async () => {
    if (applicationMode.state === 'setup') {
      const options = {
        ...projectOptions.state,
        starter: projectStarter.state?.url || undefined,
      }
      options.chosenAddOns = selectedAddOns.state.map((addOn) => addOn.id)
      const outputReq = await fetch('/api/dry-run-create-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options,
        }),
      })
      const output = await outputReq.json()
      projectFiles.setState((state) => ({
        ...state,
        output,
      }))
    } else {
      const outputReq = await fetch('/api/dry-run-add-to-app', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addOns: selectedAddOns.state.map((addOn) => addOn.id),
        }),
      })
      const output = await outputReq.json()
      projectFiles.setState((state) => ({
        ...state,
        output,
      }))
    }
  },
  deps: [
    selectedAddOns,
    availableAddOns,
    projectOptions,
    projectStarter,
    applicationMode,
  ],
})
onProjectChange.mount()

export function toggleAddOn(addOnId: string) {
  if (addOnState.state[addOnId].enabled) {
    if (addOnState.state[addOnId].selected) {
      userSelectedAddOns.setState((state) =>
        state.filter((addOn) => addOn !== addOnId),
      )
    } else {
      userSelectedAddOns.setState((state) => [...state, addOnId])
    }
  }
}

// Application setup

export const includeFiles = new Store<Array<string>>([
  'unchanged',
  'added',
  'modified',
  'deleted',
  'overwritten',
])

export function setMode(mode: Mode) {
  selectedAddOns.setState(() => [])
  projectOptions.setState((state) => ({
    ...state,
    mode,
    typescript: mode === 'file-router' ? true : state.typescript,
  }))
}

export function setStarter(starter: StarterInfo) {
  projectStarter.setState(() => ({
    ...starter,
  }))
  projectOptions.setState((state) => ({
    ...state,
    mode: starter.mode,
    typescript: starter.typescript,
    tailwind: starter.tailwind,
  }))
}

export function removeStarter() {
  projectStarter.setState(() => undefined)
}

export async function loadInitialSetup() {
  const payloadReq = await fetch('/api/initial-payload')
  const {
    addOns,
    localFiles,
    options,
    output,
    applicationMode: appMode,
  } = await payloadReq.json()

  applicationMode.setState(() => appMode)
  codeRouterAddOns.setState(() => addOns['code-router'])
  fileRouterAddOns.setState(() => addOns['file-router'])
  projectFiles.setState(() => ({
    originalOutput: output,
    output,
  }))
  projectOptions.setState(() => options)
  originalSelectedAddOns.setState(() => options.chosenAddOns)
  projectLocalFiles.setState(() => localFiles)

  isInitialized.setState(() => true)
}

if (typeof window !== 'undefined') {
  loadInitialSetup()
}
