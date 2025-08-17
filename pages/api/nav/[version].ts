import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import versionsConfig from '../../../nav/versions.json';

type Version = { key: string; label?: string; docsRoot: string; sidenav: string };
type VersionsConfig = { default: string; versions: Version[] };

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { version } = req.query as { version?: string };
  const cfg = versionsConfig as VersionsConfig;
  const v = cfg.versions.find(x => x.key === version) || cfg.versions.find(x => x.key === cfg.default) || cfg.versions[0];
  const p = v?.sidenav;
  if (!p) {
    res.status(404).json({ error: 'No nav configured' });
    return;
  }
  const filePath = path.join(process.cwd(), p);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);
    res.status(200).json(json);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to load nav file' });
  }
}
