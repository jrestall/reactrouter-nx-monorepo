import type { Route } from './+types/contact';
import { href, Link } from 'react-router';

export default function Index({ loaderData }: Route.ComponentProps) {
  return (
    <div
      style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.8' }}
    ><Link to={href("/contact")} /></div>
  );
}
