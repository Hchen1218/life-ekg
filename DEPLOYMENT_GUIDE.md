# Life EKG 部署指南

## 🎉 代码开发已完成！

所有必要的代码改动已完成。接下来需要进行部署配置。

---

## 📝 已完成的改动

✅ FortuneForm - 添加激活码输入框  
✅ verify-key API - Key验证接口  
✅ analyze API - 添加Key验证和消费逻辑  
✅ page.tsx - 前端Key验证流程  
✅ generate-keys.ts - 批量生成Key脚本  
✅ list-keys.ts - 查看Key状态脚本  
✅ package.json - 添加依赖和脚本命令  
✅ .env.example - 更新环境变量模板  

---

## 🚀 部署流程

### 步骤 1: 安装依赖

```bash
npm install
# 或
bun install
```

### 步骤 2: 注册 Upstash Redis（免费）

1. 访问 https://console.upstash.com/
2. 使用 GitHub 账号登录
3. 点击「Create Database」
4. 选择：
   - Name: `life-ekg-keys`
   - Type: `Regional`
   - Region: `ap-southeast-1` (新加坡，离中国最近)
5. 创建后，复制：
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
6. 粘贴到 `.env.local` 文件中

### 步骤 3: 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入真实值：

```env
SILICONFLOW_API_KEY=你的实际API_KEY
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
DEEPSEEK_MODEL=deepseek-ai/DeepSeek-V3.2

UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxXXX
```

### 步骤 4: 生成激活码

```bash
npm run keys:generate 50
```

这会生成 50 个激活码并保存到 Upstash Redis。复制输出的激活码列表保存为 Excel/表格。

### 步骤 5: 初始化 Git 并推送到 GitHub

```bash
git init
git add .
git commit -m "feat: add activation key system"
git branch -M main
git remote add origin https://github.com/你的用户名/life-ekg.git
git push -u origin main
```

### 步骤 6: 注册 Zeabur 并部署

1. 访问 https://zeabur.com
2. 使用 GitHub 账号登录
3. 点击「New Project」
4. 选择「Deploy from GitHub」
5. 选择你的 `life-ekg` 仓库
6. Zeabur 会自动检测为 Next.js 项目
7. 点击「Settings」→「Environment Variables」
8. 添加以下环境变量：
   - `SILICONFLOW_API_KEY`
   - `SILICONFLOW_BASE_URL`
   - `DEEPSEEK_MODEL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
9. 点击「Deploy」

等待约 2-3 分钟，部署完成后你会获得一个域名，如：`life-ekg-xxx.zeabur.app`

### 步骤 7: 测试

1. 访问你的网站
2. 填写表单信息
3. 输入一个激活码（从步骤4生成的列表中选一个）
4. 点击「开始分析」
5. 确认：
   - ✅ 激活码验证通过
   - ✅ 算命流程正常
   - ✅ 再次使用同一个激活码会提示「已被使用」

### 步骤 8: 查看激活码状态

```bash
npm run keys:list
```

会显示所有激活码的使用情况。

---

## 📊 运营流程

1. **生成激活码**：`npm run keys:generate 50`
2. **保存到表格**：复制输出的激活码列表
3. **上架销售**：在小红书/淘宝发布商品（¥9.9）
4. **发货**：用户购买后，从表格中找一个未发的Key发给用户
5. **标记已发**：在表格中标记该Key为「已发」
6. **补货**：Key快用完时再生成一批

---

## 🔧 Key 管理命令

```bash
# 生成 50 个激活码（默认）
npm run keys:generate

# 生成自定义数量
npm run keys:generate 100

# 查看所有激活码状态
npm run keys:list
```

---

## ⚠️ 注意事项

1. **不要提交 `.env.local`** - 已在 `.gitignore` 中
2. **定期检查 Key 使用情况** - 使用 `npm run keys:list`
3. **Zeabur 免费额度** - 每月 $5，小规模试水足够
4. **Upstash 免费额度** - 每天 10,000 次请求

---

## 🌐 备案后优化（可选）

备案完成后，可以：

1. 在 Zeabur 绑定你的备案域名
2. 或迁移到阿里云/腾讯云 Serverless（成本更低，速度更快）

---

## ❓ 常见问题

### Q: 如何修改激活码格式？
A: 编辑 `scripts/generate-keys.ts` 中的 `generateKey()` 函数

### Q: 如何查看某个激活码是否被使用？
A: 运行 `npm run keys:list` 查看所有激活码状态

### Q: 部署后访问慢怎么办？
A: Zeabur 香港节点对中国大陆访问尚可。若需更快速度，建议备案后绑定域名或迁移到国内云。

---

## 📞 下一步

1. 按照上述步骤完成部署
2. 测试完整流程
3. 在小红书/淘宝上架
4. 开始营业！

有问题随时问我。祝生意兴隆！🎉
