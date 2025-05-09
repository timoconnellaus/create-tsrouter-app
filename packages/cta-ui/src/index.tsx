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
    <main>
      <BackgroundAnimation />
      <div
        className="min-h-dvh p-2 sm:p-4 space-y-2 sm:space-y-4"
        style={{
          background: `radial-gradient(closest-side, rgba(0,10,40,0.2) 0%, rgba(0,0,0,0) 100%)`,
        }}
      >
        <AppHeader />
        <div className="flex flex-row">
          <div className="w-full sm:w-1/3 lg:w-1/4 pr-1 sm:pr-2">
            <AppSidebar />
          </div>
          <div className="w-full sm:w-2/3 lg:w-3/4 pl-1 sm:pl-2">
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
