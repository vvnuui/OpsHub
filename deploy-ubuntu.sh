#!/bin/bash
# 运维SSO系统 - Ubuntu部署脚本
# 支持Ubuntu 18.04/20.04/22.04

set -e  # 遇到错误立即退出

echo "========================================"
echo "   运维统一门户系统 - Ubuntu部署"
echo "========================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}警告: 建议不要使用root用户运行此脚本${NC}"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 确定项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="/data/yunwei_sso"

echo -e "${YELLOW}选择部署方式:${NC}"
echo "  1. 部署到 /data/yunwei_sso （推荐）"
echo "  2. 在当前目录部署 ($SCRIPT_DIR)"
echo "  3. 自定义部署路径"
echo ""
read -p "请选择 [1-3]: " -n 1 -r deploy_choice
echo ""

case $deploy_choice in
    1)
        PROJECT_DIR="$DEPLOY_DIR"
        ;;
    2)
        PROJECT_DIR="$SCRIPT_DIR"
        ;;
    3)
        read -p "请输入部署路径: " custom_path
        PROJECT_DIR="$custom_path"
        ;;
    *)
        echo -e "${YELLOW}无效选择，使用默认路径: /data/yunwei_sso${NC}"
        PROJECT_DIR="$DEPLOY_DIR"
        ;;
esac

echo -e "${CYAN}目标部署目录: $PROJECT_DIR${NC}"

