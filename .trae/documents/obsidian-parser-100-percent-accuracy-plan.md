# Obsidian 语法解析器 100% 准确性计划

## 当前状态

### 测试结果
- **Test Files**: 18 failed | 7 passed (25)
- **Tests**: 187 failed | 387 passed (574)
- **当前通过率**: 67.4%

### 问题分类

| 类别 | 问题数量 | 严重程度 |
|------|----------|----------|
| 状态转换问题 | 6个扩展 | 高 |
| 空内容处理 | 4个扩展 | 高 |
| 边界字符处理 | 1个扩展(tag) | 中 |
| Round-trip问题 | 多个扩展 | 中 |
| 扩展冲突 | 多个扩展 | 高 |
| 多行内容处理 | comment | 中 |

---

## 第一阶段：修复核心 Tokenizer 状态转换问题

### 问题根源
在 micromark 中，状态函数需要**调用**下一个状态函数并传递当前字符，而不是**返回**状态函数本身。

### 需要修复的文件

#### 1. highlight.ts
- **位置**: `closeEnd` 函数
- **问题**: `return ok` → 应为 `return ok(code)`
- **影响**: 无法正确闭合高亮语法 `==text==`

#### 2. comment.ts
- **位置**: `close` 函数
- **问题**: `return ok` → 应为 `return ok(code)`
- **影响**: 无法正确闭合注释语法 `%%text%%`

#### 3. math.ts
- **位置**: `close` 和 `closeSecond` 函数
- **问题**: `return ok` → 应为 `return ok(code)`
- **影响**: 无法正确闭合数学公式 `$text$` 和 `$$text$$`

#### 4. footnote.ts
- **位置**: 两个 `close` 函数
- **问题**: `return ok` → 应为 `return ok(code)`
- **影响**: 无法正确解析脚注 `[^1]` 和 `^[inline]`

#### 5. embed.ts
- **位置**: `closeEnd` 函数
- **问题**: `return ok` → 应为 `return ok(code)`
- **影响**: 无法正确解析嵌入语法 `![[file]]`

#### 6. callout.ts
- **位置**: `calloutTypeName` 函数
- **问题**: `return closeType` → 应为 `return closeType(code)`
- **影响**: 无法正确解析标注块 `> [!note]`

---

## 第二阶段：修复空内容处理问题

### 问题说明
Obsidian 允许某些语法包含空内容，但当前实现拒绝空内容。

### 需要修复的文件

#### 1. highlight.ts - 空高亮 `====`
- 移除 `size === 0` 的检查或将其改为允许空内容
- 更新测试期望

#### 2. comment.ts - 空注释 `%%%%`
- 同上处理

#### 3. math.ts - 空数学公式 `$$`
- 同上处理

#### 4. embed.ts - 空嵌入 `![[]]`
- 需要确认 Obsidian 是否支持空嵌入
- 如果不支持，更新测试期望

---

## 第三阶段：修复 Tag 边界字符处理

### 问题说明
Tag 应该在遇到特定边界字符时停止，但当前实现包含了这些字符。

### 需要修复的文件

#### tag.ts
需要添加边界字符检测：
- 标点符号: `. , ! ? ; :`
- 括号类: `( ) [ ] { }`
- 引号类: `" '`
- 其他: `< >`

### 实现方案
```typescript
function data(code: Code): State | undefined {
  // 添加边界字符检测
  if (isBoundaryChar(code)) {
    return end(code)
  }
  // ... 原有逻辑
}
```

---

## 第四阶段：修复 Round-trip 问题

### 问题说明
`stringify` 时对特殊字符进行了不必要的转义，导致输出与输入不一致。

### 需要修复的文件

#### 1. callout stringify
- 问题: `> [!note]` 变成 `> \[!note]`
- 修复: 不转义 callout 标记中的 `[` 和 `]`

#### 2. embed stringify
- 问题: `![[]]` 变成 `!\[\[]]`
- 修复: 不转义 embed 标记中的 `[` 和 `]`

#### 3. highlight stringify
- 问题: `====` 变成 `\====`
- 修复: 不转义 highlight 标记 `=`

---

## 第五阶段：修复扩展冲突

### 问题说明
多个扩展注册在同一字符上，导致解析冲突。

### 已知冲突

#### 1. `[` 字符冲突
- wiki-link: `[[text]]`
- footnote: `[^1]`
- embed: `![[file]]`
- 标准 markdown 链接: `[text](url)`

#### 2. `#` 字符冲突
- tag: `#tag`
- ATX 标题: `# Heading`

#### 3. `>` 字符冲突
- callout: `> [!note]`
- blockquote: `> quote`

### 解决方案
- 确保每个 tokenizer 在失败时正确清理状态
- 使用 `partial: true` 标记需要后续验证的 tokenizer
- 添加优先级机制

---

## 第六阶段：修复多行内容处理

### 问题说明
Comment 等扩展无法正确处理包含空行的多行内容。

### 需要修复的文件

#### comment.ts
- 问题: `%%line1\n\nline2%%` 解析失败
- 原因: 空行触发了 paragraph 分割
- 解决方案: 将 comment 注册为 flow construct 而非 text construct

---

## 第七阶段：完善测试覆盖

### 目标
确保所有 Obsidian 语法特性都有完整的测试覆盖。

### 测试分类

#### 1. 基础语法测试
- wiki-link: 基础、标题、块ID、别名
- embed: 文件嵌入、图片嵌入
- tag: 基础标签、嵌套标签
- callout: 所有类型、折叠、标题
- highlight: 基础、嵌套格式
- comment: 单行、多行
- math: 行内、块级
- footnote: 引用、定义

#### 2. 边缘情况测试
- 空内容
- 特殊字符
- 转义字符
- 嵌套结构
- 混合语法

#### 3. Round-trip 测试
- parse + stringify = 原始输入

---

## 执行计划

### 阶段一（预计修复 ~50 个测试）
1. 修复 highlight.ts 状态转换
2. 修复 comment.ts 状态转换
3. 修复 math.ts 状态转换
4. 修复 footnote.ts 状态转换
5. 修复 embed.ts 状态转换
6. 修复 callout.ts 状态转换
7. 运行测试验证

### 阶段二（预计修复 ~30 个测试）
1. 修复 highlight 空内容处理
2. 修复 comment 空内容处理
3. 修复 math 空内容处理
4. 修复 embed 空内容处理
5. 运行测试验证

### 阶段三（预计修复 ~20 个测试）
1. 修复 tag 边界字符处理
2. 运行测试验证

### 阶段四（预计修复 ~30 个测试）
1. 修复 callout stringify
2. 修复 embed stringify
3. 修复 highlight stringify
4. 修复其他 stringify 问题
5. 运行测试验证

### 阶段五（预计修复 ~30 个测试）
1. 分析并修复扩展冲突
2. 运行测试验证

### 阶段六（预计修复 ~20 个测试）
1. 修复 comment 多行处理
2. 运行测试验证

### 阶段七（最终验证）
1. 运行完整测试套件
2. 确认 100% 通过率
3. 代码审查和优化

---

## 成功标准

- [ ] 所有测试 100% 通过
- [ ] 所有 Obsidian 语法正确解析
- [ ] Round-trip 测试全部通过
- [ ] 无运行时错误
- [ ] 代码质量符合规范
