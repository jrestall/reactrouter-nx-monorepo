## React Router NX Monorepo

An example monorepo setup using NX and React Router that supports splitting features into shared packages for enforcing module boundaries, domain and team separation, sharing functionality between apps or publishing as feature packages. Aimed at very large projects that need the additional modularity and vertical feature slicing to scale successfully.

Please see the route configuration at `apps/my-app/app/routes.ts`.

Includes a custom Vite plugin at `tools/plugins/package-typegen-plugin` that watches for changes to package routes and automatically runs `react-router typegen` on changes. This is necessary as react router only supports typegen for routes under the `apps` directory.

Also includes code for a custom Nx plugin at `tools/plugins/typegen` to typegen routes in the shared packages on route file changes. I prefer the Vite plugin approach however since it runs in the same process. Uses a Nx v21 continuous task to watch for file changes and run an inferred `typegen` task on any changed projects.

## Get Started

```
pnpm i
pnpm nx dev my-app 
```
