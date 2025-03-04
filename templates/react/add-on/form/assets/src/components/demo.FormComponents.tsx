import { useStore } from '@tanstack/react-form'
import { useFieldContext, useFormContext } from '../hooks/demo.form-context'

export function SubscribeButton({ label }: { label: string }) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <button
          disabled={isSubmitting}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {label}
        </button>
      )}
    </form.Subscribe>
  )
}

export function TextField({
  label,
  placeholder,
}: {
  label: string
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <label htmlFor={label} className="block font-bold mb-1 text-xl">
        {label}
        <input
          value={field.state.value}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>
      {errors.map((error: string) => (
        <div key={error} className="text-red-500 mt-1 font-bold">
          {error}
        </div>
      ))}
    </div>
  )
}

export function TextArea({
  label,
  rows = 3,
}: {
  label: string
  rows?: number
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <label htmlFor={label} className="block font-bold mb-1 text-xl">
        {label}
        <textarea
          value={field.state.value}
          onBlur={field.handleBlur}
          rows={rows}
          onChange={(e) => field.handleChange(e.target.value)}
          className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </label>
      {errors.map((error: string) => (
        <div key={error} className="text-red-500 mt-1 font-bold">
          {error}
        </div>
      ))}
    </div>
  )
}

export function Select({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div>
      <label htmlFor={label} className="block font-bold mb-1 text-xl">
        {label}
      </label>
      <select
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {children}
      </select>
      {errors.map((error: string) => (
        <div key={error} className="text-red-500 mt-1 font-bold">
          {error}
        </div>
      ))}
    </div>
  )
}
