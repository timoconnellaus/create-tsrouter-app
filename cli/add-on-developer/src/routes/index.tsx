import { useState, Fragment } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Info } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import AppliedAddOn from '@/components/applied-add-on'
import FileTree from '@/components/file-tree'
import FileViewer from '@/components/file-viewer'

import {
  getAddons,
  getAddonInfo,
  getOriginalOptions,
  runCreateApp,
} from '@/lib/server-fns'
import type { AddOn } from '@tanstack/cta-engine'

export const Route = createFileRoute('/')({
  component: App,
  loader: async () => {
    const originalOptions = await getOriginalOptions()
    const [codeRouterAddons, fileRouterAddons] = await Promise.all([
      getAddons({
        data: { platform: 'react', mode: 'code-router' },
      }),
      getAddons({
        data: { platform: 'react', mode: 'file-router' },
      }),
    ])
    return {
      addOns: {
        'code-router': codeRouterAddons,
        'file-router': fileRouterAddons,
      },
      projectPath: process.env.PROJECT_PATH!,
      output: await runCreateApp({
        data: { withAddOn: true, options: originalOptions },
      }),
      outputWithoutAddon: await runCreateApp({
        data: { withAddOn: false, options: originalOptions },
      }),
      addOnInfo: (await getAddonInfo()) as AddOn,
      originalOptions,
    }
  },
})

const CAPTIONS = {
  dependencies: 'Dependencies',
  devDependencies: 'Dev Dependencies',
  scripts: 'Scripts',
}

function InfoViewer({ info }: { info: AddOn }) {
  return (
    <div className="text-lg">
      <div className="grid grid-cols-[200px_1fr] gap-4 mb-4">
        <div className="font-medium">Name</div>
        <div className="font-bold">{info.name}</div>
        <div className="font-medium">Description</div>
        <div className="font-bold">{info.description}</div>
        <div className="font-medium">Version</div>
        <div className="font-bold">{info.version}</div>
        <div className="font-medium">Author</div>
        <div className="font-bold">{info.author}</div>
        <div className="font-medium">License</div>
        <div className="font-bold">{info.license}</div>
        {(
          [
            'dependencies',
            'devDependencies',
            'scripts',
          ] as (keyof AddOn['packageAdditions'])[]
        )
          .filter(
            (key) =>
              info.packageAdditions[key] &&
              Object.entries(info.packageAdditions[key]).length > 0,
          )
          .map((key) => (
            <Fragment key={key}>
              <div className="font-medium">{CAPTIONS[key]}</div>
              <Table>
                {key !== 'scripts' && (
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/2">Package</TableHead>
                      <TableHead className="w-1/2">Version</TableHead>
                    </TableRow>
                  </TableHeader>
                )}
                <TableBody>
                  {Object.entries(info.packageAdditions[key]).map(
                    ([pkg, version]) => (
                      <TableRow key={`${key}-${pkg}`}>
                        <TableCell className="w-1/2">{pkg}</TableCell>
                        <TableCell className="w-1/2">{version}</TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </Fragment>
          ))}
        {info.routes && (
          <>
            <div className="font-medium">Routes</div>
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">URL</TableHead>
                    <TableHead className="w-1/2">Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {info.routes.map(({ url, name }) => (
                    <TableRow key={`${url}-${name}`}>
                      <TableCell className="w-1/2">{url}</TableCell>
                      <TableCell className="w-1/2">{name}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
        {info.commmand && (
          <>
            <div className="font-medium">Setup Command</div>
            <div className="font-bold font-mono">{`${info.command.command} ${info.command.args.join(' ')}`}</div>
          </>
        )}
      </div>
    </div>
  )
}

function AddOnViewer({ addOnInfo }: { addOnInfo: AddOn }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="flex flex-row">
      <FileTree
        prefix="./"
        tree={addOnInfo.files || {}}
        originalTree={{}}
        onFileSelected={(file) => {
          setSelectedFile(file)
          setShowInfo(false)
        }}
        extraTreeItems={[
          {
            id: 'info',
            name: 'Add-On Info',
            icon: () => <Info className="w-4 h-4 mr-2" />,
            onClick: () => {
              setSelectedFile(null)
              setShowInfo(true)
            },
          },
        ]}
      />
      <div className="max-w-3/4 w-3/4 pl-2">
        {showInfo && <InfoViewer info={addOnInfo as AddOn} />}
        {selectedFile ? (
          <FileViewer
            filePath={selectedFile}
            modifiedFile={addOnInfo?.files?.[selectedFile] || ''}
          />
        ) : null}
      </div>
    </div>
  )
}

function App() {
  const {
    projectPath,
    output,
    addOnInfo,
    outputWithoutAddon,
    originalOptions,
    addOns,
  } = Route.useLoaderData()

  return (
    <div className="p-5">
      <Tabs defaultValue="add-on">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="add-on">Add-On</TabsTrigger>
          <TabsTrigger value="applied">Applied</TabsTrigger>
        </TabsList>
        <TabsContent value="add-on">
          <AddOnViewer addOnInfo={addOnInfo} />
        </TabsContent>
        <TabsContent value="applied">
          <AppliedAddOn
            projectPath={projectPath}
            output={output}
            addOnInfo={addOnInfo}
            outputWithoutAddon={outputWithoutAddon}
            originalOptions={
              originalOptions as Required<typeof originalOptions>
            }
            addOns={addOns}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
