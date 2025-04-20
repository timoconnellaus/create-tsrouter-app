import { useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { FilterIcon } from 'lucide-react'

import FileViewer from './file-viewer'
import FileTree from './file-tree'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import { projectFiles, projectLocalFiles } from '@/store/project'

export function DropdownMenuDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <FilterIcon />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 backdrop-blur-lg bg-opacity-50">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">File Filters</h4>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-2">
              <Checkbox id="width" checked={true} className="w-6 h-6" />
              <Label htmlFor="width" className="text-lg">
                All Files
              </Label>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default function FileNavigator() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [originalFileContents, setOriginalFileContents] = useState<string>()
  const [modifiedFileContents, setModifiedFileContents] = useState<string>()

  const { output, originalOutput } = useStore(projectFiles)
  const localFiles = useStore(projectLocalFiles)

  return (
    <div className="flex flex-row w-[calc(100vw-450px)]">
      <div className="w-1/4 max-w-1/4 pr-2">
        <DropdownMenuDemo />
        <FileTree
          prefix="./"
          tree={output.files}
          originalTree={originalOutput.files}
          localTree={localFiles}
          onFileSelected={(file) => {
            setSelectedFile(file)
            if (localFiles[file]) {
              if (!output.files[file]) {
                setOriginalFileContents(undefined)
                setModifiedFileContents(localFiles[file])
              } else {
                setOriginalFileContents(localFiles[file])
                setModifiedFileContents(output.files[file])
              }
            } else {
              setOriginalFileContents(originalOutput.files[file])
              setModifiedFileContents(output.files[file])
            }
          }}
        />
      </div>
      <div className="max-w-3/4 w-3/4 pl-2">
        {selectedFile && modifiedFileContents ? (
          <FileViewer
            filePath={selectedFile}
            originalFile={originalFileContents}
            modifiedFile={modifiedFileContents}
          />
        ) : null}
      </div>
    </div>
  )
}
