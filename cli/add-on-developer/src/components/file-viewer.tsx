import CodeMirror from '@uiw/react-codemirror'
import CodeMirrorMerge from 'react-codemirror-merge'

import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'

import { okaidia } from '@uiw/codemirror-theme-okaidia'

export default function FileViewer({
  originalFile,
  modifiedFile,
  filePath,
}: {
  originalFile: string
  modifiedFile: string
  filePath: string
}) {
  function getLanguage(file: string) {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      return javascript({ jsx: true })
    }
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      return javascript({ typescript: true, jsx: true })
    }
    if (file.endsWith('.json')) {
      return json()
    }
    if (file.endsWith('.css')) {
      return css()
    }
    if (file.endsWith('.html')) {
      return html()
    }
    return javascript()
  }
  const language = getLanguage(filePath)

  if (!originalFile) {
    return (
      <CodeMirror
        value={modifiedFile}
        theme={okaidia}
        height="100vh"
        width="100%"
        readOnly
        extensions={[language]}
        className="text-lg"
      />
    )
  }
  return (
    <CodeMirrorMerge
      orientation="b-a"
      theme={okaidia}
      height="100vh"
      width="100%"
      readOnly
      className="text-lg"
    >
      <CodeMirrorMerge.Original value={originalFile} extensions={[language]} />
      <CodeMirrorMerge.Modified value={modifiedFile} extensions={[language]} />
    </CodeMirrorMerge>
  )
}
