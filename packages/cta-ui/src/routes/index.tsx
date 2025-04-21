import { useEffect, useState } from 'react'

import { createFileRoute } from '@tanstack/react-router'

import FileNavigator from '@/components/file-navigator'
import {
  applicationMode,
  codeRouterAddOns,
  fileRouterAddOns,
  projectFiles,
  projectLocalFiles,
  projectOptions,
} from '@/store/project'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadInitialSetup() {
      const payloadReq = await fetch('/api/initial-payload')
      const {
        addOns,
        localFiles,
        options,
        output,
        applicationMode: appMode,
      } = await payloadReq.json()

      applicationMode.setState(() => appMode)
      codeRouterAddOns.setState(() => addOns['code-router'])
      fileRouterAddOns.setState(() => addOns['file-router'])
      projectFiles.setState(() => ({
        originalOutput: output,
        output,
      }))
      projectOptions.setState(() => options)
      projectLocalFiles.setState(() => localFiles)

      setIsLoading(false)
    }
    loadInitialSetup()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="pl-3">
      <FileNavigator />
    </div>
  )
}
