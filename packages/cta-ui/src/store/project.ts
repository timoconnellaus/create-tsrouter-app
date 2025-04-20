import { Effect, Store } from '@tanstack/react-store'

import type { PersistedOptions } from '@tanstack/cta-engine'

import { runCreateApp } from '@/lib/server-fns'

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

export const projectOptions = new Store<PersistedOptions>({
  framework: 'react-cra',
  version: 1,
  existingAddOns: [],
})

// Addons

export const availableAddOns = new Store<Array<AddOnInfo>>([])

export const selectedAddOns = new Store<Array<AddOnInfo>>([])

const onChangeAddOns = new Effect({
  fn: async () => {
    const options = { ...projectOptions.state }
    options.existingAddOns = selectedAddOns.state.map((addOn) => addOn.id)
    const output = await runCreateApp({
      data: { options },
    })
    projectFiles.setState((state) => ({
      ...state,
      output,
    }))
  },
  deps: [selectedAddOns, availableAddOns],
})
onChangeAddOns.mount()

// Application setup

export const applicationModel = new Store<'add' | 'setup'>('add')
