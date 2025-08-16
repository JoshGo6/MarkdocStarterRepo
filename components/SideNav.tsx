import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import nav from '../nav/sidenav.json';

type NavItem = {
  label: string;
  path?: string;
  children?: NavItem[];
};

function flattenPaths(items: NavItem[], base: string[] = [], acc: string[] = []): string[] {
  for (const it of items) {
    if (it.path) acc.push(it.path);
    if (it.children) flattenPaths(it.children, base, acc);
  }
  return acc;
}

function isAncestorOfActive(item: NavItem, activePath: string): boolean {
  if (!item.children) return false;
  return item.children.some(child => child.path === activePath || isAncestorOfActive(child, activePath));
}

function NavList({ items, activePath }: { items: NavItem[]; activePath: string }) {
  const router = useRouter();

  return (
    <ul className="tree">
      {items.map((item, idx) => {
        const isActive = item.path === activePath;
        const expanded = isAncestorOfActive(item, activePath);
        return (
          <li key={idx} className={isActive ? 'active' : expanded ? 'expanded' : undefined}>
            {item.path ? (
              <Link href={item.path} className="node link">
                {item.label}
              </Link>
            ) : (
              <span className="node">{item.label}</span>
            )}
            {item.children && item.children.length > 0 ? (
              <div className="children">
                <NavList items={item.children} activePath={activePath} />
              </div>
            ) : null}
          </li>
        );
      })}
      <style jsx>{`
        .tree {
          list-style: none;
          padding-left: 0;
          margin: 0;
        }
        .tree :global(a) {
          text-decoration: none;
        }
        li {
          margin: 0.15rem 0;
        }
        .node {
          display: inline-block;
          padding: 0.15rem 0.25rem;
          border-radius: 4px;
        }
        li.active > .node,
        li :global(a:hover) {
          text-decoration: underline;
        }
        .children {
          padding-left: 1rem;
          border-left: 1px dashed rgba(0,0,0,0.1);
          margin-left: 0.25rem;
        }
      `}</style>
    </ul>
  );
}

export function SideNav() {
  const router = useRouter();
  // router.asPath may include hash; strip it
  const activePath = useMemo(() => (router.asPath || '').split('#')[0], [router.asPath]);

  return (
    <nav className="sidenav">
      <NavList items={nav as NavItem[]} activePath={activePath} />
      <style jsx>{`
        .sidenav {
          height: calc(100vh - var(--top-nav-height));
          overflow: auto;
          padding: 1rem;
        }
      `}</style>
    </nav>
  );
}

export default SideNav;