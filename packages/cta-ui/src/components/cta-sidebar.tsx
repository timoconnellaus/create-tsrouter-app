import { useApplicationMode, useReady } from '../store/project'

import SelectedAddOns from './sidebar-items/add-ons'
import RunAddOns from './sidebar-items/run-add-ons'
import RunCreateApp from './sidebar-items/run-create-app'
import ProjectName from './sidebar-items/project-name'
import ModeSelector from './sidebar-items/mode-selector'
import TypescriptSwitch from './sidebar-items/typescript-switch'
import StarterDialog from './sidebar-items/starter'

export function AppSidebar() {
  const ready = useReady()
  const mode = useApplicationMode()

  return (
    <div className="flex flex-col gap-2">
      {ready && (
        <>
          {mode === 'setup' && (
            <div className="bg-white dark:bg-black/40 shadow-xl p-4 space-y-2 rounded-lg">
              <div className="block p-4 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors space-y-4 active @container">
                <ProjectName />
              </div>
              <ModeSelector />
              <div className="block p-4 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors space-y-4 active @container">
                <TypescriptSwitch />
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-black/40 shadow-xl p-4 space-y-2 rounded-lg">
            <SelectedAddOns />
          </div>
          {mode === 'setup' && (
            <div className="bg-white dark:bg-black/40 shadow-xl p-4 space-y-2 rounded-lg">
              <StarterDialog />
            </div>
          )}
        </>
      )}
      <div className="mt-5">
        <RunAddOns />
        <RunCreateApp />
      </div>
    </div>
  )
}
