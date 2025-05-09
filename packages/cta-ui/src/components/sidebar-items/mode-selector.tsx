import { CodeIcon, FileIcon } from 'lucide-react'

import type { Mode } from '@tanstack/cta-engine'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import {
  setRouterMode,
  useApplicationMode,
  useModeEditable,
  useRouterMode,
} from '@/store/project'

export default function ModeSelector() {
  const mode = useApplicationMode()
  const enableMode = useModeEditable()
  const routerMode = useRouterMode()

  if (mode !== 'setup') {
    return null
  }

  return (
    <div className="flex flex-row gap-2 items-center">
      <h3 className="font-medium whitespace-nowrap">Router Mode</h3>
      <div className="flex flex-row justify-center items-center">
        <ToggleGroup
          type="single"
          value={routerMode}
          onValueChange={(v: string) => {
            if (v) {
              setRouterMode(v as Mode)
            }
          }}
          className="rounded-md border-2 border-gray-500/10"
        >
          <ToggleGroupItem
            value="code-router"
            className="px-4"
            disabled={!enableMode}
          >
            <CodeIcon className="w-4 h-4" />
            Code Router
          </ToggleGroupItem>
          <ToggleGroupItem
            value="file-router"
            className="px-4"
            disabled={!enableMode}
          >
            <FileIcon className="w-4 h-4" />
            File Router
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
