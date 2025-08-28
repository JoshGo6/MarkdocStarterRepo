import React from 'react';
import { useRouter } from 'next/router';
import versionsConfig from '../nav/versions.json';

type MinorVersion = { key: string; label?: string; docsRoot: string; sidenav: string };
type MajorVersion = { key: string; label?: string; minorVersions: MinorVersion[] };
type VersionsConfig = { default: string; majorVersions: MajorVersion[] };

type Props = {
  is?: string;
  any?: string[];
  not?: string[];
  startsWith?: string;
  major?: string;
  children?: React.ReactNode;
};

function flattenMinors(cfg: VersionsConfig): MinorVersion[] {
  const minors: MinorVersion[] = [];
  for (const major of cfg.majorVersions || []) {
    for (const minor of major.minorVersions || []) {
      minors.push(minor);
    }
  }
  return minors;
}

function useActiveMinor(): string | null {
  const router = useRouter();
  const minors = flattenMinors(versionsConfig as VersionsConfig);

  const asPath = router?.asPath || '';
  const [pathname, search] = asPath.split(/[?#]/);
  const searchParams = new URLSearchParams(search || '');
  const versionParam = searchParams.get('v');

  if (versionParam && minors.some(v => v.key === versionParam)) {
    const minor = minors.find(v => v.key === versionParam)!;
    const p = pathname || '';
    if (p === minor.docsRoot || p.startsWith(minor.docsRoot + '/')) return versionParam;
  }

  const p = pathname || '';
  for (const minor of minors) {
    if (p === minor.docsRoot || p.startsWith(minor.docsRoot + '/')) {
      return minor.key;
    }
  }

  const defaultKey = (versionsConfig as VersionsConfig).default;
  if (defaultKey && minors.some(v => v.key === defaultKey)) return defaultKey;
  return null;
}

function majorOf(minor: string): string {
  const m = minor.match(/^v(\d+)(?:\.\d+)?$/i);
  return m ? `v${m[1]}` : minor;
}

export function VersionGate(props: Props) {
  const active = useActiveMinor();
  if (!active) return null;

  const allowByIs     = props.is ? active === props.is : undefined;
  const allowByAny    = props.any ? props.any.includes(active) : undefined;
  const allowByStarts = props.startsWith ? active.startsWith(props.startsWith) : undefined;
  const allowByMajor  = props.major ? majorOf(active) === props.major : undefined;

  const positivesProvided = [props.is, props.any, props.startsWith, props.major].some(Boolean);
  const positivePass = !positivesProvided || Boolean(allowByIs || allowByAny || allowByStarts || allowByMajor);
  const negativePass = props.not ? !props.not.includes(active) : true;

  return positivePass && negativePass ? <>{props.children}</> : null;
}
