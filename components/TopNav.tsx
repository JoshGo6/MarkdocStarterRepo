import React from 'react';
import Link from 'next/link';
import { VersionSelector } from './VersionSelector';

export function TopNav({children}) {
  return (
    <nav>
      <Link href="/" className="flex">
        Home
      </Link>
      <section>
        {children}
        <VersionSelector />
      </section>
      <style jsx>
        {`
          nav {
            top: 0;
            position: fixed;
            width: 100%;
            background: white;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: var(--top-nav-height);
            padding: 0 1.5rem;
            z-index: 2;
          }
          nav :global(a) {
            text-decoration: none;
          }
          section {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0;
            margin-left: auto;
          }
        `}
      </style>
    </nav>
  );
}
