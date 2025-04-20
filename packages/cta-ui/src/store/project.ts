import { Effect, Store } from '@tanstack/react-store'

import type { SerializedOptions } from '@tanstack/cta-engine'

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

export const projectOptions = new Store<SerializedOptions>({})

// Addons

export const availableAddOns = new Store<Array<AddOnInfo>>([])

export const selectedAddOns = new Store<Array<AddOnInfo>>([])

const onChangeAddOns = new Effect({
  fn: async () => {
    if (projectOptions.state.framework) {
      const options = { ...projectOptions.state }
      options.chosenAddOns = selectedAddOns.state.map((addOn) => addOn.id)
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
    }
  },
  deps: [selectedAddOns, availableAddOns, projectOptions],
})
onChangeAddOns.mount()

// Application setup

export const applicationMode = new Store<'add' | 'setup'>('add')
