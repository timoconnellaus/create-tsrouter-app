import { Input } from '../ui/input'

import {
  setProjectName,
  useApplicationMode,
  useProjectName,
} from '../../store/project'

export default function ProjectName() {
  const name = useProjectName()
  const mode = useApplicationMode()

  if (mode !== 'setup') {
    return null
  }

  return (
    <div className="flex flex-row gap-2 items-center">
      <h3 className="font-medium whitespace-nowrap">Project Name</h3>
      <Input
        value={name}
        placeholder="my-app"
        onChange={(e) => setProjectName(e.target.value)}
        className="w-full bg-gray-500/10 rounded-md px-2 py-1 min-w-[200px] text-sm"
      />
    </div>
  )
}
