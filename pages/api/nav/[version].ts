import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import versionsConfig from '../../../nav/versions.json';

type NavItem = { label: string; path?: string; children?: NavItem[] };
type Version = { key: string; label?: string; docsRoot: string; sidenav: string };
type VersionsConfig = { default: string; versions: Version[] };

function ensureLeadingSlash(p: string): string {
  return p.startsWith('/') ? p : '/' + p;
}

function normalizeNav(items: NavItem[], docsRoot: string): NavItem[] {
  const root = ensureLeadingSlash(docsRoot).replace(/\/$/, ''); // normalize, no trailing slash

  const toAbsolute = (maybeRel?: string): string | undefined => {
    if (maybeRel == null) return undefined;
    let s = ('' + maybeRel).trim();

    // Root shortcuts
    if (s === '' || s === '.') return root; // version root

    // External absolute URLs (http, https, etc.)
    if (/^[a-z]+:\/\//i.test(s)) return s;

    // Force site-absolute (outside docsRoot): use double-slash prefix in JSON
    if (s.startsWith('//')) return s.slice(1); // '/something' at site root

    // Already absolute within docsRoot
    if (s === root || s.startsWith(root + '/')) return s;

    // Single leading slash without docsRoot — treat as relative to docsRoot
    if (s.startsWith('/')) s = s.replace(/^\/+/, '');

    // Join relative path to docsRoot
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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { version } = req.query as { version?: string };
  const cfg = versionsConfig as VersionsConfig;
  const v =
    cfg.versions.find((x) => x.key === version) ||
    cfg.versions.find((x) => x.key === cfg.default) ||
    cfg.versions[0];

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