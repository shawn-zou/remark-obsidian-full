[English](./README.md) | **简体中文**

# remark-obsidian-full

一个完整的 Obsidian 语法 Markdown 解析器，基于 remark 构建，支持完整的 AST 支持。

## 安装

```bash
npm install remark-obsidian-full remark remark-parse remark-stringify
```

## 快速开始

```typescript
import { ObsidianParser } from 'remark-obsidian-full'

const parser = new ObsidianParser()
const ast = await parser.parse('[[Note|Alias]]')
console.log(ast)
```

## 支持的语法

- WikiLink: `[[Note]]`, `[[Note|Alias]]`, `[[Note#Section]]`
- 嵌入: `![[image.png]]`, `![[image.png|200x300]]`
- 标签: `#tag`, `#nested/tag`
- Callout: `> [!note] 标题`
- 高亮: `==文本==`
- 注释: `%%注释内容%%`
- 数学公式: `$E=mc^2$`, `$$块级公式$$`
- 更多...

## 特性

- 完整的 Obsidian 语法支持
- 往返一致性（解析 → 字符串化 → 相同输出）
- 自定义语法的插件系统
- 用于自定义的钩子系统
- TypeScript 支持
- 零依赖（仅 peer dependencies）

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

// 解析文本为 AST
const ast = await parser.parse('[[Note|Alias]]')

// 将 AST 字符串化为文本
const text = await parser.stringify(ast)

// 按类型查找节点
const links = parser.findNodesByType(ast, 'wikiLink')
```

### 支持的节点类型

- `wikiLink` - WikiLink 节点
- `embed` - 嵌入节点
- `tag` - 标签节点
- `callout` - Callout 节点
- `highlight` - 高亮节点
- `comment` - 注释节点
- `math` - 数学公式节点
- 以及所有标准 Markdown 节点

## 许可证

MIT
