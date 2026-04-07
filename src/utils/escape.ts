const WIKILINK_ESCAPE_CHARS = ['\\', '|', '#', '^']

export function escapeWikiLink(text: string): string {
  let result = text
  for (const char of WIKILINK_ESCAPE_CHARS) {
    result = result.split(char).join('\\' + char)
  }
  return result
}

export function unescapeWikiLink(text: string): string {
  return text.replace(/\\([\\|#^])/g, '$1')
}

export function needsEscape(text: string): boolean {
  return WIKILINK_ESCAPE_CHARS.some(char => text.includes(char))
}

export function escapeMinimal(
  text: string,
  context: 'value' | 'alias' | 'heading'
): string {
  switch (context) {
    case 'value':
      return text.replace(/([\\|#^])/g, '\\$1')
    case 'alias':
      return text.replace(/([\]])/g, '\\$1')
    case 'heading':
      return text.replace(/([\\^])/g, '\\$1')
  }
}

export function escapeTag(text: string): string {
  return text.replace(/([\\#/\s])/g, '\\$1')
}

export function unescapeTag(text: string): string {
  return text.replace(/\\([\\#/\s])/g, '$1')
}

export function escapeHighlight(text: string): string {
  return text.replace(/([=])/g, '\\$1')
}

export function unescapeHighlight(text: string): string {
  return text.replace(/\\([=])/g, '$1')
}

export function escapeComment(text: string): string {
  return text.replace(/(%)/g, '\\$1')
}

export function unescapeComment(text: string): string {
  return text.replace(/\\(%)/g, '$1')
}

export function escapeCalloutTitle(text: string): string {
  return text.replace(/([\]\[])/g, '\\$1')
}

export function unescapeCalloutTitle(text: string): string {
  return text.replace(/\\([\]\[])/g, '$1')
}
