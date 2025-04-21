import { useMemo, useState } from 'react'
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

import {
  projectFiles,
  projectLocalFiles,
  applicationMode,
} from '@/store/project'

// TODO: Add file filters
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
  const [selectedFile, setSelectedFile] = useState<string | null>(
    './package.json',
  )

  const { output, originalOutput } = useStore(projectFiles)
  const localFiles = useStore(projectLocalFiles)

  const mode = useStore(applicationMode)

  const { originalFileContents, modifiedFileContents } = useMemo(() => {
    if (!selectedFile) {
      return {
        originalFileContents: undefined,
        modifiedFileContents: undefined,
      }
    }
    if (mode === 'add') {
      if (localFiles[selectedFile]) {
        if (!output.files[selectedFile]) {
          return {
            originalFileContents: undefined,
            modifiedFileContents: localFiles[selectedFile],
          }
        } else {
          return {
            originalFileContents: localFiles[selectedFile],
            modifiedFileContents: output.files[selectedFile],
          }
        }
      } else {
        return {
          originalFileContents: originalOutput.files[selectedFile],
          modifiedFileContents: output.files[selectedFile],
        }
      }
    } else {
      return {
        modifiedFileContents: output.files[selectedFile],
      }
    }
  }, [mode, selectedFile, output.files, originalOutput.files, localFiles])

  return (
    <div className="flex flex-row w-[calc(100vw-450px)]">
      <div className="w-1/4 max-w-1/4 pr-2">
        <DropdownMenuDemo />
        <FileTree
          selectedFile={selectedFile}
          prefix="./"
          tree={output.files}
          originalTree={mode === 'setup' ? output.files : originalOutput.files}
          localTree={localFiles}
          onFileSelected={(file) => {
            setSelectedFile(file)
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
