# Obsidian 语法解析器修复计划

## 项目目标
- **检测并正确解析符合 Obsidian 规范的语法**
- **对于正确的语法**：解析器应该能够识别并正确解析，保证在处理文本时不会破坏正确语法结构
- **对于不符合规范的语法**：解析器应该拒绝解析，而不是尝试纠正

## 测试策略
1. **测试有效语法能够正确解析**
2. **测试无效语法被正确拒绝（不产生对应的 AST 节点）**

## 当前问题分析

### 已完成的工作 ✅
- 为所有扩展添加了 `invalid syntax` 测试
- 无效语法的拒绝机制工作正常

### 待修复的问题

#### 第一阶段：简单问题（Round-trip 修复）
1. **WikiLink 转义问题** - `[[note\*name]]` 解析后值应该是 `note*name`，但实际是 `note\*name`

#### 第二阶段：中等问题（解析问题修复）
2. **Embed dimensions 组合解析错误**
   - `![[image.png|100|alias]]` - width 应该是 100，实际是 undefined
   - `![[note#section|100]]` - heading 应该是 'section'，实际是 'section|100'
   - `![[note#^block|100x200]]` - blockId 应该是 'block'，实际是 undefined

3. **Comment 基础解析失败**
   - `%%text with **markdown** inside%%` 应该被正确解析

#### 第三阶段：复杂问题（架构调整）
4. **Block Math 解析失败** - `$$\nE = mc^2\n$$` 应该生成 math 节点
5. **Comment 多行解析** - `%%line1\n\nline2%%` 应该被正确解析

## 修复计划

### 第一阶段：修复 WikiLink 转义问题
**文件**：`src/extensions/micromark/wiki-link.ts`
**问题**：转义字符 `\*` 没有被正确处理（只有 `\|`, `\#`, `\^` 是 Obsidian 的特殊转义字符）
**修复步骤**：
1. 检查 `wiki-link.ts` 中的转义处理逻辑
2. 确保只有 Obsidian 规定的特殊字符才被转义
3. 运行 `wiki-link.test.ts` 和 `wikilink-edge.test.ts` 验证修复

### 第二阶段：修复 Embed dimensions 解析
**文件**：`src/extensions/micromark/embed.ts`
**问题**：Embed tokenizer 的 `afterDivider` 逻辑没有正确区分 dimensions 和 alias
**修复步骤**：
1. 分析 `embed.ts` 中的 tokenizer 逻辑
2. 重构 `afterDivider` 函数，正确识别 dimensions 格式（数字或数字x数字）
3. 运行 `embed.test.ts` 和 `embed-edge.test.ts` 验证修复

### 第三阶段：修复 Comment 基础解析
**文件**：`src/extensions/micromark/comment.ts`
**问题**：Comment tokenizer 状态机问题，可能与其他扩展冲突
**修复步骤**：
1. 检查 `comment.ts` 中的状态机逻辑
2. 确保 comment 解析不会与其他扩展冲突
3. 运行 `comment.test.ts` 和 `highlight-comment-edge.test.ts` 验证修复

### 第四阶段：实现 Block Math 支持
**文件**：`src/extensions/micromark/math.ts`
**问题**：只实现了 inline math，没有实现 block math 作为 flow construct
**修复步骤**：
1. 在 `math.ts` 中添加 block math 支持
2. 注册为 flow construct
3. 运行 `math.test.ts` 和 `math-footnote-edge.test.ts` 验证修复

### 第五阶段：实现 Comment 多行支持
**文件**：`src/extensions/micromark/comment.ts`
**问题**：只支持单行 comment，不支持多行（需要 flow construct）
**修复步骤**：
1. 将 comment 注册为 flow construct
2. 处理跨段落的 comment
3. 运行 `comment.test.ts` 和 `highlight-comment-edge.test.ts` 验证修复

## 验证策略
1. **单元测试**：运行所有相关测试文件
2. **集成测试**：运行 `parser-integration.test.ts` 和 `full-document.test.ts`
3. **Round-trip 测试**：确保所有解析→序列化→解析的往返测试通过
4. **边界情况**：验证各种边界情况和特殊字符处理

## 预期成果
- 所有测试 100% 通过
- 所有 Obsidian 语法正确解析
- 无效语法被正确拒绝
- Round-trip 测试全部通过
- 代码质量和可维护性提升

## 风险评估
- **低风险**：WikiLink 转义修复（纯解析逻辑问题）
- **中风险**：Embed 解析修复（需要修改 tokenizer）
- **高风险**：Block Math 和 Comment 多行支持（需要架构调整）

## 执行顺序
1. 修复 WikiLink 转义问题（简单）
2. 修复 Embed dimensions 解析（中等）
3. 修复 Comment 基础解析（中等）
4. 实现 Block Math 支持（复杂）
5. 实现 Comment 多行支持（复杂）

此计划遵循"从简单到复杂"的原则，确保每个修复都能独立验证，减少风险。