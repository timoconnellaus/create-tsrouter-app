import { createFileRoute } from '@tanstack/react-router'

import FileNavigator from '@/components/file-navigator'
import StartupDialog from '@/components/startup-dialog'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="pl-3">
      <FileNavigator />
      <StartupDialog />
    </div>
  )
}
