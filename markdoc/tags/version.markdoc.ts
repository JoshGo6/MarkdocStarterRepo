import { VersionGate } from '../../components';

export const version = {
  render: VersionGate,
  attributes: {
    is: { type: String },
    any: { type: Array, of: String },
    not: { type: Array, of: String },
    startsWith: { type: String },
    major: { type: String }
  },
  children: ['paragraph', 'tag', 'list', 'table', 'heading', 'image', 'fence', 'blockquote']
};
