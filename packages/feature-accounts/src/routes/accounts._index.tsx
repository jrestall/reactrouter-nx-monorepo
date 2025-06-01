import { Ui } from '@reactrouter-nx-monorepo/ui';
import type { Route } from './+types/accounts._index';

export function loader({ params }: Route.LoaderArgs) {
  return { account: 'bob', date: new Date(), fn: () => 1, time: new Date().toISOString() };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <p>Hello {loaderData.account}, from accounts feature</p>
      <Ui />
    </>
  );
}
