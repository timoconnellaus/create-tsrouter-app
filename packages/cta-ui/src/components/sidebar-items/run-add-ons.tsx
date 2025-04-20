import { Button } from '@/components/ui/button'
// import { closeApp, executeAddToApp } from '@/lib/server-fns'
import { selectedAddOns } from '@/store/project'

export default function RunAddOns() {
  return (
    <div>
      <Button
        variant="outline"
        onClick={async () => {
          // await executeAddToApp({
          //   data: {
          //     addOns: selectedAddOns.state.map((addOn) => addOn.id),
          //   },
          // })
          // await closeApp()
          // window.close()
        }}
      >
        Run Add-Ons
      </Button>
    </div>
  )
}
