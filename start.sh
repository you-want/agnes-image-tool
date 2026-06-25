#!/bin/bash

set -e

echo "========== Agnes Creator Studio 启动脚本 =========="

if [ -z "$AGNES_API_KEY" ]; then
    echo "警告: AGNES_API_KEY 环境变量未设置"
    echo "请在启动前设置: export AGNES_API_KEY='your-api-key'"
fi

echo "启动 Gradio 应用..."
python app.py