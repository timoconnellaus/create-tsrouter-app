import type { FrameworkDefinition } from './types.js'

const frameworks: Array<FrameworkDefinition> = []

export function registerFramework(framework: FrameworkDefinition) {
  frameworks.push(framework)
}

export function getFrameworkById(id: string) {
  return frameworks.find((framework) => framework.id === id)
}

export function getFrameworkByName(name: string) {
  return frameworks.find((framework) => framework.name === name)
}

export function getFrameworks() {
  return frameworks
}
