import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMajor, setHoveredMajor] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredMajor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMinorClick = async (minor: MinorVersion) => {
    const currentPath = (router.asPath || '').split(/[?#]/)[0];
    const candidate = switchPath(currentPath, activeMinor.docsRoot, minor.docsRoot);
    const paths = await fetchNavPaths(minor.key);
    const target = paths.has(candidate) ? candidate : minor.docsRoot;
    router.push(target);
    setIsOpen(false);
    setHoveredMajor(null);
  };

  const currentVersionLabel = activeMinor.label || activeMinor.key;

  return (
    <div className="version-selector" ref={dropdownRef}>
      <button
        className="version-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select version"
        aria-expanded={isOpen}
      >
        <span>{currentVersionLabel}</span>
        <svg
          className={`chevron ${isOpen ? 'open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {cfg.majorVersions.map(major => (
            <div
              key={major.key}
              className="major-item"
              onMouseEnter={() => setHoveredMajor(major.key)}
              onMouseLeave={() => setHoveredMajor(null)}
            >
              <div className={`major-label ${major.minorVersions.length === 1 ? 'single' : ''}`}>
                {major.minorVersions.length === 1 ? (
                  <button
                    className="single-version-button"
                    onClick={() => handleMinorClick(major.minorVersions[0])}
                  >
                    {major.label || major.key}
                  </button>
                ) : (
                  <>
                    <svg
                      className="arrow arrow-left"
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 3L4.5 6L7.5 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{major.label || major.key}</span>
                  </>
                )}
              </div>

              {hoveredMajor === major.key && major.minorVersions.length > 1 && (
                <div className="flyout">
                  {major.minorVersions.map(minor => (
                    <button
                      key={minor.key}
                      className={`minor-item ${minor.key === activeMinor.key ? 'active' : ''}`}
                      onClick={() => handleMinorClick(minor)}
                    >
                      {minor.label || minor.key}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .version-selector {
          position: relative;
          display: inline-block;
        }

        .version-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .version-button:hover {
          border-color: #999;
        }

        .version-button span {
          white-space: nowrap;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          min-width: 200px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          overflow: visible;
        }

        .major-item {
          position: relative;
        }

        .major-label {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          cursor: default;
          transition: background-color 0.2s;
        }

        .major-item:hover .major-label {
          background-color: #f5f5f5;
        }

        .major-label.single {
          padding: 0;
        }

        .major-label span {
          font-size: 0.9rem;
        }

        .flyout {
          position: absolute;
          right: 100%;
          top: 0;
          min-width: 150px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-right: 2px;
          z-index: 1001;
        }
      `}</style>
      <style jsx global>{`
        .version-selector .chevron {
          transition: transform 0.2s;
        }

        .version-selector .chevron.open {
          transform: rotate(180deg);
        }

        .version-selector .single-version-button {
          display: flex;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
          font-family: inherit;
          color: inherit;
          transition: background-color 0.2s;
        }

        .version-selector .single-version-button:hover {
          background-color: #f5f5f5;
        }

        .version-selector .arrow {
          flex-shrink: 0;
        }

        .version-selector .arrow-left {
          margin-right: 0.25rem;
        }

        .version-selector .minor-item {
          display: block;
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
          font-family: inherit;
          color: inherit;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .version-selector .minor-item:hover {
          background-color: #f5f5f5;
        }

        .version-selector .minor-item.active {
          background-color: #e8f4f8;
          font-weight: 600;
        }

        .version-selector .minor-item:first-child {
          border-radius: 6px 6px 0 0;
        }

        .version-selector .minor-item:last-child {
          border-radius: 0 0 6px 6px;
        }
      `}</style>
    </div>
  );
}

export default VersionSelector;