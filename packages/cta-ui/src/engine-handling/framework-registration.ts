import { register as registerReactCra } from '@tanstack/cta-framework-react-cra'
import { register as registerSolid } from '@tanstack/cta-framework-solid'

let registered = false

export function registerFrameworks() {
  if (registered) return
  registerReactCra()
  registerSolid()
  registered = true
}
