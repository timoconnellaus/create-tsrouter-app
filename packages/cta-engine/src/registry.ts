import { loadRemoteAddOn } from './custom-add-ons/add-on.js'
import { loadStarter } from './custom-add-ons/starter.js'

import type { AddOn, Mode, Starter } from './types'

export type Registry = {
  starters: Array<{
    name: string
    description: string
    url: string
    banner?: string
    mode: Mode
    framework: string
  }>
  'add-ons': Array<{
    name: string
    description: string
    url: string
    modes: Array<Mode>
    framework: string
  }>
}

function absolutizeUrl(originalUrl: string, relativeUrl: string) {
  if (relativeUrl.startsWith('http') || relativeUrl.startsWith('https')) {
    return relativeUrl
  }
  const baseUrl = originalUrl.replace(/registry.json$/, '')
  return `${baseUrl}${relativeUrl.replace(/^\.\//, '')}`
}

export async function getRawRegistry(
  registryUrl?: string,
): Promise<Registry | undefined> {
  const regUrl = registryUrl || process.env.CTA_REGISTRY
  if (regUrl) {
    const registry = (await fetch(regUrl).then((res) => res.json())) as Registry
    for (const addOn of registry['add-ons']) {
      addOn.url = absolutizeUrl(regUrl, addOn.url)
    }
    for (const starter of registry.starters) {
      starter.url = absolutizeUrl(regUrl, starter.url)
      if (starter.banner) {
        starter.banner = absolutizeUrl(regUrl, starter.banner)
      }
    }
    return registry
  }
}

async function getAddOns(registry: Registry): Promise<Array<AddOn>> {
  const addOns: Array<AddOn> = []
  for (const addOnInfo of registry['add-ons']) {
    const addOn = await loadRemoteAddOn(addOnInfo.url)
    addOns.push(addOn)
  }
  return addOns
}

export async function getRegistryAddOns(
  registryUrl?: string,
): Promise<Array<AddOn>> {
  const registry = await getRawRegistry(registryUrl)
  return registry ? await getAddOns(registry) : []
}

async function getStarters(registry: Registry): Promise<Array<Starter>> {
  const starters: Array<Starter> = []
  for (const starterInfo of registry.starters) {
    const starter = await loadStarter(starterInfo.url)
    starters.push(starter)
  }
  return starters
}

export async function getRegistryStarters(
  registryUrl?: string,
): Promise<Array<Starter>> {
  const registry = await getRawRegistry(registryUrl)
  return registry ? await getStarters(registry) : []
}

export async function getRegistry(registryUrl?: string): Promise<{
  addOns: Array<AddOn>
  starters: Array<Starter>
}> {
  const registry = await getRawRegistry(registryUrl)
  return {
    addOns: registry ? await getAddOns(registry) : [],
    starters: registry ? await getStarters(registry) : [],
  }
}
