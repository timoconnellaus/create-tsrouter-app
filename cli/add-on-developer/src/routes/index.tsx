import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, Folder } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { TreeDataItem } from '@/components/ui/tree-view'

import {
  getAllAddOns,
  createApp,
  createMemoryEnvironment,
} from '@tanstack/cta-engine'

import { TreeView } from '@/components/ui/tree-view'

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const { output, environment } = createMemoryEnvironment()
    await createApp(
      {
        addOns: false,
        framework: 'react',
        chosenAddOns: [],
        git: true,
        mode: 'code-router',
        packageManager: 'npm',
        projectName: 'foo',
        tailwind: false,
        toolchain: 'none',
        typescript: false,
        variableValues: {},
      },
      {
        silent: true,
        environment,
        cwd: process.env.PROJECT_PATH,
      },
    )
    return {
      addOns: await getAllAddOns('react', 'file-router'),
      projectPath: process.env.PROJECT_PATH!,
      output,
    }
  },
})

function App() {
  const { projectPath, output } = Route.useLoaderData()

  const tree = useMemo(() => {
    const treeData: Array<TreeDataItem> = []
    Object.keys(output.files).forEach((file) => {
      const parts = file.replace(`${projectPath}/`, '').split('/')

      let currentLevel = treeData
      parts.forEach((part, index) => {
        const existingNode = currentLevel.find((node) => node.name === part)
        if (existingNode) {
          currentLevel = existingNode.children || []
        } else {
          const newNode: TreeDataItem = {
            id: `${file}-${index}`,
            name: part,
            children: index < parts.length - 1 ? [] : undefined,
            icon:
              index < parts.length - 1
                ? () => <Folder className="w-4 h-4 mr-2" />
                : () => <FileText className="w-4 h-4 mr-2" />,
            onClick: () => {
              console.log('clicked')
              console.log('clicked', newNode)
            },
          }
          currentLevel.push(newNode)
          currentLevel = newNode.children!
        }
      })
    })
    console.log(JSON.stringify(treeData, null))
    return treeData
  }, [projectPath, output])

  console.log('Hello world')

  useEffect(() => {
    console.log('output', output)
    console.log('projectPath', projectPath)
    console.log('tree', tree)
  }, [output, projectPath, tree])

  return (
    <div className="p-5">
      <Button onClick={() => console.log('clicked')}>Click me</Button>
      <TreeView
        data={tree}
        defaultNodeIcon={() => <Folder className="w-4 h-4 mr-2" />}
        defaultLeafIcon={() => <FileText className="w-4 h-4 mr-2" />}
      />
    </div>
  )
}
