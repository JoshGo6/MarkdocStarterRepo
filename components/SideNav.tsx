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

function getItemKey(item: NavItem, index: number): string {
  return `${item.label}-${index}`;
}

function NavList({ 
  items, 
  activePath, 
  expandedItems, 
  onToggleExpand 
}: { 
  items: NavItem[]; 
  activePath: string;
  expandedItems: Set<string>;
  onToggleExpand: (key: string) => void;
}) {
  return (
    <ul className="tree">
      {items.map((item, idx) => {
        const isActive = item.path === activePath;
        const itemKey = getItemKey(item, idx);
        const isExpanded = expandedItems.has(itemKey);
        const hasChildren = item.children && item.children.length > 0;
        
        return (
          <li key={idx} className={isActive ? 'active' : isExpanded ? 'expanded' : undefined}>
            <div className="nav-item">
              {item.path ? (
                <Link href={item.path} className="nav-link">{item.label}</Link>
              ) : (
                <span 
                  className={hasChildren ? "nolink expandable" : "nolink"}
                  onClick={hasChildren ? () => onToggleExpand(itemKey) : undefined}
                >
                  {item.label}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <NavList 
                items={item.children!} 
                activePath={activePath}
                expandedItems={expandedItems}
                onToggleExpand={onToggleExpand}
              />
            )}
          </li>
        );
      })}
      <style jsx>{`
        ul.tree {
          list-style: none;
          margin: 0;
          padding-left: 0.5rem;
        }
        .nav-item {
          display: flex;
          align-items: center;
        }
        .nolink {
          opacity: 0.8;
          flex: 1;
          display: flex;
          align-items: center;
        }
        .nolink.expandable {
          cursor: pointer;
          user-select: none;
          font-weight: 500;
          font-size: 0.95em;
          letter-spacing: 0.01em;
          opacity: 0.9;
        }
        .nolink.expandable:hover {
          opacity: 1;
          background-color: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
          padding: 2px 4px;
          margin: -2px -4px;
        }
        .nav-link {
          text-decoration: none;
          color: inherit;
          font-weight: 400;
          font-size: 0.9em;
        }
        .nav-link:hover {
          opacity: 0.7;
        }
        li.active > .nav-item > :global(.nav-link) {
          font-weight: 600;
        }
        li.expanded > .nav-item > .nolink {
          font-weight: 500;
          opacity: 1;
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const activeVersion = useMemo(() => findActiveVersion(router.asPath, cfg), [router.asPath]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/nav/${activeVersion.key}`);
        if (!res.ok) throw new Error('Failed to load nav');
        const data = await res.json();
        setItems(data as NavItem[]);
        // Reset expanded items when loading new navigation
        setExpandedItems(new Set());
      } catch (e) {
        console.error(e);
        setItems([]);
      }
    }
    load();
  }, [activeVersion.key]);

  const handleToggleExpand = (key: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const activePath = (router.asPath || '').split(/[?#]/)[0];

  return (
    <nav className="sidenav">
      {items ? (
        <NavList 
          items={items} 
          activePath={activePath}
          expandedItems={expandedItems}
          onToggleExpand={handleToggleExpand}
        />
      ) : null}
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