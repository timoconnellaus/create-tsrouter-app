import { CodeIcon } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

import {
  setRouterMode,
  useApplicationMode,
  useModeEditable,
  useRouterMode,
  useSupportedModes,
} from '../../store/project'

export default function ModeSelector() {
  const mode = useApplicationMode()
  const enableMode = useModeEditable()
  const routerMode = useRouterMode()
  const supportedModes = useSupportedModes()

  if (mode !== 'setup' || Object.keys(supportedModes ?? {}).length < 2) {
    return null
  }

  return (
    <div className="block p-4 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors space-y-4 active @container">
      <div className="flex flex-col @md:flex-row @md:items-center gap-2 items-start">
        <h3 className="font-medium whitespace-nowrap">Router Mode</h3>
        <div className="flex flex-row justify-center items-center">
          <ToggleGroup
            type="single"
            value={routerMode}
            onValueChange={(v: string) => {
              if (v) {
                setRouterMode(v)
              }
            }}
            className="rounded-md border-2 border-gray-500/10"
          >
            {Object.keys(supportedModes ?? {}).map((mode) => (
              <ToggleGroupItem
                key={mode}
                value={mode}
                className="px-4"
                disabled={!enableMode}
              >
                <CodeIcon className="w-4 h-4" />
                {supportedModes?.[mode].displayName}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  )
}
