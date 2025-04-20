import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from '@/components/ui/sidebar'

import { SelectedAddOns } from '@/components/sidebar-items/add-ons'
import RunAddOns from '@/components/sidebar-items/run-add-ons'

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SelectedAddOns />
        </SidebarGroup>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter>
        <RunAddOns />
      </SidebarFooter>
    </Sidebar>
  )
}
