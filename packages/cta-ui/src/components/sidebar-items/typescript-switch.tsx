import { useStore } from '@tanstack/react-store'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import {
  applicationMode,
  projectOptions,
  tailwindEditable,
  typeScriptEditable,
} from '@/store/project'

export default function TypescriptSwitch() {
  const options = useStore(projectOptions)
  const mode = useStore(applicationMode)
  const enableTailwind = useStore(tailwindEditable)
  const enableTypeScript = useStore(typeScriptEditable)

  if (mode !== 'setup') {
    return null
  }

  return (
    <div className="flex mt-4">
      <div className="w-1/2 flex flex-row items-center">
        <Switch
          id="typescript-switch"
          checked={options.typescript}
          onCheckedChange={(checked) => {
            projectOptions.setState((state) => ({
              ...state,
              typescript: checked,
            }))
          }}
          disabled={!enableTypeScript}
        />
        <Label htmlFor="typescript-switch" className="ml-2">
          <img src="/typescript.svg" className="w-5" />
          TypeScript
        </Label>
      </div>
      <div className="w-1/2 flex flex-row items-center">
        <Switch
          id="tailwind-switch"
          checked={options.tailwind}
          onCheckedChange={(checked) => {
            projectOptions.setState((state) => ({
              ...state,
              tailwind: checked,
            }))
          }}
          disabled={!enableTailwind}
        />
        <Label htmlFor="tailwind-switch" className="ml-2">
          <img src="/tailwind.svg" className="w-5" />
          Tailwind
        </Label>
      </div>
    </div>
  )
}
