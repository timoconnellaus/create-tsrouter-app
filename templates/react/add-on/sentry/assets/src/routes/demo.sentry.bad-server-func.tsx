import * as fs from 'node:fs/promises'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'

export const Route = createFileRoute('/demo/sentry/bad-server-func')({
  component: RouteComponent,
})

const badServerFunc = createServerFn({
  method: 'GET',
}).handler(async () => {
  await fs.readFile('./doesnt-exist', 'utf-8')
  return true
})

function RouteComponent() {
  return (
    <div className="p-4">
      <button
        onClick={async () => {
          await badServerFunc()
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        I Don't Work, And That Should Fire an Error to Sentry
      </button>
    </div>
  )
}
