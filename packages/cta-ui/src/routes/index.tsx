import { useEffect } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import { getAddons, getOriginalOptions, runCreateApp } from '@/lib/server-fns'

import FileNavigator from '@/components/file-navigator'
import { availableAddOns, projectFiles, projectOptions } from '@/store/project'

// import type { AddOn } from '@tanstack/cta-engine'

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    /// In add mode the original files need to be loaded from the current directory
    const originalOptions = await getOriginalOptions()
    const [codeRouterAddons, fileRouterAddons] = await Promise.all([
      getAddons({
        data: { platform: 'react-cra', mode: 'code-router' },
      }),
      getAddons({
        data: { platform: 'react-cra', mode: 'file-router' },
      }),
    ])
    return {
      addOns: {
        'code-router': codeRouterAddons,
        'file-router': fileRouterAddons,
      },
      projectPath: process.env.CTA_PROJECT_PATH!,
      output: await runCreateApp({
        data: { options: originalOptions },
      }),
      originalOutput: await runCreateApp({
        data: { options: originalOptions },
      }),
      originalOptions,
    }
  },
})

function App() {
  const { projectPath, output, originalOutput, originalOptions, addOns } =
    Route.useLoaderData()

  useEffect(() => {
    projectOptions.setState(() => originalOptions)
    projectFiles.setState((state) => ({
      ...state,
      originalOutput,
      output,
    }))
    availableAddOns.setState(() => addOns['file-router'])
  }, [])

  return (
    <div className="pl-3">
      <FileNavigator />
    </div>
  )
}
