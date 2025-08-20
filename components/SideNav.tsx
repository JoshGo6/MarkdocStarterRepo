import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import versionsConfig from '../nav/versions.json';

type NavItem = {
  label: string;
  path?: string;
  children?: NavItem[];
};

type MinorVersion = { key: string; label?: string; docsRoot: string; sidenav: string };
type MajorVersion = { key: string; label?: string; minorVersions: MinorVersion[] };
type VersionsConfig = { default: string; majorVersions: MajorVersion[] };

function findActiveVersion(pathname: string, cfg: VersionsConfig): MinorVersion {
  const p = (pathname || '').split(/[?#]/)[0];
  
  for (const major of cfg.majorVersions) {
    for (const minor of major.minorVersions) {
      if (p === minor.docsRoot || p.startsWith(minor.docsRoot + '/')) {
        return minor;
      }
    }
  }
  
  // Return default
  for (const major of cfg.majorVersions) {
    const defaultVersion = major.minorVersions.find(v => v.key === cfg.default);
    if (defaultVersion) return defaultVersion;
  }
  
  return cfg.majorVersions[0].minorVersions[0];
}

function isAncestorOfActive(item: NavItem, activePath: string): boolean {
  if (!item.children) return false;
  return item.children.some(child => child.path === activePath || isAncestorOfActive(child, activePath));
}

function NavList({ items, activePath }: { items: NavItem[]; activePath: string }) {
  return (
    <ul className="tree">
      {items.map((item, idx) => {
        const isActive = item.path === activePath;
        const expanded = isAncestorOfActive(item, activePath);
        return (
          <li key={idx} className={isActive ? 'active' : expanded ? 'expanded' : undefined}>
            {item.path ? (
              <Link href={item.path}>{item.label}</Link>
            ) : (
              <span className="nolink">{item.label}</span>
            )}
            {item.children && item.children.length ? (
              <NavList items={item.children} activePath={activePath} />
            ) : null}
          </li>
        );
      })}
      <style jsx>{`
        ul.tree {
          list-style: none;
          margin: 0;
          padding-left: 0.5rem;
        }
        .nolink {
          opacity: 0.8;
        }
        li.active > :global(a) {
          font-weight: 600;
        }
        li.expanded > .nolink {
          font-weight: 600;
        }
        li > ul {
          margin-left: 1rem;
        }
      `}</style>
    </ul>
  );
}

export function SideNav() {
  const router = useRouter();
  const cfg = versionsConfig as VersionsConfig;
  const [items, setItems] = useState<NavItem[] | null>(null);

  const activeVersion = useMemo(() => findActiveVersion(router.asPath, cfg), [router.asPath]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/nav/${activeVersion.key}`);
        if (!res.ok) throw new Error('Failed to load nav');
        const data = await res.json();
        setItems(data as NavItem[]);
      } catch (e) {
        console.error(e);
        setItems([]);
      }
    }
    load();
  }, [activeVersion.key]);

  const activePath = (router.asPath || '').split(/[?#]/)[0];

  return (
    <nav className="sidenav">
      {items ? <NavList items={items} activePath={activePath} /> : null}
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