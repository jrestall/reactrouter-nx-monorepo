import { Ui } from '@remix-nx-monorepo/ui';

import type { Route } from './+types/transfers._index';

export function loader({ params }: Route.LoaderArgs) {
  return { planet: 'world', date: new Date(), fn: () => 1 };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <p>Hello {loaderData.planet}, from transfers feature </p>
      <Ui />
    </>
  );
}
