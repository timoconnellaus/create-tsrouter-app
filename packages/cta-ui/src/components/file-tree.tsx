import { useMemo } from 'react'
import { FileText, Folder } from 'lucide-react'

import type { TreeDataItem } from '@/components/ui/tree-view'

import { TreeView } from '@/components/ui/tree-view'

type FileTreeItem = TreeDataItem & {
  contents: string
  fullPath: string
}

export default function FileTree({
  prefix,
  tree,
  originalTree,
  localTree,
  selectedFile,
  onFileSelected,
}: {
  prefix: string
  tree: Record<string, string>
  originalTree: Record<string, string>
  localTree: Record<string, string>
  selectedFile: string | null
  onFileSelected: (file: string) => void
}) {
  const computedTree = useMemo(() => {
    const treeData: Array<TreeDataItem> = []

    function changed(file: string) {
      if (!originalTree[file]) {
        return true
      }
      return tree[file] !== originalTree[file]
    }

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
          let color = ''
          if (parts.length - 1) {
            if (localTree[file]) {
              if (tree[file]) {
                if (localTree[file] !== tree[file]) {
                  if (
                    originalTree[file] &&
                    localTree[file] !== originalTree[file]
                  ) {
                    color = 'text-red-500 font-bold'
                  } else {
                    color = 'text-green-500 font-bold'
                  }
                }
              } else {
                color = 'text-blue-500 font-bold'
              }
            } else {
              color = changed(file) ? 'text-green-500 font-bold' : ''
            }
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
                    onFileSelected(file)
                  }
                : undefined,
            className: color,
            contents: tree[file] || localTree[file] || originalTree[file],
          }
          currentLevel.push(newNode)
          currentLevel = newNode.children!
        }
      })
    })
    return treeData
  }, [prefix, tree, originalTree, localTree])

  const initialExpandedItemIds = useMemo(
    () => [
      'src',
      'src/routes',
      'src/components',
      'src/components/ui',
      'src/lib',
    ],
    [],
  )

  return (
    <TreeView
      initialSelectedItemId={selectedFile?.replace('./', '') ?? undefined}
      initialExpandedItemIds={initialExpandedItemIds}
      data={computedTree}
      defaultNodeIcon={() => <Folder className="w-4 h-4 mr-2" />}
      defaultLeafIcon={() => <FileText className="w-4 h-4 mr-2" />}
    />
  )
}
