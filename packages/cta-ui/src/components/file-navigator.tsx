import { useMemo, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { FileText, Folder } from 'lucide-react'

import FileViewer from './file-viewer'
import FileTree from './file-tree'

import type { FileTreeItem } from '@/types'

import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

import {
  applicationMode,
  dryRunAtom,
  includeFiles,
  isInitialized,
  projectFiles,
  projectLocalFiles,
} from '@/store/project'

import { getFileClass, twClasses } from '@/file-classes'

export function Filters() {
  const includedFiles = useAtomValue(includeFiles)
  const setIncludeFiles = useSetAtom(includeFiles)
  function toggleFilter(
    filter: 'unchanged' | 'added' | 'modified' | 'deleted' | 'overwritten',
  ) {
    setIncludeFiles((state) => {
      if (state.includes(filter)) {
        return state.filter((file) => file !== filter)
      }
      return [...state, filter]
    })
  }

  return (
    <div className="p-2 rounded-md bg-gray-900 file-filters">
      <div className="text-center text-sm mb-2">File Filters</div>
      <div className="flex flex-row flex-wrap gap-y-2">
        <div className="flex flex-row items-center gap-2 w-1/3">
          <Checkbox
            id="unchanged"
            checked={includedFiles.includes('unchanged')}
            className="w-4 h-4"
            onCheckedChange={() => toggleFilter('unchanged')}
          />
          <Label htmlFor="unchanged" className={twClasses.unchanged}>
            Unchanged
          </Label>
        </div>
        <div className="flex flex-row items-center gap-2 w-1/3">
          <Checkbox
            id="added"
            checked={includedFiles.includes('added')}
            className="w-4 h-4"
            onCheckedChange={() => toggleFilter('added')}
          />
          <Label htmlFor="added" className={twClasses.added}>
            Added
          </Label>
        </div>
        <div className="flex flex-row items-center gap-2 w-1/3">
          <Checkbox
            id="modified"
            checked={includedFiles.includes('modified')}
            className="w-4 h-4"
            onCheckedChange={() => toggleFilter('modified')}
          />
          <Label htmlFor="modified" className={twClasses.modified}>
            Modified
          </Label>
        </div>
        <div className="flex flex-row items-center gap-2 w-1/3">
          <Checkbox
            id="deleted"
            checked={includedFiles.includes('deleted')}
            className="w-4 h-4"
            onCheckedChange={() => toggleFilter('deleted')}
          />
          <Label htmlFor="deleted" className={twClasses.deleted}>
            Deleted
          </Label>
        </div>
        <div className="flex flex-row items-center gap-2 w-1/3">
          <Checkbox
            id="overwritten"
            checked={includedFiles.includes('overwritten')}
            className="w-4 h-4"
            onCheckedChange={() => toggleFilter('overwritten')}
          />
          <Label htmlFor="overwritten" className={twClasses.overwritten}>
            Overwritten
          </Label>
        </div>
      </div>
    </div>
  )
}

export default function FileNavigator() {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    './package.json',
  )

  const originalOutput = useAtomValue(projectFiles)
  const localTree = useAtomValue(projectLocalFiles)
  const { data: output } = useAtomValue(dryRunAtom)

  const mode = useAtomValue(applicationMode)
  const tree = output.files
  const originalTree = mode === 'setup' ? output.files : originalOutput.files
  const deletedFiles = output.deletedFiles

  const [originalFileContents, setOriginalFileContents] = useState<string>()
  const [modifiedFileContents, setModifiedFileContents] = useState<string>()

  const includedFiles = useAtomValue(includeFiles)

  const fileTree = useMemo(() => {
    const treeData: Array<FileTreeItem> = []

    const allFileSet = Array.from(
      new Set([
        ...Object.keys(tree),
        ...Object.keys(localTree),
        ...Object.keys(originalTree),
      ]),
    )

    allFileSet.sort().forEach((file) => {
      const strippedFile = file.replace('./', '')
      const parts = strippedFile.split('/')

      let currentLevel = treeData
      parts.forEach((part, index) => {
        const existingNode = currentLevel.find((node) => node.name === part)
        if (existingNode) {
          currentLevel = existingNode.children || []
        } else {
          const fileInfo = getFileClass(
            file,
            tree,
            originalTree,
            localTree,
            deletedFiles,
          )

          if (
            index === parts.length - 1 &&
            !includedFiles.includes(fileInfo.fileClass)
          ) {
            return
          }
          if (index === parts.length - 1 && file === selectedFile) {
            setModifiedFileContents(fileInfo.modifiedFile)
            setOriginalFileContents(fileInfo.originalFile)
          }

          const newNode: FileTreeItem = {
            id: parts.slice(0, index + 1).join('/'),
            name: part,
            fullPath: strippedFile,
            children: index < parts.length - 1 ? [] : undefined,
            icon:
              index < parts.length - 1
                ? () => <Folder className="w-4 h-4 mr-2" />
                : () => <FileText className="w-4 h-4 mr-2" />,
            onClick:
              index === parts.length - 1
                ? () => {
                    setSelectedFile(file)
                    setModifiedFileContents(fileInfo.modifiedFile)
                    setOriginalFileContents(fileInfo.originalFile)
                  }
                : undefined,
            className: twClasses[fileInfo.fileClass],
            ...fileInfo,
            contents: tree[file] || localTree[file] || originalTree[file],
          }
          currentLevel.push(newNode)
          currentLevel = newNode.children!
        }
      })
    })
    return treeData
  }, [tree, originalTree, localTree, includedFiles])

  const ready = useAtomValue(isInitialized)

  if (!ready) {
    return null
  }

  return (
    <div
      className={`flex flex-row border-1 rounded-md mr-10 p-2 inset-shadow-gray-600 inset-shadow-sm`}
    >
      <div className="w-1/4 max-w-1/4 pr-2">
        {mode === 'add' && <Filters />}
        <FileTree selectedFile={selectedFile} tree={fileTree} />
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
