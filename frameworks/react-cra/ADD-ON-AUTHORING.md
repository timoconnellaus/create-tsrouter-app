# Add-on Authoring for the React CRA Template System

# Available Integrations

These are the available integration points for the React CRA Template System.

## header-user

Integrates into the `Header` component shared by all routes. These components are placed in the right hand side of the header bar.

The code is always integrated into the `src/components/Header.(tsx|jsx)` file.

### Examples

Code in `assets/src/components/my-header.tsx`:

```ts
export default function MyHeader() {
  return <div>Header User</div>
}
```

Configuration in `info.json`:

```json
"integrations": [
  {
    "type": "header-user",
    "jsName": "MyHeader",
    "path": "src/components/my-header.tsx"
  },
]
```

## layout

Handles injecting a component into the layout of the page:

The code is integrated into these locations with these application architectures:

- `code-router` - In the `src/main.tsx` (or `src/main.jsx`) file
- `file-router` - In the `src/__root.tsx` file
- `file-router` with `start` - In the `src/main.tsx` file

### Examples

Code in `assets/src/components/my-layout.tsx`:

```ts
export default function MyLayout() {
  return <div>Hi from MyLayout!</div>
}
```

Configuration in `info.json`:

```json
"integrations": [
  {
    "type": "layout",
    "jsName": "MyLayout",
    "path": "src/components/my-layout.tsx"
  },
]
```

## provider

Handles placing UI style provider wrappers into the right spot in three different applicatin setups:

The code is integrated into these locations with these application architectures:

- `code-router` - In the `src/main.tsx` (or `src/main.jsx`) file
- `file-router` - In the `src/__root.tsx` file
- `file-router` with `start` - In the `src/main.tsx` file

### Examples

Code in `assets/src/components/my-provider.tsx`:

```ts
export default function MyProvider({ children }: { children: React.ReactNode }) {
  return <SomeKindOfProvider>{children}</SomeKindOfProvider>
}
```

Configuration in `info.json`:

```json
"integrations": [
  {
    "type": "provider",
    "jsName": "MyProvider",
    "path": "src/components/my-provider.tsx"
  },
]
```

## root-provider

This is a complex integration that handles both a provider component and context. The only example we have of this is the integration for TanStack Query.

The code is integrated into these locations with these application architectures:

- `code-router` - In the `src/main.tsx` (or `src/main.jsx`) file
- `file-router` - In the `src/__root.tsx` file
- `file-router` with `start` - In the `src/main.tsx` file

### Examples

Code in `assets/src/components/my-root-provider.tsx`:

```ts
export function getContext() {
  return {
    someAdditionalContext: {
      someAdditionalContextValue: "someAdditionalContextValue",
    },
  }
}

export default function MyRootProvider({ children }: { children: React.ReactNode }) {
  return <SomeKindOfProvider>{children}</SomeKindOfProvider>
}
```

Configuration in `info.json`:

```json
"integrations": [
  {
    "type": "root-provider",
    "jsName": "MyRootProvider",
    "path": "src/components/my-root-provider.tsx"
  },
]
```
