# Bookmark Vault

> 因为 X 账户被冻结，所以写了这个工具。永远把你的网页内容掌握在自己手里。

[![GitHub license](https://img.shields.io/github/license/your-username/bookmark-vault)](https://github.com/your-username/bookmark-vault/blob/main/LICENSE)

一个优雅的网页快照书签工具，使用 Jina Reader 抓取网页正文并保存到本地 SQLite 数据库。再也不用担心链接失效、账户被封或内容删除。

## ✨ 功能特点

- 📸 **网页快照** - 一键保存 URL 对应的完整正文内容
- 💾 **本地存储** - SQLite 数据库，数据完全在你手里
- 📖 **Markdown 渲染** - 支持表格、代码块、图片等富内容
- 🧹 **智能清理** - 自动去除广告、导航栏等噪音
- 🐳 **Docker 一键启动** - 零配置，开箱即用

## 🚀 快速开始

### Docker（推荐）

```bash
docker-compose up -d
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。数据持久化在 `./data` 目录。

### Node.js 本地运行

```bash
npm install
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。

## 🧪 网站兼容性实测

| 状态 | 网站 | 耗时 | 内容量 | 说明 |
|---|---|---|---|---|
| ✅ | **少数派** | 11.2s | 11074字 | 正常，内容完整 |
| ✅ | **V2EX** | 4.2s | 3783字 | 快，正常 |
| ✅ | **虎嗅** | 12.9s | 4863字 | 较慢但成功 |
| ✅ | **Medium** | 14.0s | 8180字 | 接近超时，成功 |
| ✅ | **Hacker News** | 9.6s | 3897字 | 正常 |
| ✅ | **Next.js Docs** | 11.0s | 98582字 | 超大文档，完整 |
| ✅ | **X 长文** | 12.3s | 1829字 | 成功 |
| ✅ | **微信公众号** | 3.8s | 262字 | ⚠️ 只抓到少量内容（防爬） |
| ✅ | **B站** | 7.6s | 2279字 | 能抓到视频描述/评论 |
| ✅ | **YouTube** | 4.9s | 2550字 | 能抓到视频描述 |
| ❌ | **掘金** | 1.6s | 0字 | HTTP 451（法律原因拒绝访问） |
| ❌ | **知乎专栏** | 1.3s | 0字 | HTTP 451（法律原因拒绝访问） |
| ⏱️ | **36氪** | 15s | 0字 | 超时（强反爬） |
| ⏱️ | **MDN** | 15s | 0字 | 超时（这次网络波动） |

**注意事项：**
- 掘金、知乎返回 HTTP 451，是平台主动拒绝 Jina 爬虫，无法绕过
- 微信公众号内容不完整，受限于防爬机制
- MDN 超时可能是网络波动，通常可以正常抓取
- 受网络状况影响，重试一次往往能解决

## 🛠️ 技术栈

- **框架**: Next.js 16 + React 19
- **语言**: TypeScript
- **数据库**: better-sqlite3
- **内容抓取**: Jina Reader
- **Markdown 渲染**: ReactMarkdown + remark-gfm
- **样式**: Tailwind CSS

## 📁 项目结构

```
bookmark-vault/
├── src/
│   ├── app/
│   │   ├── api/bookmarks/route.ts   # 书签 API（GET/POST）
│   │   ├── page.tsx                 # 主页面
│   │   ├── layout.tsx               # 布局
│   │   └── globals.css              # 全局样式
│   └── lib/
│       ├── db.ts                    # SQLite 数据库
│       └── extract-content.ts       # Jina Reader 封装
├── data/                            # 数据目录
├── public/                          # 静态资源
├── scripts/                         # 工具脚本
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 📦 数据存储

数据文件位于 `data/bookmarks.db`。

## 📜 License

MIT
