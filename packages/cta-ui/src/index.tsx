import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FileNavigator from '@/components/file-navigator'
import StartupDialog from '@/components/startup-dialog'

import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/toaster'

import { AppSidebar } from '@/components/cta-sidebar'
import { useManager } from '@/store/project'

const queryClient = new QueryClient()

function Content() {
  const { open } = useSidebar()
  useManager()

  return (
    <main
      className={
        open ? 'w-full max-w-[calc(100%-370px)]' : 'w-full max-w-[100%]'
      }
    >
      <SidebarTrigger className="m-2" />
      <div className="pl-3">
        <FileNavigator />
        <StartupDialog />
      </div>
    </main>
  )
}

export default function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <AppSidebar />
        <Content />
        <Toaster />
      </SidebarProvider>
    </QueryClientProvider>
  )
}
