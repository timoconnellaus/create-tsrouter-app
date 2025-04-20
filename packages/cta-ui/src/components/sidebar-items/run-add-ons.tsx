import { Button } from '@/components/ui/button'
import { closeApp } from '@/lib/add-to-app-server-fn'
import { selectedAddOns } from '@/store/project'

export default function RunAddOns() {
  return (
    <div>
      <Button
        variant="outline"
        onClick={async () => {
          await fetch('/api/add-add-ons', {
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
      >
        Run Add-Ons
      </Button>
    </div>
  )
}
