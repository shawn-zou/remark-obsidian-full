const WIKILINK_ESCAPE_CHARS = ['\\', '|', '#', '^']
const ALIAS_ESCAPE_CHARS = [']']
const HEADING_ESCAPE_CHARS = ['\\', '^']

export function escapeWikiLink(text: string): string {
  return text.replace(/([\\|#^])/g, '\\$1')
}

export function unescapeWikiLink(text: string): string {
  // 处理 Obsidian 特定的转义字符和常见的 markdown 转义字符
  return text.replace(/\\([\\|#^\*_`\[\](){}<>+-.!])/g, '$1')
}

export function needsEscape(text: string, context: 'value' | 'alias' | 'heading' = 'value'): boolean {
  const chars = context === 'alias' 
    ? ALIAS_ESCAPE_CHARS 
    : context === 'heading' 
      ? HEADING_ESCAPE_CHARS 
      : WIKILINK_ESCAPE_CHARS
  return chars.some(char => text.includes(char))
}

export function escapeMinimal(
  text: string,
  context: 'value' | 'alias' | 'heading'
): string {
  if (!needsEscape(text, context)) {
    return text
  }
  
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
