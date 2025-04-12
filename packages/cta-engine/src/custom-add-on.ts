import { readFile, readdir } from 'node:fs/promises'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'

import { createMemoryEnvironment } from './environment.js'
import { createApp } from './create-app.js'
import { readConfigFile } from './config-file.js'
import { finalizeAddOns } from './add-ons.js'
import { readFileHelper } from './file-helper.js'

import type { Environment, Framework, Options } from './types.js'
import type { PersistedOptions } from './config-file.js'

type AddOnMode = 'add-on' | 'starter'

const INFO_FILE: Record<AddOnMode, string> = {
  'add-on': '.add-on/info.json',
  starter: 'starter-info.json',
}
const COMPILED_FILE: Record<AddOnMode, string> = {
  'add-on': 'add-on.json',
  starter: 'starter.json',
}

const ADD_ON_DIR = '.add-on'
const ASSETS_DIR = 'assets'

const IGNORE_FILES = [
  ADD_ON_DIR,
  'node_modules',
  'dist',
  'build',
  '.git',
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  'bun.lock',
  'deno.lock',
  'add-on.json',
  'add-on-info.json',
  'package.json',
]

const ADD_ON_IGNORE_FILES: Array<string> = [
  'main.jsx',
  'App.jsx',
  'main.tsx',
  'App.tsx',
  'routeTree.gen.ts',
]

function templatize(routeCode: string, routeFile: string) {
  let code = routeCode

  // Replace the import
  code = code.replace(
    /import { createFileRoute } from '@tanstack\/react-router'/g,
    `import { <% if (fileRouter) { %>createFileRoute<% } else { %>createRoute<% } %> } from '@tanstack/react-router'`,
  )

  // Extract route path and definition, then transform the route declaration
  const routeMatch = code.match(
    /export\s+const\s+Route\s*=\s*createFileRoute\(['"]([^'"]+)['"]\)\s*\(\{([^}]+)\}\)/,
  )

  let path = ''

  if (routeMatch) {
    const fullMatch = routeMatch[0]
    path = routeMatch[1]
    const routeDefinition = routeMatch[2]
    code = code.replace(
      fullMatch,
      `<% if (codeRouter) { %>
import type { RootRoute } from '@tanstack/react-router'
<% } else { %>
export const Route = createFileRoute('${path}')({${routeDefinition}})
<% } %>`,
    )

    code += `
<% if (codeRouter) { %>
export default (parentRoute: RootRoute) => createRoute({
  path: '${path}',
  ${routeDefinition}
  getParentRoute: () => parentRoute,
})
<% } %>
`
  } else {
    console.error(`No route found in the file: ${routeFile}`)
  }

  const name = basename(path)
    .replace('.tsx', '')
    .replace(/^demo/, '')
    .replace('.', ' ')
    .trim()

  return { url: path, code, name }
}

export async function createAppOptionsFromPersisted(
  json: PersistedOptions,
): Promise<Required<Options>> {
  return {
    ...json,
    chosenAddOns: await finalizeAddOns(
      json.framework as Framework,
      json.mode as string,
      [...json.existingAddOns],
    ),
  } as Required<Options>
}

async function runCreateApp(options: Required<Options>) {
  const { environment, output } = createMemoryEnvironment()
  await createApp(options, {
    silent: true,
    environment,
    cwd: process.cwd(),
    name: 'create-tsrouter-app',
  })
  return output
}

async function recursivelyGatherFiles(
  path: string,
  files: Record<string, string>,
) {
  const dirFiles = await readdir(path, { withFileTypes: true })
  for (const file of dirFiles) {
    if (file.isDirectory()) {
      await recursivelyGatherFiles(resolve(path, file.name), files)
    } else {
      files[resolve(path, file.name)] = readFileHelper(resolve(path, file.name))
    }
  }
}

async function compareFiles(
  path: string,
  ignore: Array<string>,
  original: Record<string, string>,
  changedFiles: Record<string, string>,
) {
  const files = await readdir(path, { withFileTypes: true })
  for (const file of files) {
    const filePath = `${path}/${file.name}`
    if (!ignore.includes(file.name)) {
      if (file.isDirectory()) {
        await compareFiles(filePath, ignore, original, changedFiles)
      } else {
        const contents = (await readFile(filePath)).toString()
        const absolutePath = resolve(process.cwd(), filePath)
        if (!original[absolutePath] || original[absolutePath] !== contents) {
          changedFiles[filePath] = contents
        }
      }
    }
  }
}

