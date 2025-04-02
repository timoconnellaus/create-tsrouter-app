import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, Folder } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'

import type { TreeDataItem } from '@/components/ui/tree-view'

import {
  getAllAddOns,
  createApp,
  createMemoryEnvironment,
} from '@tanstack/cta-engine'

import { TreeView } from '@/components/ui/tree-view'

const getAddons = createServerFn({
  method: 'GET',
}).handler(() => {
  return getAllAddOns('react', 'file-router')
})

const runCreateApp = createServerFn({
  method: 'POST',
}).handler(async () => {
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
  return output
})

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    return {
      addOns: await getAddons(),
      projectPath: process.env.PROJECT_PATH!,
      output: await runCreateApp(),
    }
  },
})

function App() {
  const { projectPath, output } = Route.useLoaderData()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

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
            id: index === parts.length - 1 ? file : `${file}-${index}`,
            name: part,
            children: index < parts.length - 1 ? [] : undefined,
            icon:
              index < parts.length - 1
                ? () => <Folder className="w-4 h-4 mr-2" />
                : () => <FileText className="w-4 h-4 mr-2" />,
            onClick:
              index === parts.length - 1
                ? () => {
                    setSelectedFile(file)
                  }
                : undefined,
          }
          currentLevel.push(newNode)
          currentLevel = newNode.children!
        }
      })
    })
    return treeData
  }, [projectPath, output])

  return (
    <div className="p-5 flex flex-row">
      <TreeView
        data={tree}
        defaultNodeIcon={() => <Folder className="w-4 h-4 mr-2" />}
        defaultLeafIcon={() => <FileText className="w-4 h-4 mr-2" />}
        className="max-w-1/4 w-1/4 pr-2"
      />
      <div className="max-w-3/4 w-3/4 pl-2">
        <pre>
          {selectedFile
            ? output.files[selectedFile] || 'Select a file to view its content'
            : null}
        </pre>
      </div>
    </div>
  )
}
