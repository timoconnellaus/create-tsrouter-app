import { useMemo } from 'react'
import { FileText, Folder } from 'lucide-react'

import type { TreeDataItem } from '@/components/ui/tree-view'

import { TreeView } from '@/components/ui/tree-view'

type FileTreeItem = TreeDataItem & {
  contents: string
}

export default function FileTree({
  prefix,
  tree,
  originalTree,
  localTree,
  onFileSelected,
}: {
  prefix: string
  tree: Record<string, string>
  originalTree: Record<string, string>
  localTree: Record<string, string>
  onFileSelected: (file: string) => void
}) {
  const computedTree = useMemo(() => {
    const treeData: Array<TreeDataItem> = [
      {
        id: 'root',
        name: '.',
        children: [],
        icon: () => <Folder className="w-4 h-4 mr-2" />,
      },
    ]

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
      const parts = file.split('/')

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

  return (
    <TreeView
      data={computedTree}
      defaultNodeIcon={() => <Folder className="w-4 h-4 mr-2" />}
      defaultLeafIcon={() => <FileText className="w-4 h-4 mr-2" />}
      className="max-w-1/4 w-1/4 pr-2"
    />
  )
}
