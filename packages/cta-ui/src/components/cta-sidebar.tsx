import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar'

import SelectedAddOns from '@/components/sidebar-items/add-ons'
import RunAddOns from '@/components/sidebar-items/run-add-ons'
import RunCreateApp from '@/components/sidebar-items/run-create-app'
import ProjectName from '@/components/sidebar-items/project-name'
import ModeSelector from '@/components/sidebar-items/mode-selector'
import TypescriptSwitch from '@/components/sidebar-items/typescript-switch'
import StarterDialog from '@/components/sidebar-items/starter'

import { useApplicationMode, useReady } from '@/store/project'

export function AppSidebar() {
  const ready = useReady()
  const mode = useApplicationMode()

  return (
    <Sidebar>
      <SidebarHeader className="flex justify-center items-center">
        <img src="/tanstack.png" className="w-3/5" />
      </SidebarHeader>
      <SidebarContent>
        {ready && (
          <>
            {mode === 'setup' && (
              <SidebarGroup>
                <ProjectName />
                <ModeSelector />
                <TypescriptSwitch />
              </SidebarGroup>
            )}
            <SidebarGroup>
              <SelectedAddOns />
            </SidebarGroup>
            {mode === 'setup' && (
              <SidebarGroup>
                <StarterDialog />
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="mb-5">
        <RunAddOns />
        <RunCreateApp />
      </SidebarFooter>
    </Sidebar>
  )
}
