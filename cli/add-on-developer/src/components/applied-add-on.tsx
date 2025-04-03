import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import { runCreateApp } from '@/lib/server-fns'
import FileViewer from './file-viewer'
import FileTree from './file-tree'

import type { Mode } from '@tanstack/cta-engine'

export default function AppliedAddOn({
  projectPath,
  output: originalOutput,
  addOnInfo,
  outputWithoutAddon: originalOutputWithoutAddon,
  originalOptions,
  addOns,
}: {
  projectPath: string
  output: {
    files: Record<string, string>
  }
  outputWithoutAddon: {
    files: Record<string, string>
  }
  addOnInfo: {
    templates: Array<string>
  }
  originalOptions: {
    existingAddOns: Array<string>
    mode: Mode
  }
  addOns: Record<string, Array<any>>
}) {
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

  return (
    <div>
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
        <FileTree
          prefix={projectPath}
          tree={output.files}
          originalTree={outputWithoutAddon.files}
          onFileSelected={(file) => {
            setSelectedFile(file)
          }}
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
