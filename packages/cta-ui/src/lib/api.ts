import type { SerializedOptions } from '@tanstack/cta-engine'

import type { AddOnInfo, DryRunOutput, InitialData, StarterInfo } from '@/types'

export async function createAppStreaming(
  options: SerializedOptions,
  chosenAddOns: Array<string>,
  projectStarter?: StarterInfo,
) {
  return await fetch('/api/create-app', {
    method: 'POST',
    body: JSON.stringify({
      options: {
        ...options,
        chosenAddOns,
        starter: projectStarter?.url || undefined,
      },
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export async function addToAppStreaming(chosenAddOns: Array<string>) {
  return await fetch('/api/add-to-app', {
    method: 'POST',
    body: JSON.stringify({
      addOns: chosenAddOns,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function shutdown() {
  return fetch('/api/shutdown', {
    method: 'POST',
  })
}

export async function loadRemoteAddOn(url: string) {
  const response = await fetch(`/api/load-remote-add-on?url=${url}`)
  return (await response.json()) as AddOnInfo | { error: string }
}

export async function loadRemoteStarter(url: string) {
  const response = await fetch(`/api/load-starter?url=${url}`)
  return (await response.json()) as StarterInfo | { error: string }
}

export async function loadInitialData() {
  const payloadReq = await fetch('/api/initial-payload')
  return (await payloadReq.json()) as InitialData
}

export async function dryRunCreateApp(
  options: SerializedOptions,
  chosenAddOns: Array<string>,
  projectStarter?: StarterInfo,
) {
  const outputReq = await fetch('/api/dry-run-create-app', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      options: {
        ...options,
        chosenAddOns: chosenAddOns,
        starter: projectStarter?.url,
      },
    }),
  })
  return outputReq.json() as Promise<DryRunOutput>
}

export async function dryRunAddToApp(addOns: Array<string>) {
  const outputReq = await fetch('/api/dry-run-add-to-app', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addOns,
    }),
  })
  return outputReq.json() as Promise<DryRunOutput>
}
