import { Derived, Effect, Store } from '@tanstack/react-store'

import type { Mode, SerializedOptions } from '@tanstack/cta-engine'

type StarterInfo = {
  url: string
  id: string
  name: string
  description: string
  version: string
  author: string
  license: string
  mode: Mode
  typescript: boolean
  tailwind: boolean
}

// Files

type ProjectFiles = {
  originalOutput: {
    files: Record<string, string>
    commands: Array<{
      command: string
      args: Array<string>
    }>
  }
  output: {
    files: Record<string, string>
    commands: Array<{
      command: string
      args: Array<string>
    }>
  }
}

type AddOnInfo = {
  id: string
  name: string
  description: string
  type: 'add-on' | 'example' | 'starter' | 'toolchain'
  modes: Array<'code-router' | 'file-router'>
}

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

export const selectedAddOns = new Store<Array<AddOnInfo>>([])

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

const onProjectChange = new Effect({
  fn: async () => {
    const options = {
      ...projectOptions.state,
      starter: projectStarter.state?.url || undefined,
    }
    options.chosenAddOns = selectedAddOns.state.map((addOn) => addOn.id)
    console.log(options)
    const outputReq = await fetch('/api/run-create-app', {
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
  },
  deps: [selectedAddOns, availableAddOns, projectOptions, projectStarter],
})
onProjectChange.mount()

// Application setup

export const applicationMode = new Store<'add' | 'setup'>('add')

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
