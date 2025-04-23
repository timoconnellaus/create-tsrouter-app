import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/toaster'

import { AppSidebar } from '@/components/cta-sidebar'

interface MyRouterContext {
  queryClient: QueryClient
}

function Content() {
  const { open } = useSidebar()

  return (
    <main
      className={
        open ? 'w-full max-w-[calc(100%-370px)]' : 'w-full max-w-[100%]'
      }
    >
      <SidebarTrigger className="m-2" />
      <Outlet />
    </main>
  )
}
export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack CTA',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: () => {
    return (
      <RootDocument>
        <SidebarProvider>
          <AppSidebar />
          <Content />
          <Toaster />
        </SidebarProvider>
      </RootDocument>
    )
  },
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="dark">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
