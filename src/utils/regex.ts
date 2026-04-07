export const PATTERNS = {
  wikiLink: /\[\[([^\]]*?)\]\]/g,
  wikiLinkValue: /^([^\]|#^]+?)(?:#(\^?[^\]|]*))?(?:\|(.+))?$/,
  embed: /!\[\[([^\]]*?)\]\]/g,
  embedValue: /^([^\]|#^]+?)(?:#(\^?[^\]|]*))?(?:\|(\d+)(?:x(\d+))?)?$/,
  tag: /#([a-zA-Z0-9_\-/\u4e00-\u9fff]+)/g,
  callout: /^>\s*\[!(\w+)\]([+-]?)\s*(.*)$/m,
  highlight: /==([^=]+)==/g,
  comment: /%%([^%]+)%%/g,
  footnoteRef: /\[\^([^\]]+)\]/g,
  footnoteDef: /^\[\^([^\]]+)\]:\s*(.+)$/m,
  inlineFootnote: /\^\[([^\]]+)\]/g,
  blockRef: /\s\^([a-zA-Z0-9\-]+)\s*$/m,
  frontmatter: /^---\n([\s\S]*?)\n---/,
  inlineMath: /\$([^$]+)\$/g,
  blockMath: /\$\$([^$]+)\$\$/g,
  strikethrough: /~~([^~]+)~~/g
} as const

export const CALLOUT_TYPES = [
  'note',
  'abstract', 'summary', 'tldr',
  'info', 'todo',
  'tip', 'hint', 'important',
  'success', 'check', 'done',
  'question', 'help', 'faq',
  'warning', 'caution', 'attention',
  'failure', 'fail', 'missing',
  'danger', 'error',
  'bug',
  'example',
  'quote'
] as const

export type CalloutType = typeof CALLOUT_TYPES[number]

export function isCalloutType(type: string): type is CalloutType {
  return CALLOUT_TYPES.includes(type as CalloutType)
}

export function normalizeCalloutType(type: string): CalloutType {
  const normalized = type.toLowerCase()
  if (isCalloutType(normalized)) {
    return normalized
  }
  return 'note'
}
