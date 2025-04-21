import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
} from '@/components/ui/sidebar'

import SelectedAddOns from '@/components/sidebar-items/add-ons'
import RunAddOns from '@/components/sidebar-items/run-add-ons'
import RunCreateApp from '@/components/sidebar-items/run-create-app'
import ProjectName from '@/components/sidebar-items/project-name'
import ModeSelector from '@/components/sidebar-items/mode-selector'
import TypescriptSwitch from '@/components/sidebar-items/typescript-switch'
import StarterDialog from '@/components/sidebar-items/starter'

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex justify-center items-center">
        <img src="/tanstack.png" className="w-3/5" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <ProjectName />
          <ModeSelector />
          <TypescriptSwitch />
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Add-ons</SidebarGroupLabel>
          <SelectedAddOns />
        </SidebarGroup>
        <SidebarGroup>
          <StarterDialog />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <RunAddOns />
        <RunCreateApp />
      </SidebarFooter>
    </Sidebar>
  )
}
