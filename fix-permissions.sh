#!/bin/bash
# 修复部署后的权限问题

echo "=========================================="
echo "   修复文件权限"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 获取部署目录
if [ -d "/data/yunwei_sso" ]; then
    PROJECT_DIR="/data/yunwei_sso"
elif [ -d "$(pwd)/backend" ]; then
    PROJECT_DIR="$(pwd)"
else
    echo "请在项目根目录运行此脚本，或确保项目已部署到 /data/yunwei_sso"
    exit 1
fi

echo -e "${CYAN}项目目录: $PROJECT_DIR${NC}"
echo ""

# 修复前端权限
if [ -d "$PROJECT_DIR/frontend/node_modules/.bin" ]; then
    echo -e "${YELLOW}1. 修复前端可执行文件权限...${NC}"
    chmod -R +x "$PROJECT_DIR/frontend/node_modules/.bin"
    echo -e "${GREEN}   ✓ 前端权限已修复${NC}"
fi

# 修复后端权限
if [ -d "$PROJECT_DIR/backend/node_modules/.bin" ]; then
    echo -e "${YELLOW}2. 修复后端可执行文件权限...${NC}"
    chmod -R +x "$PROJECT_DIR/backend/node_modules/.bin"
    echo -e "${GREEN}   ✓ 后端权限已修复${NC}"
fi

# 修复整体目录权限
echo ""
echo -e "${YELLOW}3. 修复整体文件权限...${NC}"
chmod -R 755 "$PROJECT_DIR"
chmod 644 "$PROJECT_DIR/backend/data/systems.json" 2>/dev/null || true
echo -e "${GREEN}   ✓ 文件权限已修复${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}   权限修复完成！${NC}"
echo "=========================================="
echo ""
echo "现在可以继续构建："
echo "  cd $PROJECT_DIR/frontend"
echo "  npm run build"
