import { useEffect } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import {
  getAddons,
  getLocalFiles,
  getOriginalOptions,
  runCreateApp,
} from '@/lib/server-fns'

import FileNavigator from '@/components/file-navigator'
import {
  availableAddOns,
  projectFiles,
  projectLocalFiles,
  projectOptions,
} from '@/store/project'

// import type { AddOn } from '@tanstack/cta-engine'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  useEffect(() => {
    async function loadInitialSetup() {
      const fileRouterAddons = await getAddons({
        data: { platform: 'react-cra', mode: 'file-router' },
      })
      const codeRouterAddons = await getAddons({
        data: { platform: 'react-cra', mode: 'code-router' },
      })
      availableAddOns.setState(() => fileRouterAddons)

      const output = await runCreateApp({
        data: { options: projectOptions.state },
      })
      const originalOutput = await runCreateApp({
        data: { options: projectOptions.state },
      })
      projectFiles.setState(() => ({
        originalOutput,
        output,
      }))

      const originalOptions = await getOriginalOptions()
      projectOptions.setState(() => originalOptions)

      const files = await getLocalFiles()
      projectLocalFiles.setState(() => files)
    }
    loadInitialSetup()
  }, [])

  return (
    <div className="pl-3">
      <FileNavigator />
    </div>
  )
}
