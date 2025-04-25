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
    <>
      <div className="flex flex-row justify-center items-center mt-4">
        <ToggleGroup
          type="single"
          value={routerMode}
          onValueChange={(v: string) => {
            if (v) {
              setRouterMode(v as Mode)
            }
          }}
        >
          <ToggleGroupItem
            value="code-router"
            className="px-8"
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
    </>
  )
}
