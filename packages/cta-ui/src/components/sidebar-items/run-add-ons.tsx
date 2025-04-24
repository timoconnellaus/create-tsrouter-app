import { useState } from 'react'
import { useStore } from '@tanstack/react-store'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { applicationMode, selectedAddOns } from '@/store/project'

export default function RunAddOns() {
  const currentlySelectedAddOns = useStore(selectedAddOns)
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')
  const [finished, setFinished] = useState(false)

  const mode = useStore(applicationMode)

  if (mode !== 'add') {
    return null
  }

  async function onAddToApp() {
    setIsRunning(true)
    setOutput('')

    const streamingReq = await fetch('/api/add-to-app', {
      method: 'POST',
      body: JSON.stringify({
        addOns: selectedAddOns.state.map((addOn) => addOn.id),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const reader = streamingReq.body?.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const result = await reader?.read()
      if (result?.done) break
      setOutput((s) => s + decoder.decode(result?.value))
    }
    setFinished(true)
  }

  return (
    <div>
      <Dialog open={isRunning}>
        <DialogContent
          className="sm:min-w-[425px] sm:max-w-fit"
          hideCloseButton
        >
          <DialogHeader>
            <DialogTitle>Adding Add-Ons</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <pre>{output}</pre>
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={async () => {
                await fetch('/api/shutdown', {
                  method: 'POST',
                })
                window.close()
              }}
              disabled={!finished}
            >
              Exit This Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-2">
        <Button
          variant="default"
          onClick={onAddToApp}
          disabled={currentlySelectedAddOns.length === 0 || isRunning}
          className="w-full"
        >
          Add These Add-Ons To Your App
        </Button>
      </div>
    </div>
  )
}
