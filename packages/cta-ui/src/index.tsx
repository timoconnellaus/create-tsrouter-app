import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FileNavigator from '@/components/file-navigator'
import StartupDialog from '@/components/startup-dialog'

import { Toaster } from '@/components/toaster'

import { AppSidebar } from '@/components/cta-sidebar'
import { AppHeader } from '@/components/header'
import { BackgroundAnimation } from '@/components/background-animation'
import { useManager } from '@/store/project'

const queryClient = new QueryClient()

function Content() {
  useManager()

  return (
    <main className="min-w-[1280px]">
      <BackgroundAnimation />
      <div className="min-h-dvh p-2 sm:p-4 space-y-2 sm:space-y-4 @container">
        <AppHeader />
        <div className="flex flex-row">
          <div className="w-1/2 @7xl:w-1/4 pr-1">
            <AppSidebar />
          </div>
          <div className="w-1/2 @7xl:w-3/4 pl-1">
            <FileNavigator />
          </div>
        </div>
      </div>
      <StartupDialog />
    </main>
  )
}

export default function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Content />
      <Toaster />
    </QueryClientProvider>
  )
}
