# Bookmark Vault

> 因为 X 账户被冻结，所以写了这个工具。永远把你的网页内容掌握在自己手里。

![License](https://img.shields.io/badge/license-MIT-blue)

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

- ✅ | **少数派** |
- ✅ | **V2EX** |
- ✅ | **虎嗅** |
- ✅ | **Medium** |
- ✅ | **Hacker News** |
- ✅ | **Next.js Docs** |
- ✅ | **X 长文** |
- ✅ | **B站** |能抓到视频描述/评论 |
- ✅ | **YouTube** |能抓到视频描述 |
- ✅ | **MDN** |
- ⚠️ | **微信公众号** |只抓到少量内容（防爬） |
- ❌ | **掘金** | HTTP 451（法律原因拒绝访问） |
- ❌ | **知乎专栏** | HTTP 451（法律原因拒绝访问） |
- ⏱️ | **36氪** |超时（强反爬） |

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
