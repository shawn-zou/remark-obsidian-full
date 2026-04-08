# Obsidian 语法解析器修复计划

## 问题分析

### 独立的 Round-trip 问题（不依赖解析）
- **WikiLink**: 可能有转义问题
- **Tag**: 可能有转义问题  
- **Highlight**: 可能有转义问题
- **Comment**: 可能有转义问题（单行）
- **Inline Math**: 可能有转义问题
- **Footnote**: 可能有转义问题

### 解析相关问题（需要修复解析）
- **Callout**: type/title/foldable 解析失败
- **Embed**: width+alias 组合解析问题

### 复杂问题（需要架构调整）
- **Block Math**: 完全不支持（需要 flow construct）
- **Multi-line Comment**: 不支持多行（需要 flow construct）

## 修复顺序

### 第一阶段：独立的 Round-trip 修复（简单）
1. **WikiLink** - 验证并修复转义问题
2. **Tag** - 验证并修复转义问题  
3. **Highlight** - 验证并修复转义问题
4. **Comment** - 验证并修复转义问题
5. **Inline Math** - 验证并修复转义问题
6. **Footnote** - 验证并修复转义问题

### 第二阶段：解析问题修复（中等）
7. **Embed** - 修复 width+alias 组合解析
8. **Callout** - 修复 type/title/foldable 解析

### 第三阶段：复杂架构问题（复杂）
9. **Block Math** - 实现 flow construct 支持
10. **Multi-line Comment** - 实现 flow construct 支持

## 具体实施步骤

### 第一阶段：独立 Round-trip 修复

#### 1. WikiLink
- **文件**: `src/extensions/mdast/to-markdown.ts` (handleWikiLink)
- **检查**: 验证 `escapeMinimal` 函数是否正确处理转义
- **测试**: 运行 `wiki-link.test.ts` 和 `wikilink-edge.test.ts`

#### 2. Tag
- **文件**: `src/extensions/mdast/to-markdown.ts` (handleTag)
- **检查**: 验证 tag 序列化是否正确
- **测试**: 运行 `tag.test.ts` 和 `tag-edge.test.ts`

#### 3. Highlight
- **文件**: `src/extensions/mdast/to-markdown.ts` (handleHighlight)
- **检查**: 验证 highlight 序列化是否正确
- **测试**: 运行 `highlight.test.ts` 和 `highlight-comment-edge.test.ts`

#### 4. Comment
- **文件**: `src/extensions/mdast/to-markdown.ts` (handleComment)
- **检查**: 验证 comment 序列化是否正确
- **测试**: 运行 `comment.test.ts` 和 `highlight-comment-edge.test.ts`

#### 5. Inline Math
- **文件**: `src/extensions/mdast/to-markdown.ts` (handleMath)
- **检查**: 验证 math 序列化是否正确
- **测试**: 运行 `math.test.ts` 和 `math-footnote-edge.test.ts`

#### 6. Footnote
- **文件**: `src/extensions/mdast/to-markdown.ts` (handleFootnoteReference, handleFootnoteDefinition)
- **检查**: 验证 footnote 序列化是否正确
- **测试**: 运行 `math-footnote-edge.test.ts`

### 第二阶段：解析问题修复

#### 7. Embed
- **文件**: `src/extensions/micromark/embed.ts`
- **问题**: 重复的 `close` 和 `closeEnd` 函数，以及 `afterDivider` 逻辑
- **修复**: 重构 tokenizer 逻辑，正确处理 width+alias 组合
- **测试**: 运行 `embed.test.ts` 和 `embed-edge.test.ts`

#### 8. Callout
- **文件**: `src/extensions/micromark/callout.ts`
- **问题**: 使用 `effects.peek` 预读字符，不可靠
- **修复**: 重写 tokenizer 逻辑，使用正确的状态机处理
- **测试**: 运行 `callout-edge.test.ts`

### 第三阶段：复杂架构问题

#### 9. Block Math
- **文件**: `src/extensions/micromark/math.ts`
- **问题**: 只支持行内 math，不支持块级 math
- **修复**: 添加 flow construct 支持，处理 `$$...$$`
- **测试**: 更新 `math.test.ts` 和 `math-footnote-edge.test.ts`

#### 10. Multi-line Comment
- **文件**: `src/extensions/micromark/comment.ts`
- **问题**: 只支持单行 comment，不支持多行
- **修复**: 注册为 flow construct，处理跨段落的 comment
- **测试**: 更新 `comment.test.ts` 和 `highlight-comment-edge.test.ts`

## 验证策略

1. **单元测试**: 运行所有相关测试文件
2. **集成测试**: 运行 `parser-integration.test.ts` 和 `full-document.test.ts`
3. **Round-trip 测试**: 确保所有解析→序列化→解析的往返测试通过
4. **边界情况**: 验证各种边界情况和特殊字符处理

## 预期成果

- 所有 Round-trip 测试通过
- 所有解析测试通过  
- 支持所有 Obsidian 语法特性
- 代码质量和可维护性提升

## 风险评估

- **低风险**: Round-trip 修复（纯序列化问题）
- **中风险**: Embed 和 Callout 解析修复（需要修改 tokenizer）
- **高风险**: Block Math 和 Multi-line Comment（需要架构调整）

## 时间估计

- 第一阶段: 1-2 小时
- 第二阶段: 2-3 小时  
- 第三阶段: 3-4 小时
- 总时间: 6-9 小时

## 执行优先级

1. 独立 Round-trip 修复（简单、快速）
2. 解析问题修复（中等复杂度）
3. 架构调整问题（复杂、耗时）

此计划遵循"独立的先处理，简单的先处理，复杂的放最后"的原则。