import { Input } from '@/components/ui/input'
import { SidebarGroupLabel } from '@/components/ui/sidebar'

import {
  setProjectName,
  useApplicationMode,
  useProjectName,
} from '@/store/project'

export default function ProjectName() {
  const name = useProjectName()
  const mode = useApplicationMode()

  if (mode !== 'setup') {
    return null
  }

  return (
    <>
      <SidebarGroupLabel>Project Name</SidebarGroupLabel>
      <Input
        value={name}
        placeholder="my-app"
        onChange={(e) => setProjectName(e.target.value)}
        className="w-full"
      />
    </>
  )
}
