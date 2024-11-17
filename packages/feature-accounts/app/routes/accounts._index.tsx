import { Ui } from '@remix-nx-monorepo/ui';
import type { Route } from './+types/accounts._index';

export function loader({ params }: Route.LoaderArgs) {
  return { planet: 'world', date: new Date(), fn: () => 1 };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <p>Hello {loaderData.planet}, from accounts feature</p>
      <Ui />
    </>
  );
}
