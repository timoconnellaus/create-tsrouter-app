import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText, Folder } from 'lucide-react'
import { createServerFn } from '@tanstack/react-start'
import CodeMirror from '@uiw/react-codemirror'

import { javascript } from '@codemirror/lang-javascript'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'

import { okaidia } from '@uiw/codemirror-theme-okaidia'
import { readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import {
  getAllAddOns,
  createApp,
  createMemoryEnvironment,
  createAppOptionsFromPersisted,
} from '@tanstack/cta-engine'

import { TreeView } from '@/components/ui/tree-view'

import type { TreeDataItem } from '@/components/ui/tree-view'
import type { AddOn, PersistedOptions } from '@tanstack/cta-engine'

const getAddons = createServerFn({
  method: 'GET',
}).handler(() => {
  return getAllAddOns('react', 'file-router')
})

const getAddonInfo = createServerFn({
  method: 'GET',
}).handler(async () => {
  const addOnInfo = readFileSync(
    resolve(process.env.PROJECT_PATH, 'add-on.json'),
  )
  return JSON.parse(addOnInfo.toString())
})

const getOriginalOptions = createServerFn({
  method: 'GET',
}).handler(async () => {
  const addOnInfo = readFileSync(resolve(process.env.PROJECT_PATH, '.cta.json'))
  return JSON.parse(addOnInfo.toString()) as PersistedOptions
})

const runCreateApp = createServerFn({
  method: 'POST',
})
  .validator((data: unknown) => {
    return data as { withAddOn: boolean; options: PersistedOptions }
  })
  .handler(
    async ({
      data: { withAddOn, options: persistedOptions },
    }: {
      data: { withAddOn: boolean; options: PersistedOptions }
    }) => {
      const { output, environment } = createMemoryEnvironment()
      const options = await createAppOptionsFromPersisted(persistedOptions)
      options.chosenAddOns = withAddOn
        ? [...options.chosenAddOns, (await getAddonInfo()) as AddOn]
        : []
      await createApp(
        {
          ...options,
        },
        {
          silent: true,
          environment,
          cwd: process.env.PROJECT_PATH,
        },
      )

      output.files = Object.keys(output.files).reduce<Record<string, string>>(
        (acc, file) => {
          if (basename(file) !== '.cta.json') {
            acc[file] = output.files[file]
          }
          return acc
        },
        {},
      )

      return output
    },
  )

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const originalOptions = await getOriginalOptions()
    return {
      addOns: await getAddons(),
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
    output,
    addOnInfo,
    outputWithoutAddon,
    originalOptions,
  } = Route.useLoaderData()
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

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

  return (
    <div className="p-5 flex flex-row">
      <TreeView
        data={tree}
        defaultNodeIcon={() => <Folder className="w-4 h-4 mr-2" />}
        defaultLeafIcon={() => <FileText className="w-4 h-4 mr-2" />}
        className="max-w-1/4 w-1/4 pr-2"
      />
      <div className="max-w-3/4 w-3/4 pl-2">
        <pre>
          {selectedFile && output.files[selectedFile] ? (
            <CodeMirror
              value={output.files[selectedFile]}
              theme={okaidia}
              height="100vh"
              width="100%"
              readOnly
              extensions={[getLanguage(selectedFile)]}
              className="text-lg"
            />
          ) : null}
        </pre>
      </div>
    </div>
  )
}
