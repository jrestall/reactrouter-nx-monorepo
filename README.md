## React Router NX Monorepo

An example monorepo setup using NX and React Router that supports splitting features into shared packages for enforcing module boundaries, domain and team separation, sharing functionality between apps or publishing as feature packages.

Includes a custom Nx plugin to typegen routes in the shared packages on route file changes. Uses a Nx v21 continuous task to watch for file changes and run an inferred `typegen` task on any changed projects.

## Get Started

```
pnpm i
pnpm nx dev my-app 
```
