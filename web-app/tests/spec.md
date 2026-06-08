# Rummikub 游戏模块单元测试规范

## 测试文件
`/web-app/tests/rummikub.test.js`

## 测试框架
Node.js 原生 `node:test` + `node:assert`

---

## 测试分组

### 1. initGame — 游戏初始化

| 测试用例 | 行为描述 |
|---|---|
| 单人模式初始化 | 创建单人游戏，验证 mode=difficulty、players 数量、ID、手牌数、牌堆数、棋盘、当前玩家索引、gameOver 状态 |
| 双人模式初始化 | 创建双人游戏，验证 mode=twoPlayer、player2 ID、difficulty=null |
| 总牌数验证 | 验证所有玩家手牌 + 牌堆 = 106 张 |
| 唯一 ID 验证 | 验证所有牌拥有唯一 ID |

### 2. isValidGroup — 出牌规则验证

#### 有效 SET（同点不同色）

| 测试用例 | 行为描述 |
|---|---|
| 3 张有效 SET | 红5+蓝5+黄5 → true |
| 4 张有效 SET | 红3+蓝3+黄3+黑3 → true |
| SET 含一张百变牌 | 红7+蓝7+百变 → true |
| SET 含两张百变牌 | 红9+百变+百变 → true |

#### 有效 RUN（顺子）

| 测试用例 | 行为描述 |
|---|---|
| 3 张有效顺子 | 红3+红4+红5 → true |
| 13 张完整顺子 | 蓝1~蓝13 → true |
| 顺子百变牌填补空缺 | 红3+百变+红5 → true |
| 顺子百变牌在开头 | 百变+蓝4+蓝5 → true |
| 顺子百变牌在结尾 | 红3+红4+百变 → true |

#### 无效组合

| 测试用例 | 行为描述 |
|---|---|
| 少于 3 张 | 1 张或空数组 → false |
| 非数组/null/undefined/字符串 | null/undefined/字符串 → false |
| SET 重复颜色 | 红5+红5+蓝5 → false |
| SET 不同数值 | 红5+蓝6+黄7 → false |
| SET 超过 4 张 | 4 张 + 百变 → false |
| 顺子混色 | 红3+蓝4+红5 → false |
| 顺子重复数值 | 红3+红3+红4 → false |
| 顺子空缺过大 | 红3+红4+红7（无百变填充）→ false |
| 全百变牌 | 百变+百变+百变 → false |

### 3. sortGroup — 牌组排序

| 测试用例 | 行为描述 |
|---|---|
| 顺子按数值升序 | [7,5,6] → [5,6,7] |
| SET 按颜色顺序 | [黄,红,蓝] → [红,蓝,黄] |
| 百变牌排在末尾 | [百变,红5,红4] → 末位为百变 |
| 空数组 | [] → [] |

### 4. getJokerRepresentation — 百变牌代表值

| 测试用例 | 行为描述 |
|---|---|
| SET 中缺失的颜色 | 红5+蓝5+百变 → {color:yellow, value:5} |
| 顺子空缺填补 | 红3+百变+红5 → {color:red, value:4} |
| 顺子结尾延伸 | 红3+红4+百变 → {color:red, value:5} |
| 顺子开头延伸 | 百变+蓝4+蓝5 → {color:blue, value:3} |
| 全百变牌 | 百变×3 → null |
| 少于 3 张 | [红1,百变] → null |

### 5. makeMove — 执行出牌

| 测试用例 | 行为描述 |
|---|---|
| 合法出牌（新牌组） | 打出 3 张有效顺子 → success=true |
| 牌不在手牌中 | 传入不存在的牌 → success=false |
| 首次出牌不足 30 分 | [红1,红2,红3]（6 分）→ success=false，提示包含 "30" |
| 首次出牌 >= 30 分 | [红10,红11,红12]（33 分）→ success=true，hasMelded=true |
| 非法牌组 | 混色乱序 → success=false |
| 空 tilesToPlay | 空数组 → success=false |
| 切换玩家 | 出牌后 currentPlayerIndex 变为 1 |
| 加牌到已有牌组 | 棋盘有 [红3,红4,红5]，打出红6 接续 → board[0] 长度为 4 |
| 首次出牌前替换百变 | beforeMelded 时替换百变 → success=false |
| scoreDelta 返回值 | 打出 10+11+12 → scoreDelta=33 |

### 6. skipAndDraw — 摸牌与跳过

| 测试用例 | 行为描述 |
|---|---|
| 正常摸牌 | 牌堆有牌 → drawnTile 不为空，手牌 +1，牌堆 -1，索引 +1 |
| 牌堆为空 | pool=[] → drawnTile=null，索引 +1 |
| 不可变性 | 不修改原始 gameState |

### 7. checkWin — 胜利检测

| 测试用例 | 行为描述 |
|---|---|
| 无人胜利 | 双方手牌均非空 → false |
| player1 胜利 | player1 手牌为空 → 'player1' |
| player2 胜利 | player2 手牌为空 → 'player2' |
| AI 胜利 | AI 手牌为空 → 'AI' |

### 8. getValidMoves — 可行走法

| 测试用例 | 行为描述 |
|---|---|
| 有合法走法 | 手牌包含顺子 → moves.length > 0 |
| 无合法走法 | 手牌为空 → moves.length === 0 |

### 9. getAIMove — AI 自动决策

| 测试用例 | 行为描述 |
|---|---|
| 无法出牌时摸牌 | 手牌为空 → action='draw' |
| 有合法走法时出牌 | 手牌包含顺子 → action='play'，tilesToPlay >= 3 |
