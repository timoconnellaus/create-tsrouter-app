import { useCallback, useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useQuery } from '@tanstack/react-query'

import { getAddOnStatus } from './add-ons'

import type { Mode, SerializedOptions } from '@tanstack/cta-engine'

import type { AddOnInfo, DryRunOutput, StarterInfo } from '@/types.js'
import { dryRunAddToApp, dryRunCreateApp, loadInitialData } from '@/lib/api'

const useInitialData = () =>
  useQuery({
    queryKey: ['initial-data'],
    queryFn: async () => loadInitialData(),
    initialData: {
      options: {
        framework: 'react-cra',
        mode: 'file-router',
        projectName: 'my-application',
        targetDir: 'my-application',
        typescript: true,
        tailwind: true,
        git: true,
        chosenAddOns: [],
        packageManager: 'pnpm',
      },
      localFiles: {},
      output: {
        files: {},
        commands: [],
        deletedFiles: [],
      },
      addOns: {
        'code-router': [],
        'file-router': [],
      },
      applicationMode: 'none',
      forcedRouterMode: undefined,
      forcedAddOns: [],
      registry: undefined,
    },
  })

const useForcedRouterMode = () => useInitialData().data.forcedRouterMode
const useForcedAddOns = () => useInitialData().data.forcedAddOns

export const useRegistry = () => useInitialData().data.registry

export const useProjectLocalFiles = () => useInitialData().data.localFiles
export const useOriginalOutput = () => useInitialData().data.output
export const useOriginalSelectedAddOns = () =>
  useInitialData().data.options.chosenAddOns
export const useApplicationMode = () => useInitialData().data.applicationMode
export const useReady = () => useInitialData().isFetched
export const useCodeRouterAddOns = () =>
  useInitialData().data.addOns['code-router']
export const useFileRouterAddOns = () =>
  useInitialData().data.addOns['file-router']

export const useProjectOptions = create<SerializedOptions>(() => ({
  framework: 'react-cra',
  mode: 'file-router',
  projectName: 'my-app',
  targetDir: 'my-app',
  typescript: true,
  tailwind: true,
  git: true,
  chosenAddOns: [],
  packageManager: 'pnpm',
}))

const useApplicationSettings = create<{
  includeFiles: Array<string>
}>(() => ({
  includeFiles: ['unchanged', 'added', 'modified', 'deleted', 'overwritten'],
}))

const useMutableAddOns = create<{
  userSelectedAddOns: Array<string>
  customAddOns: Array<AddOnInfo>
}>(() => ({
  userSelectedAddOns: [],
  customAddOns: [],
}))

export const useProjectStarter = create<{
  projectStarter: StarterInfo | undefined
}>(() => ({
  projectStarter: undefined,
}))

export function addCustomAddOn(addOn: AddOnInfo) {
  useMutableAddOns.setState((state) => ({
    customAddOns: [...state.customAddOns, addOn],
  }))
  if (addOn.modes.includes(useProjectOptions.getState().mode)) {
    useMutableAddOns.setState((state) => ({
      userSelectedAddOns: [...state.userSelectedAddOns, addOn.id],
    }))
  }
}

export function useAddOns() {
  const routerMode = useRouterMode()
  const originalSelectedAddOns = useOriginalSelectedAddOns()
  const codeRouterAddOns = useCodeRouterAddOns()
  const fileRouterAddOns = useFileRouterAddOns()
  const forcedAddOns = useForcedAddOns()
  const { userSelectedAddOns, customAddOns } = useMutableAddOns()
  const projectStarter = useProjectStarter().projectStarter

  const availableAddOns = useMemo(() => {
    const baseAddOns =
      routerMode === 'code-router' ? codeRouterAddOns : fileRouterAddOns
    return [
      ...baseAddOns,
      ...customAddOns.filter((addOn) => addOn.modes.includes(routerMode)),
    ]
  }, [routerMode, codeRouterAddOns, fileRouterAddOns, customAddOns])

  const addOnState = useMemo(() => {
    const originalAddOns: Set<string> = new Set()
    for (const addOn of projectStarter?.dependsOn || []) {
      originalAddOns.add(addOn)
    }
    for (const addOn of originalSelectedAddOns) {
      originalAddOns.add(addOn)
    }
    for (const addOn of forcedAddOns) {
      originalAddOns.add(addOn)
    }
    return getAddOnStatus(
      availableAddOns,
      userSelectedAddOns,
      Array.from(originalAddOns),
    )
  }, [
    availableAddOns,
    userSelectedAddOns,
    originalSelectedAddOns,
    projectStarter?.dependsOn,
    forcedAddOns,
  ])

  const chosenAddOns = useMemo(() => {
    const addOns = new Set(
      Object.keys(addOnState).filter((addOn) => addOnState[addOn].selected),
    )
    for (const addOn of forcedAddOns) {
      addOns.add(addOn)
    }
    return Array.from(addOns)
  }, [addOnState, forcedAddOns])

  const toggleAddOn = useCallback(
    (addOnId: string) => {
      if (addOnState[addOnId] && addOnState[addOnId].enabled) {
        if (addOnState[addOnId].selected) {
          useMutableAddOns.setState((state) => ({
            userSelectedAddOns: state.userSelectedAddOns.filter(
              (addOn) => addOn !== addOnId,
            ),
          }))
        } else {
          useMutableAddOns.setState((state) => ({
            userSelectedAddOns: [...state.userSelectedAddOns, addOnId],
          }))
        }
      }
    },
    [addOnState],
  )

  return {
    toggleAddOn,
    chosenAddOns,
    availableAddOns,
    userSelectedAddOns,
    originalSelectedAddOns,
    addOnState,
  }
}

