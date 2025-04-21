import { useStore } from '@tanstack/react-store'
import { CodeIcon, FileIcon } from 'lucide-react'

import type { Mode } from '@tanstack/cta-engine'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SidebarGroupLabel } from '@/components/ui/sidebar'

import {
  applicationMode,
  modeEditable,
  projectOptions,
  setMode,
} from '@/store/project'

export default function ModeSelector() {
  const mode = useStore(applicationMode)
  const options = useStore(projectOptions)
  const enableMode = useStore(modeEditable)

  if (mode !== 'setup') {
    return null
  }

  return (
    <>
      <SidebarGroupLabel className="mt-4">Router Mode</SidebarGroupLabel>
      <div className="flex flex-row justify-center items-center">
        <ToggleGroup
          type="single"
          value={options.mode}
          onValueChange={(v: string) => {
            if (v) {
              setMode(v as Mode)
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
