const withMarkdoc = require('@markdoc/next.js');
const versions = require('./nav/versions.json');

function computeRewrites() {
  const minors = {};
  for (const major of versions.majorVersions || []) {
    for (const minor of major.minorVersions || []) {
      minors[minor.key] = minor;
    }
  }
  const rules = [];
  for (const key in minors) {
    const m = minors[key];
    if (m.docsAliasOf) {
      const target = minors[m.docsAliasOf];
      if (target && target.docsRoot && m.docsRoot) {
        rules.push({ source: `${m.docsRoot}`, destination: `${target.docsRoot}` });
        rules.push({ source: `${m.docsRoot}/:path*`, destination: `${target.docsRoot}/:path*` });
      }
    }
  }
  return rules;
}

module.exports =
  withMarkdoc(/* config: https://markdoc.io/docs/nextjs#options */)({
    pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdoc'],
    async rewrites() {
      return computeRewrites();
    }
  });