const useHasProjectStarter = () =>
  useProjectStarter((state) => state.projectStarter === undefined)

export const useModeEditable = () => {
  const forcedRouterMode = useForcedRouterMode()
  const hasProjectStarter = useHasProjectStarter()
  return !forcedRouterMode && hasProjectStarter
}

export const useTypeScriptEditable = () => {
  const hasProjectStarter = useHasProjectStarter()
  const routerMode = useRouterMode()
  return hasProjectStarter && routerMode === 'code-router'
}

export const useTailwindEditable = () => {
  const hasProjectStarter = useHasProjectStarter()
  const routerMode = useRouterMode()
  return hasProjectStarter && routerMode === 'code-router'
}

export const useProjectName = () =>
  useProjectOptions((state) => state.projectName)

export const useRouterMode = () => {
  const forcedRouterMode = useForcedRouterMode()
  const userMode = useProjectOptions((state) => state.mode)
  return forcedRouterMode || userMode
}

export function useFilters() {
  const includedFiles = useApplicationSettings((state) => state.includeFiles)

  const toggleFilter = useCallback((filter: string) => {
    useApplicationSettings.setState((state) => ({
      includeFiles: state.includeFiles.includes(filter)
        ? state.includeFiles.filter((f) => f !== filter)
        : [...state.includeFiles, filter],
    }))
  }, [])

  return {
    includedFiles,
    toggleFilter,
  }
}

export function useDryRun() {
  const applicationMode = useApplicationMode()
  const projectOptions = useProjectOptions()
  const { userSelectedAddOns, chosenAddOns } = useAddOns()
  const projectStarter = useProjectStarter().projectStarter

  const { data: dryRunOutput } = useQuery<DryRunOutput>({
    queryKey: [
      'dry-run',
      applicationMode,
      JSON.stringify(projectOptions),
      JSON.stringify(userSelectedAddOns),
      projectStarter?.url,
    ],
    queryFn: async () => {
      if (applicationMode === 'none') {
        return {
          files: {},
          commands: [],
          deletedFiles: [],
        }
      } else if (applicationMode === 'setup') {
        return dryRunCreateApp(projectOptions, chosenAddOns, projectStarter)
      } else {
        return dryRunAddToApp(userSelectedAddOns)
      }
    },
    initialData: {
      files: {},
      commands: [],
      deletedFiles: [],
    },
  })

  return dryRunOutput
}

type StartupDialogState = {
  open: boolean
  dontShowAgain: boolean
  setOpen: (open: boolean) => void
  setDontShowAgain: (dontShowAgain: boolean) => void
}

export const useStartupDialog = create<StartupDialogState>()(
  persist(
    (set) => ({
      open: false,
      dontShowAgain: false,
      setOpen: (open) => set({ open }),
      setDontShowAgain: (dontShowAgain) => set({ dontShowAgain }),
    }),
    {
      name: 'startup-dialog',
      partialize: (state) => ({
        dontShowAgain: state.dontShowAgain,
      }),
      merge: (persistedState: unknown, currentState) => {
        if (
          persistedState &&
          (persistedState as { dontShowAgain?: boolean }).dontShowAgain
        ) {
          currentState.open = false
        } else {
          currentState.open = true
        }
        return currentState
      },
    },
  ),
)

export const setProjectName = (projectName: string) =>
  useProjectOptions.setState({
    projectName,
  })

export const setRouterMode = (mode: Mode) =>
  useProjectOptions.setState({
    mode,
  })

export function setTypeScript(typescript: boolean) {
  useProjectOptions.setState({
    typescript,
  })
}

export function setTailwind(tailwind: boolean) {
  useProjectOptions.setState({
    tailwind,
  })
}

export function setProjectStarter(starter: StarterInfo | undefined) {
  useProjectStarter.setState(() => ({
    projectStarter: starter,
  }))
}
