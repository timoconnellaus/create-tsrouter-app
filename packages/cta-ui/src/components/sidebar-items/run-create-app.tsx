import { useState } from 'react'
import { useAtomValue } from 'jotai'
import { HammerIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  applicationMode,
  projectOptions,
  projectStarter,
  selectedAddOns,
} from '@/store/project'

export default function RunCreateApp() {
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')
  const [finished, setFinished] = useState(false)

  const mode = useAtomValue(applicationMode)
  const options = useAtomValue(projectOptions)
  const selAddOns = useAtomValue(selectedAddOns)
  const projStarter = useAtomValue(projectStarter)

  if (mode !== 'setup') {
    return null
  }

  async function onAddToApp() {
    setIsRunning(true)
    setOutput('')

    const streamingReq = await fetch('/api/create-app', {
      method: 'POST',
      body: JSON.stringify({
        options: {
          ...options,
          chosenAddOns: selAddOns.map((addOn) => addOn.id),
          starter: projStarter?.url || undefined,
        },
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
            <DialogTitle>Creating Your Application</DialogTitle>
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
          disabled={isRunning}
          className="w-full"
        >
          <HammerIcon className="w-4 h-4" />
          Build Your App
        </Button>
      </div>
    </div>
  )
}
