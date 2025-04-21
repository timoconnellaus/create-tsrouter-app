import { useMemo } from 'react'
import { useStore } from '@tanstack/react-store'

import { Button } from '@/components/ui/button'

import { availableAddOns, selectedAddOns } from '@/store/project'

import { cn } from '@/lib/utils'

import ImportCustomAddOn from '@/components/custom-add-on-dialog'

const addOnTypeLabels: Record<string, string> = {
  toolchain: 'Toolchain',
  'add-on': 'Add-on',
  example: 'Example',
}

export default function SelectedAddOns() {
  const addOns = useStore(availableAddOns)
  const selected = useStore(selectedAddOns)

  const sortedAddOns = useMemo(() => {
    return addOns.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  }, [addOns])

  return (
    <>
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
                <div className="p-1 w-1/2" key={addOn.id}>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn('w-full')}
                    onClick={() => {
                      selectedAddOns.setState((state) => {
                        if (state.some((a) => a.id === addOn.id)) {
                          return state.filter((a) => a.id !== addOn.id)
                        }
                        return [...state, addOn]
                      })
                    }}
                    style={{
                      backgroundColor: selected.some((a) => a.id === addOn.id)
                        ? 'green'
                        : 'transparent',
                    }}
                  >
                    <div className="text-md font-bold">{addOn.name}</div>
                  </Button>
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
