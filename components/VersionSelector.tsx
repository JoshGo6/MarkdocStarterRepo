import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import versionsConfig from '../nav/versions.json';

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

function findMajorVersion(minorVersion: MinorVersion, cfg: VersionsConfig): MajorVersion | undefined {
  return cfg.majorVersions.find(major => 
    major.minorVersions.some(minor => minor.key === minorVersion.key)
  );
}

function switchPath(pathname: string, fromRoot: string, toRoot: string): string {
  if (pathname === '/' || pathname === '') return toRoot;
  if (pathname === fromRoot) return toRoot;
  if (pathname.startsWith(fromRoot + '/')) {
    const rest = pathname.slice(fromRoot.length);
    return toRoot + rest;
  }
  return toRoot;
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
  const activeMinor = useMemo(() => findActiveVersion(router.asPath, cfg), [router.asPath]);
  const activeMajor = useMemo(() => findMajorVersion(activeMinor, cfg), [activeMinor]);
  
  const [selectedMajor, setSelectedMajor] = useState(activeMajor?.key || cfg.majorVersions[0].key);
  const [selectedMinor, setSelectedMinor] = useState(activeMinor.key);

  useEffect(() => {
    if (activeMajor) setSelectedMajor(activeMajor.key);
    setSelectedMinor(activeMinor.key);
  }, [activeMajor, activeMinor]);

  const currentMajor = cfg.majorVersions.find(m => m.key === selectedMajor) || cfg.majorVersions[0];
  const minorVersions = currentMajor.minorVersions;

  const onMajorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMajorKey = e.target.value;
    const newMajor = cfg.majorVersions.find(m => m.key === newMajorKey);
    if (newMajor && newMajor.minorVersions.length > 0) {
      setSelectedMajor(newMajorKey);
      setSelectedMinor(newMajor.minorVersions[0].key);
    }
  };

  const onMinorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinorKey = e.target.value;
    const newMinor = minorVersions.find(v => v.key === newMinorKey);
    if (!newMinor) return;
    
    setSelectedMinor(newMinorKey);
    
    const currentPath = (router.asPath || '').split(/[?#]/)[0];
    const candidate = switchPath(currentPath, activeMinor.docsRoot, newMinor.docsRoot);
    const paths = await fetchNavPaths(newMinor.key);
    const target = paths.has(candidate) ? candidate : newMinor.docsRoot;
    router.push(target);
  };

  return (
    <div className="version-selector">
      <label>
        <span>Version</span>
        <div className="selector-group">
          <select value={selectedMajor} onChange={onMajorChange} className="major-select">
            {cfg.majorVersions.map(major => (
              <option key={major.key} value={major.key}>
                {major.label || major.key}
              </option>
            ))}
          </select>
          <select value={selectedMinor} onChange={onMinorChange} className="minor-select">
            {minorVersions.map(minor => (
              <option key={minor.key} value={minor.key}>
                {minor.label || minor.key}
              </option>
            ))}
          </select>
        </div>
      </label>
      <style jsx>{`
        .version-selector {
          display: inline-flex;
          align-items: center;
          margin-left: auto;
        }
        label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .selector-group {
          display: flex;
          gap: 0.25rem;
        }
        select {
          font-size: 0.9rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: white;
          cursor: pointer;
        }
        .major-select {
          font-weight: 600;
        }
        .minor-select {
          min-width: 100px;
        }
        select:hover {
          border-color: #999;
        }
      `}</style>
    </div>
  );
}

export default VersionSelector;