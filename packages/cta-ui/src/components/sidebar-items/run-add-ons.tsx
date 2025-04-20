import { useStore } from '@tanstack/react-store'

import { Button } from '@/components/ui/button'
import { selectedAddOns } from '@/store/project'

export default function RunAddOns() {
  const currentlySelectedAddOns = useStore(selectedAddOns)

  return (
    <div>
      <Button
        variant="default"
        onClick={async () => {
          await fetch('/api/add-to-app', {
            method: 'POST',
            body: JSON.stringify({
              addOns: selectedAddOns.state.map((addOn) => addOn.id),
            }),
            headers: {
              'Content-Type': 'application/json',
            },
          })
          // await closeApp()
          // window.close()
        }}
        disabled={currentlySelectedAddOns.length === 0}
        className="w-full"
      >
        Run Add-Ons
      </Button>
    </div>
  )
}
