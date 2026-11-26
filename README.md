# 启动主页

一个单文件的浏览器启动页：搜索框 + 快捷方式网格。
纯 HTML/CSS/JS，无框架、无构建、无外部依赖，可离线使用，能装到桌面当 App。

> 代码由 Claude 提供，我负责提需求、试用和润色。

## 功能

- **搜索框**：回车直达网址或搜索，支持 Google / Bing / DuckDuckGo 切换
  - 输入 `google.com`、`192.168.1.10:5000`、`localhost:3000` 直接打开
  - 输入「你好 世界」这类内容交给搜索引擎
  - 点「搜索」按钮则强制搜索（想搜 `google.com` 这个词本身时用）
- **快捷方式网格**：自动抓取网站 favicon，抓不到时用首字母彩色占位；也可以自己上传图片当图标
  - 长按（桌面端右键）弹出菜单：新标签页打开 / 移动 / 编辑 / 删除
  - 移动模式：`←` `→` 一格一格调整顺序
- **数据管理**：一键导出 / 导入 JSON 备份（支持合并或覆盖），换设备、换浏览器不丢书签
- **PWA**：带 manifest 和 Service Worker，可添加到主屏幕全屏运行，断网也能打开
- **移动端优先**：适配刘海屏安全区，禁掉点击高亮，手机键盘「前往」键直接跳转

## 快速开始

直接用浏览器打开 `index.html` 即可。

想要完整功能（离线缓存、安装到桌面）需要放在 **HTTPS** 环境：

```bash
# 本地起个服务
python3 -m http.server 8000
# 访问 http://localhost:8000
```

或者直接丢到 GitHub Pages / Vercel / Cloudflare Pages 上。

### 装到主屏幕

- **Android (Chrome)**：右上角菜单 →「添加到主屏幕」
- **iOS / iPadOS (Safari)**：分享 →「添加到主屏幕」

## 键盘快捷键

| 按键 | 作用 |
| --- | --- |
| `/` | 聚焦搜索框 |
| `Enter` | 直达网址 / 搜索 |
| `Ctrl/⌘ + 点击` | 在新标签页打开快捷方式 |
| `←` `→` | 移动模式下调整位置 |
| `Esc` | 关闭弹窗 / 退出移动模式 |

## 文件结构

```
.
├── index.html      # 全部页面、样式和逻辑
├── manifest.json   # PWA 配置（名称、图标、启动方式）
├── sw.js           # Service Worker：离线缓存
├── icons/          # 图标（192 / 512 / maskable / apple-touch）
└── README.md
```

## 数据存放在哪

全部存在浏览器的 `localStorage`（键名 `launcher_v3`），不上传任何服务器。

⚠️ 清除浏览器数据 / 换浏览器 / 换设备都会丢失，**建议定期在「数据管理」里导出备份**。
装到主屏幕的 PWA 不受 Safari 7 天存储清理限制，长期用建议安装。

## 已知限制

- 只支持 `http` / `https` 网址，不支持 `file://`（浏览器也不允许网页跳本地文件）
- 必须用 HTTPS 或 `localhost` 打开，`file://` 下 Service Worker 不会注册，没有离线和安装能力
- 快捷方式图标需要联网抓取 favicon，抓不到就显示首字母占位，属正常
- 单个浏览器理论上限 200 个快捷方式

## 浏览器支持

Chrome / Edge / Firefox / Safari（含 iOS 15.4+、iPadOS）均可用。

## 致谢

- 感谢 Deepseek 老师提供的README.md介绍
- 感谢 Claude 代码
