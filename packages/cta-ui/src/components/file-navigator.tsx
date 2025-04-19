import { useState } from 'react'
import { useStore } from '@tanstack/react-store'

import FileViewer from './file-viewer'
import FileTree from './file-tree'

import { projectFiles } from '@/store/project'

export default function FileNavigator() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const { output, originalOutput } = useStore(projectFiles)

  return (
    <div className="flex flex-row w-[calc(100vw-300px)]">
      <FileTree
        prefix="./"
        tree={output.files}
        originalTree={originalOutput.files}
        onFileSelected={(file) => {
          setSelectedFile(file)
        }}
      />
      <div className="max-w-3/4 w-3/4 pl-2">
        {selectedFile ? (
          <FileViewer
            filePath={selectedFile}
            originalFile={originalOutput.files[selectedFile]}
            modifiedFile={output.files[selectedFile]}
          />
        ) : null}
      </div>
    </div>
  )
}
