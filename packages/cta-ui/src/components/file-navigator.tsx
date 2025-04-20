import { useState } from 'react'
import { useStore } from '@tanstack/react-store'

import FileViewer from './file-viewer'
import FileTree from './file-tree'

import { projectFiles, projectLocalFiles } from '@/store/project'

export default function FileNavigator() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [originalFileContents, setOriginalFileContents] = useState<string>()
  const [modifiedFileContents, setModifiedFileContents] = useState<string>()

  const { output, originalOutput } = useStore(projectFiles)
  const localFiles = useStore(projectLocalFiles)

  return (
    <div className="flex flex-row w-[calc(100vw-450px)]">
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
