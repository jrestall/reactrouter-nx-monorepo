import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';
import { Ui } from '@remix-nx-monorepo/ui';

export const meta: MetaFunction = () => {
  return [
    { title: 'Monorepo Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}>
      <h1>Welcome to Remix Monorepo</h1>
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
