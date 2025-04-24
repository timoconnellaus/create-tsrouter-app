import { useAtomValue, useSetAtom } from 'jotai'

import { Input } from '@/components/ui/input'
import { SidebarGroupLabel } from '@/components/ui/sidebar'

import { applicationMode, projectOptions } from '@/store/project'

export default function ProjectName() {
  const name = useAtomValue(projectOptions)
  const mode = useAtomValue(applicationMode)
  const setProjectOptions = useSetAtom(projectOptions)

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
          setProjectOptions((state) => ({
            ...state,
            projectName: e.target.value,
          }))
        }}
        className="w-full"
      />
    </>
  )
}
