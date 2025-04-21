import { useStore } from '@tanstack/react-store'

import { Input } from '@/components/ui/input'
import { SidebarGroupLabel } from '@/components/ui/sidebar'

import { applicationMode, projectOptions } from '@/store/project'

export default function ProjectName() {
  const name = useStore(projectOptions)
  const mode = useStore(applicationMode)

  if (mode !== 'setup') {
    return null
  }

  return (
    <>
      <SidebarGroupLabel>Project Name</SidebarGroupLabel>
      <Input
        value={name.projectName}
        placeholder="my-app"
        onChange={(e) => {
          projectOptions.setState((state) => ({
            ...state,
            projectName: e.target.value,
          }))
        }}
        className="w-full"
      />
    </>
  )
}
