import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import versionsConfig from '../../../nav/versions.json';

type NavItem = { label: string; path?: string; children?: NavItem[] };
type MinorVersion = { key: string; label?: string; docsRoot: string; sidenav: string };
type MajorVersion = { key: string; label?: string; minorVersions: MinorVersion[] };
type VersionsConfig = { default: string; majorVersions: MajorVersion[] };

function ensureLeadingSlash(p: string): string {
  return p.startsWith('/') ? p : '/' + p;
}

function normalizeNav(items: NavItem[], docsRoot: string): NavItem[] {
  const root = ensureLeadingSlash(docsRoot).replace(/\/$/, '');

  const toAbsolute = (maybeRel?: string): string | undefined => {
    if (maybeRel == null) return undefined;
    let s = ('' + maybeRel).trim();

    if (s === '' || s === '.') return root;
    if (/^[a-z]+:\/\//i.test(s)) return s;
    if (s.startsWith('//')) return s.slice(1);
    if (s === root || s.startsWith(root + '/')) return s;
    if (s.startsWith('/')) s = s.replace(/^\/+/, '');

    return s ? `${root}/${s}` : root;
  };

  const walk = (arr: NavItem[]): NavItem[] =>
    arr.map(({ label, path: p, children }) => ({
      label,
      path: toAbsolute(p),
      children: children ? walk(children) : undefined,
    }));

  return walk(items);
}

function findVersion(key: string, cfg: VersionsConfig): MinorVersion | undefined {
  for (const major of cfg.majorVersions) {
    const minor = major.minorVersions.find(v => v.key === key);
    if (minor) return minor;
  }
  
  // Try to find default
  for (const major of cfg.majorVersions) {
    const defaultVersion = major.minorVersions.find(v => v.key === cfg.default);
    if (defaultVersion) return defaultVersion;
  }
  
  return cfg.majorVersions[0]?.minorVersions[0];
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { version } = req.query as { version?: string };
  const cfg = versionsConfig as VersionsConfig;
  const v = findVersion(version || '', cfg);

  if (!v) {
    res.status(404).json({ error: 'No versions configured' });
    return;
  }

  const filePath = path.join(process.cwd(), v.sidenav);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw) as NavItem[];
    const normalized = normalizeNav(json, v.docsRoot);
    res.status(200).json(normalized);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to load nav file' });
  }
}