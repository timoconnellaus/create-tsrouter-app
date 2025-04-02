import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, Folder } from 'lucide-react'

import { TreeView } from '@/components/ui/tree-view'
import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import type { TreeDataItem } from '@/components/ui/tree-view'

import {
  getAddons,
  getAddonInfo,
  getOriginalOptions,
  runCreateApp,
} from '@/lib/server-fns'
import FileViewer from '@/components/file-viewer'

import type { Mode } from '@tanstack/cta-engine'

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const originalOptions = await getOriginalOptions()
    const [codeRouterAddons, fileRouterAddons] = await Promise.all([
      getAddons({
        data: { platform: 'react', mode: 'code-router' },
      }),
      getAddons({
        data: { platform: 'react', mode: 'file-router' },
      }),
    ])
    return {
      addOns: {
        'code-router': codeRouterAddons,
        'file-router': fileRouterAddons,
      },
      projectPath: process.env.PROJECT_PATH!,
      output: await runCreateApp({
        data: { withAddOn: true, options: originalOptions },
      }),
      outputWithoutAddon: await runCreateApp({
        data: { withAddOn: false, options: originalOptions },
      }),
      addOnInfo: await getAddonInfo(),
      originalOptions,
    }
  },
})

function App() {
  const {
    projectPath,
    output: originalOutput,
    addOnInfo,
    outputWithoutAddon: originalOutputWithoutAddon,
    originalOptions,
    addOns,
  } = Route.useLoaderData()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const [options, setOptions] = useState(originalOptions)
  const [output, setOutput] = useState(originalOutput)
  const [outputWithoutAddon, setOutputWithoutAddon] = useState(
    originalOutputWithoutAddon,
  )
  const [selectedAddOns, setSelectedAddOns] = useState<Array<string>>([])

  async function updateOptions(
    updatedOptions: Partial<typeof options>,
    updatedAddOns: Array<string> = [],
  ) {
    const newMode = updatedOptions.mode || options.mode
    const existingAddOns = [
      ...(originalOptions.existingAddOns || []),
      ...(updatedAddOns || []),
    ].filter((id) => addOns[newMode as Mode].some((addOn) => addOn.id === id))

    const newOptions = {
      ...options,
      ...updatedOptions,
      existingAddOns,
    }
    setOptions(newOptions)
    const [newOutput, newOutputWithoutAddon] = await Promise.all([
      runCreateApp({
        data: { withAddOn: true, options: newOptions },
      }),
      runCreateApp({
        data: { withAddOn: false, options: newOptions },
      }),
    ])
    setOutput(newOutput)
    setOutputWithoutAddon(newOutputWithoutAddon)
  }

  const tree = useMemo(() => {
    const treeData: Array<TreeDataItem> = []

    function changed(file: string) {
      if (!outputWithoutAddon.files[file]) {
        return true
      }
      return output.files[file] !== outputWithoutAddon.files[file]
    }

    Object.keys(output.files)
      .sort()
      .forEach((file) => {
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
              className:
                index === parts.length - 1 && changed(file)
                  ? 'text-green-300'
                  : '',
            }
            currentLevel.push(newNode)
            currentLevel = newNode.children!
          }
        })
      })
    return treeData
  }, [projectPath, output])

  return (
    <div className="p-5">
      <div className="flex flex-row items-center mb-5">
        <ToggleGroup
          type="single"
          value={options.mode}
          onValueChange={(v: string) => {
            if (v) {
              updateOptions(
                {
                  mode: v as Mode,
                },
                selectedAddOns,
              )
            }
          }}
        >
          <ToggleGroupItem
            value="code-router"
            disabled={!addOnInfo.templates.includes('code-router')}
          >
            Code Router
          </ToggleGroupItem>
          <ToggleGroupItem
            value="file-router"
            disabled={!addOnInfo.templates.includes('file-router')}
          >
            File Router
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="flex flex-row ml-5 flex-wrap">
          {addOns[options.mode as Mode].map((addOn) => (
            <div key={addOn.name} className="mr-2 flex items-center">
              <Checkbox
                id={addOn.id}
                checked={
                  originalOptions.existingAddOns.includes(addOn.id) ||
                  selectedAddOns.includes(addOn.id)
                }
                disabled={originalOptions.existingAddOns.includes(addOn.id)}
                onClick={() => {
                  let updatedAddOns = selectedAddOns.includes(addOn.id)
                    ? selectedAddOns.filter((id) => id !== addOn.id)
                    : [...selectedAddOns, addOn.id]
                  setSelectedAddOns(updatedAddOns)
                  updateOptions({}, updatedAddOns)
                }}
              />
              <label htmlFor={addOn.id} className="ml-2">
                {addOn.name}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-row">
        <TreeView
          data={tree}
          defaultNodeIcon={() => <Folder className="w-4 h-4 mr-2" />}
          defaultLeafIcon={() => <FileText className="w-4 h-4 mr-2" />}
          className="max-w-1/4 w-1/4 pr-2"
        />
        <div className="max-w-3/4 w-3/4 pl-2">
          {selectedFile ? (
            <FileViewer
              filePath={selectedFile}
              originalFile={outputWithoutAddon.files[selectedFile]}
              modifiedFile={output.files[selectedFile]}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
