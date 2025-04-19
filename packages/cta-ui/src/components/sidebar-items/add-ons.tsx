import { useMemo } from 'react'
import { useStore } from '@tanstack/react-store'

import { Button } from '@/components/ui/button'

import { availableAddOns, selectedAddOns } from '@/store/project'

import { cn } from '@/lib/utils'

export function SelectedAddOns() {
  const addOns = useStore(availableAddOns)
  const selected = useStore(selectedAddOns)

  const sortedAddOns = useMemo(() => {
    return addOns.sort((a, b) => {
      return a.name.localeCompare(b.name)
    })
  }, [addOns])

  return (
    <>
      <h1 className="text-2xl font-bold">Add-ons</h1>
      <div className="flex flex-col gap-2">
        {sortedAddOns.map((addOn) => (
          <Button
            key={addOn.id}
            variant="outline"
            size="lg"
            className={cn('flex flex-col gap-0 align-start h-fit py-3 w-full')}
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
        ))}
      </div>
    </>
  )
}
