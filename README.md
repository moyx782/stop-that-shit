# Stop That Shit Lite

精简的 Codex Hook + Skill：限制明确任务越界。需要 Node.js 18+。

## 指令

在提示词第一行使用：

`$stop-that-shit review -- 只审查，不修改`

或：

`$stop-that-shit change hash=allow agents=0 -- 修复当前问题`

保留范围：只读模式写操作拦截、可识别的哈希操作授权、子 Agent 启动预算、一个 Skill 和最小 Node 测试。

## 安装

将 `hooks/codex-hooks.json` 合并到 Codex Hook 配置，并把命令路径替换为 `hooks/stop-that-shit.cjs` 的绝对路径。检查并信任 Hook 后，在新会话中测试。

## 验证

`npm test`

## 限制

这是独立轻量实现，不是原项目全部功能的等价替代。命令识别使用启发式，不能替代宿主沙箱、权限与人工审查；未知或无法识别的副作用可能漏检。默认未启用模式时仅观察。

MIT，见 LICENSE。
