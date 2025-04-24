import { useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { TicketPlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { customAddOns, projectOptions, toggleAddOn } from '@/store/project'

export default function CustomAddOnDialog() {
  const [url, setUrl] = useState('')
  const [open, setOpen] = useState(false)

  const mode = useAtomValue(projectOptions).mode
  const setCustomAddOns = useSetAtom(customAddOns)
  const toggle = useSetAtom(toggleAddOn)

  async function onImport() {
    const response = await fetch(`/api/load-remote-add-on?url=${url}`)
    const data = await response.json()

    if (!data.error) {
      setCustomAddOns((state) => [...state, data])
      if (data.modes.includes(mode)) {
        toggle(data.id)
      }
      setOpen(false)
    } else {
      toast.error('Failed to load add-on', {
        description: data.error,
      })
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          setUrl('')
          setOpen(true)
        }}
      >
        <TicketPlusIcon className="w-4 h-4" />
        Import Custom Add-On
      </Button>
      <Dialog modal open={open}>
        <DialogContent className="sm:min-w-[425px] sm:max-w-fit">
          <DialogHeader>
            <DialogTitle>Import Custom Add-On</DialogTitle>
          </DialogHeader>
          <div>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/myorg/myproject/add-on.json"
              className="min-w-lg w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onImport()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button onClick={onImport}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
