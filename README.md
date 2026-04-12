**English** | [简体中文](./README_CN.md)

# remark-obsidian-full

A complete Markdown parser for Obsidian syntax with full AST support, built on remark.

## Installation

```bash
npm install remark-obsidian-full remark remark-parse remark-stringify
```

## Quick Start

```typescript
import { ObsidianParser } from 'remark-obsidian-full'

const parser = new ObsidianParser()
const ast = await parser.parse('[[Note|Alias]]')
console.log(ast)
```

## Supported Syntax

- WikiLink: `[[Note]]`, `[[Note|Alias]]`, `[[Note#Section]]`
- Embed: `![[image.png]]`, `![[image.png|200x300]]`
- Tag: `#tag`, `#nested/tag`
- Callout: `> [!note] Title`
- Highlight: `==text==`
- Comment: `%%comment%%`
- Math: `$E=mc^2$`, `$$block math$$`
- And more...

## Features

- Complete Obsidian syntax support
- Round-trip consistency (parse → stringify → identical output)
- Plugin system for custom syntax
- Hook system for customization
- TypeScript support
- Zero dependencies (peer dependencies only)

## API

### ObsidianParser

```typescript
import { ObsidianParser } from 'remark-obsidian-full'

const parser = new ObsidianParser({
  syntax: {
    wikiLink: { aliasDivider: '|' },
    math: { singleDollarTextMath: true }
  }
})

// Parse text to AST
const ast = await parser.parse('[[Note|Alias]]')

// Stringify AST to text
const text = await parser.stringify(ast)

// Find nodes by type
const links = parser.findNodesByType(ast, 'wikiLink')
```

### Supported Node Types

- `wikiLink` - WikiLink nodes
- `embed` - Embed nodes
- `tag` - Tag nodes
- `callout` - Callout nodes
- `highlight` - Highlight nodes
- `comment` - Comment nodes
- `math` - Math nodes
- And all standard Markdown nodes

## License

MIT
