import { useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { TrashIcon } from 'lucide-react'

import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  applicationMode,
  projectStarter,
  removeStarter,
  setStarter,
} from '@/store/project'

export default function Starter() {
  const [url, setUrl] = useState('')
  const [open, setOpen] = useState(false)

  const mode = useStore(applicationMode)

  const starterName = useStore(projectStarter)?.name

  if (mode !== 'setup') {
    return null
  }

  async function onImport() {
    const response = await fetch(`/api/load-starter?url=${url}`)
    const data = await response.json()

    if (!data.error) {
      setStarter(data)
      setOpen(false)
    } else {
      toast.error('Failed to load starter', {
        description: data.error,
      })
    }
  }

  return (
    <>
      {starterName && (
        <div className="text-md mb-4">
          <Button
            variant="outline"
            size="sm"
            className="mr-2"
            onClick={() => {
              removeStarter()
            }}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
          <span className="font-bold">Starter: </span>
          {starterName}
        </div>
      )}
      <div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            setUrl('')
            setOpen(true)
          }}
        >
          Set Starter
        </Button>
        <Dialog modal open={open}>
          <DialogContent className="sm:min-w-[425px] sm:max-w-fit">
            <DialogHeader>
              <DialogTitle>Set Starter</DialogTitle>
            </DialogHeader>
            <div>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/myorg/myproject/starter.json"
                className="min-w-lg w-full"
              />
            </div>
            <DialogFooter>
              <Button onClick={onImport}>Load</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
