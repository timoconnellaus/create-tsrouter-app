import SelectedAddOns from '@/components/sidebar-items/add-ons'
import RunAddOns from '@/components/sidebar-items/run-add-ons'
import RunCreateApp from '@/components/sidebar-items/run-create-app'
import ProjectName from '@/components/sidebar-items/project-name'
import ModeSelector from '@/components/sidebar-items/mode-selector'
import TypescriptSwitch from '@/components/sidebar-items/typescript-switch'
import StarterDialog from '@/components/sidebar-items/starter'

import { ChevronRightIcon } from 'lucide-react'

import { useApplicationMode, useReady } from '@/store/project'

export function AppSidebar() {
  const ready = useReady()
  const mode = useApplicationMode()

  return (
    <div className="flex flex-col gap-2">
      {ready && (
        <>
          {mode === 'setup' && (
            <div className="bg-white dark:bg-black/40 shadow-xl p-4 space-y-2 rounded-lg">
              <div className="block p-4 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors space-y-4 active">
                <ProjectName />
              </div>
              <div className="block p-4 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors space-y-4 active">
                <ModeSelector />
              </div>
              <div className="block p-4 bg-gray-500/10 hover:bg-gray-500/20 rounded-lg transition-colors space-y-4 active">
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
