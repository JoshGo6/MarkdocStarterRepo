import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import versionsConfig from '../nav/versions.json';

type Version = { key: string; label?: string; docsRoot: string; sidenav: string };
type VersionsConfig = { default: string; versions: Version[] };

function pickActiveVersion(pathname: string, cfg: VersionsConfig): Version {
  const list = cfg.versions;
  const p = (pathname || '').split(/[?#]/)[0];
  const match = list
    .filter(v => p === v.docsRoot || p.startsWith(v.docsRoot + '/'))
    .sort((a, b) => b.docsRoot.length - a.docsRoot.length)[0];
  return match || list.find(v => v.key === cfg.default) || list[0];
}

function switchPath(pathname: string, fromRoot: string, toRoot: string): string {
  if (pathname === '/' || pathname === '') return toRoot;
  if (pathname === fromRoot) return toRoot;
  if (pathname.startsWith(fromRoot + '/')) {
    const rest = pathname.slice(fromRoot.length);
    return toRoot + rest;
  }
  return toRoot; // fallback
}

type NavItem = { label: string; path?: string; children?: NavItem[] };
async function fetchNavPaths(versionKey: string): Promise<Set<string>> {
  try {
    const res = await fetch(`/api/nav/${versionKey}`);
    if (!res.ok) return new Set();
    const data = (await res.json()) as NavItem[];
    const paths = new Set<string>();
    const walk = (items: NavItem[]) => {
      for (const it of items) {
        if (it.path) paths.add(it.path);
        if (it.children) walk(it.children);
      }
    };
    walk(data);
    return paths;
  } catch {
    return new Set();
  }
}

export function VersionSelector() {
  const router = useRouter();
  const cfg = versionsConfig as VersionsConfig;
  const active = useMemo(() => pickActiveVersion(router.asPath, cfg), [router.asPath]);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextKey = e.target.value;
    const to = cfg.versions.find(v => v.key === nextKey) || active;
    const currentPath = (router.asPath || '').split(/[?#]/)[0];
    const candidate = switchPath(currentPath, active.docsRoot, to.docsRoot);
    const paths = await fetchNavPaths(to.key);
    const target = paths.has(candidate) ? candidate : to.docsRoot;
    router.push(target);
  };

  return (
    <label className="version">
      <span>Version</span>
      <select value={active.key} onChange={onChange}>
        {cfg.versions.map(v => (
          <option key={v.key} value={v.key}>
            {v.label || v.key}
          </option>
        ))}
      </select>
      <style jsx>{`
        label.version {
          display: inline-flex;
          gap: 0.5rem;
          align-items: center;
          margin-left: auto;
        }
        select {
          font-size: 0.9rem;
          padding: 0.2rem 0.4rem;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: white;
        }
      `}</style>
    </label>
  );
}

export default VersionSelector;