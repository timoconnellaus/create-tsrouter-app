# Example

To run this example:

- `npm install` or `yarn` or `pnpm install` or `bun install`
- `npm start` or `yarn start` or `pnpm start` or `bun run dev`

## Styling

This project includes [Tailwind CSS](https://tailwindcss.com/), a utility-first CSS framework.

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a code based router. Which means that the routes are defined in code (in the src/main.tsx file). If you like you can also use a file based routing setup by following the [File Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing) guide.

### Adding A Route

To add a new route to your application just add another `createRoute` call to the `./src/main.tsx` file. The example below adds a new `/about`route to the root route.

```tsx
const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: () => <h1>About</h1>,
});
```

You will also need to add the route to the `routeTree` in the `./src/main.tsx` file.

```tsx
const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);
```

With this set up you should be able to navigate to `/about` and see the about page.

Of course you don't need to implement the About page in the `main.tsx` file. You can create that component in another file and import it into the `main.tsx` file, then use it in the `component` property of the `createRoute` call, like so:

```tsx
import About from "./components/About";

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: About,
});
```

That is how we have the `App` component set up with the home page.

For more information on the options you have when you are creating code based routes check out the [Code Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/code-based-routing) documentation.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from "@tanstack/react-router";
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

### Using A Layout

Layouts can be used to wrap the contents of the routes in menus, headers, footers, etc.

There is already a layout in the `src/main.tsx` file:

```tsx
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
```

You can use the React component specified in the `component` property of the `rootRoute` to wrap the contents of the routes. The `<Outlet />` component is used to render the current route within the body of the layout. For example you could add a header to the layout like so:

```tsx
const rootRoute = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people",
  loader: async () => {
    const response = await fetch("https://swapi.dev/api/people");
    return response.json();
  },
  component: () => {
    const data = useLoaderData<typeof loader>();
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    );
  },
});
```