# 如果目标目录不存在，则复制项目文件
if [ "$PROJECT_DIR" != "$SCRIPT_DIR" ]; then
    echo ""
    if [ -d "$PROJECT_DIR" ]; then
        echo -e "${YELLOW}目标目录已存在，是否覆盖? (y/n)${NC}"
        read -p "" -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}部署已取消${NC}"
            exit 1
        fi
        echo "   清理现有目录..."
        sudo rm -rf "$PROJECT_DIR"
    fi

    echo "   创建部署目录..."
    sudo mkdir -p "$PROJECT_DIR"

    echo "   复制项目文件..."
    sudo cp -r "$SCRIPT_DIR"/* "$PROJECT_DIR/"

    # 修改权限
    if [ "$EUID" -ne 0 ]; then
        echo "   设置文件权限..."
        sudo chown -R $USER:$USER "$PROJECT_DIR"
    fi

    echo -e "${GREEN}   ✓ 项目文件已复制到目标目录${NC}"
fi

cd "$PROJECT_DIR"
echo ""

# 1. 检查系统版本
echo -e "${YELLOW}1. 检查系统环境...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "   操作系统: $NAME $VERSION"
else
    echo -e "${RED}   ✗ 无法识别的操作系统${NC}"
    exit 1
fi

# 2. 检查并安装Node.js
echo ""
echo -e "${YELLOW}2. 检查Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}   Node.js未安装，正在安装...${NC}"

    # 使用NodeSource仓库安装Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✓ Node.js安装成功${NC}"
    else
        echo -e "${RED}   ✗ Node.js安装失败${NC}"
        exit 1
    fi
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}   ✓ Node.js已安装: $NODE_VERSION${NC}"
fi

NPM_VERSION=$(npm --version)
echo "   npm版本: $NPM_VERSION"

# 3. 安装依赖并构建前端
echo ""
echo -e "${YELLOW}3. 构建前端...${NC}"
cd "$PROJECT_DIR/frontend"

echo "   安装前端依赖..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}   ✗ 前端依赖安装失败${NC}"
    exit 1
fi

# 确保node_modules/.bin目录有执行权限
chmod -R +x node_modules/.bin 2>/dev/null || true

echo "   开始构建..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ 前端构建成功 -> frontend/dist${NC}"
else
    echo -e "${RED}   ✗ 前端构建失败${NC}"
    exit 1
fi

# 4. 安装后端依赖
echo ""
echo -e "${YELLOW}4. 安装后端依赖...${NC}"
cd "$PROJECT_DIR/backend"

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}   ✗ 后端依赖安装失败${NC}"
    exit 1
fi

# 确保node_modules/.bin目录有执行权限
chmod -R +x node_modules/.bin 2>/dev/null || true

echo -e "${GREEN}   ✓ 后端依赖安装完成${NC}"

# 5. 安装PM2（可选）
echo ""
echo -e "${YELLOW}5. 配置进程管理器...${NC}"
read -p "   是否安装PM2进程管理器? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if ! command -v pm2 &> /dev/null; then
        echo "   安装PM2..."
        sudo npm install -g pm2
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}   ✓ PM2安装成功${NC}"
        else
            echo -e "${RED}   ✗ PM2安装失败${NC}"
        fi
    else
        echo -e "${GREEN}   ✓ PM2已安装${NC}"
    fi
fi

# 6. 创建systemd服务（可选）
echo ""
echo -e "${YELLOW}6. 配置系统服务...${NC}"
read -p "   是否创建systemd服务（开机自启）? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    SERVICE_FILE="/etc/systemd/system/yunwei-sso.service"
    USER_NAME=$(whoami)

    echo "   创建systemd服务文件..."
    sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Yunwei SSO Portal Service
Documentation=https://github.com/your-repo/yunwei-sso
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$PROJECT_DIR/backend
ExecStart=/usr/bin/node src/app.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=yunwei-sso

# 环境变量
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✓ 服务文件创建成功${NC}"

        # 重载systemd配置
        sudo systemctl daemon-reload

        # 启用服务
        sudo systemctl enable yunwei-sso
        echo -e "${GREEN}   ✓ 服务已设置为开机自启${NC}"

        # 询问是否立即启动
        read -p "   是否立即启动服务? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo systemctl start yunwei-sso
            sleep 2
            if sudo systemctl is-active --quiet yunwei-sso; then
                echo -e "${GREEN}   ✓ 服务启动成功${NC}"
            else
                echo -e "${RED}   ✗ 服务启动失败，请查看日志: journalctl -u yunwei-sso -f${NC}"
            fi
        fi
    else
        echo -e "${RED}   ✗ 服务文件创建失败${NC}"
    fi
fi

# 7. 配置防火墙（可选）
echo ""
echo -e "${YELLOW}7. 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    read -p "   是否配置UFW防火墙开放3000端口? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo ufw allow 3000/tcp
        echo -e "${GREEN}   ✓ 防火墙规则已添加${NC}"
    fi
else
    echo "   UFW未安装，跳过防火墙配置"
fi

# 8. 完成提示
echo ""
echo "========================================"
echo -e "${GREEN}   部署完成！${NC}"
echo "========================================"
echo ""

echo -e "${CYAN}启动方式:${NC}"
echo ""

if systemctl list-unit-files yunwei-sso.service &> /dev/null; then
    echo -e "${YELLOW}方式1: 使用systemd服务${NC}"
    echo "  sudo systemctl start yunwei-sso      # 启动服务"
    echo "  sudo systemctl stop yunwei-sso       # 停止服务"
    echo "  sudo systemctl restart yunwei-sso    # 重启服务"
    echo "  sudo systemctl status yunwei-sso     # 查看状态"
    echo "  journalctl -u yunwei-sso -f          # 查看日志"
    echo ""
fi

if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}方式2: 使用PM2${NC}"
    echo "  cd $PROJECT_DIR/backend"
    echo "  pm2 start src/app.js --name yunwei-sso"
    echo "  pm2 logs yunwei-sso                  # 查看日志"
    echo "  pm2 restart yunwei-sso               # 重启"
    echo "  pm2 stop yunwei-sso                  # 停止"
    echo ""
fi

echo -e "${YELLOW}方式3: 直接启动${NC}"
echo "  cd $PROJECT_DIR/backend"
echo "  npm start                            # 前台运行"
echo "  nohup npm start > yunwei-sso.log 2>&1 &  # 后台运行"
echo ""

echo -e "${CYAN}访问地址:${NC}"
echo "  http://localhost:3000"
echo "  http://$(hostname -I | awk '{print $1}'):3000"
echo ""

echo -e "${CYAN}目录结构:${NC}"
echo "  配置文件: $PROJECT_DIR/backend/data/systems.json"
echo "  日志文件: journalctl -u yunwei-sso -f"
echo "  服务文件: /etc/systemd/system/yunwei-sso.service"
echo ""

echo -e "${CYAN}常用命令:${NC}"
echo "  # 更新代码后重新构建"
echo "  cd $PROJECT_DIR/frontend && npm run build"
echo "  sudo systemctl restart yunwei-sso"
echo ""
echo "  # 备份数据"
echo "  cp $PROJECT_DIR/backend/data/systems.json ~/systems.json.backup"
echo ""

echo -e "${GREEN}祝使用愉快！${NC}"
