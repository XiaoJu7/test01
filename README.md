# 家庭库存管理系统

这是一款专为家庭设计的库存和保质期管理软件，支持食品、药品、蔬菜和水果的管理。

## 功能特点
- **物品管理**: 记录物品名称、生产日期、保质期和分类。支持按重量管理生鲜果蔬。
- **出入库管理**: 记录入库数量/重量，支持部分消耗或全部出库。
- **保质期可视化**: 列表和卡片视图，颜色区分状态（正常、临期、已过期）。
- **提醒机制**: 支持邮件提醒和企业微信机器人定时推送。
- **多账号支持**: 家庭成员独立账号，数据隔离。

## 部署指南 (群晖 NAS)

本项目支持在群晖 NAS 上通过 Docker 或直接运行 Node.js 部署。所有数据均存储在本地 `data/` 目录下。

### 环境变量配置
在项目根目录创建 `.env` 文件，并配置以下环境变量：

```env
# JWT 密钥 (用于用户认证，请修改为随机字符串)
JWT_SECRET=your_super_secret_key_here

# SMTP 邮件服务配置 (用于发送临期提醒)
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
```

### 方式一：Docker 部署 (推荐)

1. **准备 Dockerfile**
   在项目根目录创建 `Dockerfile`:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **构建镜像**
   通过 SSH 连接到群晖，在项目目录下运行：
   ```bash
   docker build -t family-inventory .
   ```

3. **运行容器**
   ```bash
   docker run -d \
     --name family-inventory \
     -p 3000:3000 \
     -v /volume1/docker/family-inventory/data:/app/data \
     --env-file .env \
     --restart unless-stopped \
     family-inventory
   ```
   *注意：请将 `/volume1/docker/family-inventory/data` 替换为您群晖上的实际路径，以确保数据库文件持久化。*

### 方式二：直接运行 (Node.js 环境)

1. 在群晖套件中心安装 **Node.js v20**。
2. 通过 SSH 连接到群晖，进入项目目录。
3. 安装依赖：
   ```bash
   npm install
   ```
4. 构建前端代码：
   ```bash
   npm run build
   ```
5. 启动服务：
   ```bash
   npm start
   ```
   *建议使用 `pm2` 等工具来管理进程，确保服务在后台持续运行。*

## 使用说明
1. 访问 `http://<群晖IP>:3000`。
2. 注册新账号并登录。
3. 在“设置”页面配置接收提醒的邮箱和企业微信机器人 Webhook 地址。
4. 开始添加物品和管理库存！
