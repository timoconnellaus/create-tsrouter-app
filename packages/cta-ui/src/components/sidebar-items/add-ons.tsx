import { useMemo, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { InfoIcon } from 'lucide-react'

import type { AddOnInfo } from '@/types'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

import { addOnState, availableAddOns, toggleAddOn } from '@/store/project'

import ImportCustomAddOn from '@/components/custom-add-on-dialog'
import AddOnInfoDialog from '@/components/add-on-info-dialog'

const addOnTypeLabels: Record<string, string> = {
  toolchain: 'Toolchain',
  'add-on': 'Add-on',
  example: 'Example',
}

export default function SelectedAddOns() {
  const addOns = useAtomValue(availableAddOns)
  const addOnStatus = useAtomValue(addOnState)
  const toggle = useSetAtom(toggleAddOn)

  const sortedAddOns = useMemo(() => {
    return addOns.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  }, [addOns])

  const [infoAddOn, setInfoAddOn] = useState<AddOnInfo>()

  return (
    <>
      <AddOnInfoDialog
        addOn={infoAddOn}
        onClose={() => setInfoAddOn(undefined)}
      />
      {Object.keys(addOnTypeLabels).map((type) => (
        <div key={type}>
          {sortedAddOns.filter((addOn) => addOn.type === type).length > 0 && (
            <h1 className="text-sm text-center border-b-2">
              {addOnTypeLabels[type]}
            </h1>
          )}
          <div className="flex flex-row flex-wrap">
            {sortedAddOns
              .filter((addOn) => addOn.type === type)
              .map((addOn) => (
                <div
                  key={addOn.id}
                  className="w-1/2 flex flex-row justify-between pr-4"
                >
                  <div className="p-1 flex flex-row items-center">
                    <Switch
                      id={addOn.id}
                      checked={addOnStatus[addOn.id].selected}
                      disabled={!addOnStatus[addOn.id].enabled}
                      onCheckedChange={() => {
                        toggle(addOn.id)
                      }}
                    />
                    <Label
                      htmlFor={addOn.id}
                      className="pl-2 font-semibold text-gray-300"
                    >
                      {addOn.smallLogo && (
                        <img
                          src={`data:image/svg+xml,${encodeURIComponent(
                            addOn.smallLogo,
                          )}`}
                          alt={addOn.name}
                          className="w-5"
                        />
                      )}
                      {addOn.name}
                    </Label>
                    <InfoIcon
                      className="ml-2 w-4 text-gray-600"
                      onClick={() => setInfoAddOn(addOn)}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
      <div className="mt-4">
        <ImportCustomAddOn />
      </div>
    </>
  )
}
