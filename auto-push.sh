#!/usr/bin/env bash

# 自动提交并推送当前仓库的所有更改
# 使用方法：
#   ./auto-push.sh                # 自动生成提交信息
#   ./auto-push.sh "fix: xxx"     # 使用自定义提交信息

set -e  # 一旦出错就退出

# 检查是否在 git 仓库里
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "❌ 当前目录不是一个 Git 仓库，请切到项目根目录再运行。"
  exit 1
fi

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet; then
  echo "✅ 没有需要提交的更改。"
  exit 0
fi

# 提交信息：优先使用用户传入的参数，否则使用自动生成的
if [ -n "$1" ]; then
  MSG="$1"
else
  MSG="auto: update on $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "📦 添加所有更改..."
git add .

echo "📝 提交：$MSG"
git commit -m "$MSG"

echo "🚀 推送到远程仓库..."
git push

echo "✅ 完成！"

