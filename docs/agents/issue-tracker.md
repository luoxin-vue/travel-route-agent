# Issue 追踪系统：GitHub

本仓库的 Issue 和 PRD 文档使用 GitHub Issues 进行管理。所有相关操作使用 `gh` CLI 命令行工具执行。

## 操作规范

- **创建 Issue**：`gh issue create --title "..." --body "..."`。多行内容请使用 heredoc 格式。
- **读取 Issue**：`gh issue view <数字> --comments`，可以通过 `jq` 过滤评论内容并获取标签列表。
- **列出 Issue**：`gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'`，配合适当的 `--label` 与 `--state` 筛选条件。
- **评论 Issue**：`gh issue comment <数字> --body "..."`
- **添加/移除标签**：`gh issue edit <数字> --add-label "..."` / `--remove-label "..."`
- **关闭 Issue**：`gh issue close <数字> --comment "..."`

自动推导仓库：在 Git 克隆仓库内部运行时，`gh` 会根据 `git remote -v` 自动判定对应仓库。

## 当 Skill 提示“发布到 Issue 追踪系统”时

创建一个新的 GitHub issue。

## 当 Skill 提示“获取相关 Ticket”时

运行 `gh issue view <数字> --comments`。
