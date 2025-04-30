import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StartersCarousel } from '@/components/starters-carousel'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  setProjectStarter,
  useApplicationMode,
  useRegistry,
  useStartupDialog,
} from '@/store/project'
import { loadRemoteStarter } from '@/lib/api'

export default function StartupDialog() {
  const mode = useApplicationMode()
  const registry = useRegistry()
  const { open, setOpen, dontShowAgain, setDontShowAgain } = useStartupDialog()

  if (mode !== 'setup' || !registry) {
    return null
  }

  async function onImport(registryUrl: string) {
    const data = await loadRemoteStarter(registryUrl)

    if ('error' in data) {
      toast.error('Failed to load starter', {
        description: data.error,
      })
    } else {
      setProjectStarter(data)
      setOpen(false)
    }
  }

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:min-w-[425px] sm:max-w-fit">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Would you like to use a starter project?
          </DialogTitle>
        </DialogHeader>
        {registry?.starters && (
          <div>
            <StartersCarousel onImport={onImport} />
          </div>
        )}
        <DialogFooter className="flex sm:justify-between w-full">
          <div className="flex items-center gap-2">
            <Switch
              id="show-startup-dialog"
              checked={dontShowAgain}
              onCheckedChange={setDontShowAgain}
            />
            <Label htmlFor="show-startup-dialog">Don't show this again</Label>
          </div>
          <Button onClick={() => setOpen(false)}>
            No, I want to start from scratch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
