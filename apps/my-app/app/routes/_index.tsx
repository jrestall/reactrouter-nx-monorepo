import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';
import { Ui } from '@remix-nx-monorepo/ui';
import type { Route } from './+types/_index';

export const meta: MetaFunction = () => {
  return [
    { title: 'Monorepo Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export function loader() {
  return { test: 'hi' };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
      <h1>Welcome to Remix Monorepo</h1>
      {loaderData.test}
      <ul>
        <li>
          <Link to="/transfers">SHARED TRANSFERS FEATURE</Link>
        </li>
        <li>
          <Link to="/accounts">SHARED ACCOUNTS FEATURE</Link>
        </li>
      </ul>
      <p>Shared package works in app folder route:</p>
      <Ui />
    </div>
  );
}