export async function initAddOn(mode: AddOnMode, environment: Environment) {
  const persistedOptions = await readConfigFile(process.cwd())
  if (!persistedOptions) {
    environment.error(
      'There is no .cta.json file in your project.',
      `This is probably because this was created with an older version of create-tsrouter-app.`,
    )
    return
  }

  if (mode === 'add-on') {
    if (persistedOptions.mode !== 'file-router') {
      environment.error(
        'This project is not using file-router mode.',
        'To create an add-on, the project must be created with the file-router mode.',
      )
      return
    }
    if (!persistedOptions.tailwind) {
      environment.error(
        'This project is not using Tailwind CSS.',
        'To create an add-on, the project must be created with Tailwind CSS.',
      )
      return
    }
    if (!persistedOptions.typescript) {
      environment.error(
        'This project is not using TypeScript.',
        'To create an add-on, the project must be created with TypeScript.',
      )
      return
    }
  }

  const info = existsSync(INFO_FILE[mode])
    ? JSON.parse((await readFile(INFO_FILE[mode])).toString())
    : {
        name: `${persistedOptions.projectName}-${mode}`,
        version: '0.0.1',
        description: mode === 'add-on' ? 'Add-on' : 'Project starter',
        author: 'Jane Smith <jane.smith@example.com>',
        license: 'MIT',
        link: `https://github.com/jane-smith/${persistedOptions.projectName}-${mode}`,
        command: {},
        shadcnComponents: [],
        framework: persistedOptions.framework,
        templates: [persistedOptions.mode],
        routes: [],
        warning: '',
        variables: {},
        phase: 'add-on',
        type: mode,
        packageAdditions: {
          scripts: {},
          dependencies: {},
          devDependencies: {},
        },
      }

  const compiledInfo = JSON.parse(JSON.stringify(info))

  const originalOutput = await runCreateApp(
    await createAppOptionsFromPersisted(persistedOptions),
  )

  const originalPackageJson = JSON.parse(
    originalOutput.files[resolve(process.cwd(), 'package.json')],
  )
  const currentPackageJson = JSON.parse(
    (await readFile('package.json')).toString(),
  )

  for (const script of Object.keys(currentPackageJson.scripts)) {
    if (
      originalPackageJson.scripts[script] !== currentPackageJson.scripts[script]
    ) {
      info.packageAdditions.scripts[script] = currentPackageJson.scripts[script]
    }
  }

  const dependencies: Record<string, string> = {}
  for (const dependency of Object.keys(currentPackageJson.dependencies)) {
    if (
      originalPackageJson.dependencies[dependency] !==
      currentPackageJson.dependencies[dependency]
    ) {
      dependencies[dependency] = currentPackageJson.dependencies[dependency]
    }
  }
  info.packageAdditions.dependencies = dependencies

  const devDependencies: Record<string, string> = {}
  for (const dependency of Object.keys(currentPackageJson.devDependencies)) {
    if (
      originalPackageJson.devDependencies[dependency] !==
      currentPackageJson.devDependencies[dependency]
    ) {
      devDependencies[dependency] =
        currentPackageJson.devDependencies[dependency]
    }
  }
  info.packageAdditions.devDependencies = devDependencies

  // Find altered files
  const changedFiles: Record<string, string> = {}
  await compareFiles('.', IGNORE_FILES, originalOutput.files, changedFiles)
  if (mode === 'starter') {
    compiledInfo.files = changedFiles
  } else {
    const assetsDir = resolve(ADD_ON_DIR, ASSETS_DIR)
    if (!existsSync(assetsDir)) {
      await compareFiles('.', IGNORE_FILES, originalOutput.files, changedFiles)
      for (const file of Object.keys(changedFiles).filter(
        (file) => !ADD_ON_IGNORE_FILES.includes(basename(file)),
      )) {
        mkdirSync(dirname(resolve(assetsDir, file)), {
          recursive: true,
        })
        if (file.includes('/routes/')) {
          const { url, code, name } = templatize(changedFiles[file], file)
          info.routes.push({
            url,
            name,
          })
          writeFileSync(resolve(assetsDir, `${file}.ejs`), code)
        } else {
          writeFileSync(resolve(assetsDir, file), changedFiles[file])
        }
      }
    }
    const addOnFiles: Record<string, string> = {}
    await recursivelyGatherFiles(assetsDir, addOnFiles)
    compiledInfo.files = Object.keys(addOnFiles).reduce(
      (acc, file) => {
        acc[file.replace(assetsDir, '.')] = addOnFiles[file]
        return acc
      },
      {} as Record<string, string>,
    )
  }

  compiledInfo.routes = info.routes
  compiledInfo.framework = persistedOptions.framework
  compiledInfo.addDependencies = persistedOptions.existingAddOns
  compiledInfo.packageAdditions = info.packageAdditions

  if (mode === 'starter') {
    compiledInfo.mode = persistedOptions.mode
    compiledInfo.typescript = persistedOptions.typescript
    compiledInfo.tailwind = persistedOptions.tailwind

    compiledInfo.deletedFiles = []
    for (const file of Object.keys(originalOutput.files)) {
      if (!existsSync(file)) {
        compiledInfo.deletedFiles.push(file.replace(process.cwd(), '.'))
      }
    }
  }

  if (!existsSync(resolve(INFO_FILE[mode]))) {
    mkdirSync(resolve(dirname(INFO_FILE[mode])), { recursive: true })
    writeFileSync(INFO_FILE[mode], JSON.stringify(info, null, 2))
  }

  writeFileSync(COMPILED_FILE[mode], JSON.stringify(compiledInfo, null, 2))
}
