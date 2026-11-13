# FaceWinUnlock · 宣传页

FaceWinUnlock 的静态宣传页，水墨风格单页站点。FaceWinUnlock 是一款把面容识别接入 Windows 锁屏的工具：凭据由 WinLogon 直接校验，识别在本地完成，人脸数据不出本机。

> 本仓库仅包含宣传页面，不包含客户端源码。

## 目录结构

```
FaceWinUnlock/
├── index.html              # 页面入口（单文件，内联 CSS 与脚本）
├── CNAME                   # GitHub Pages 自定义域名
├── README.md
└── vendor/
    ├── gsap.min.js         # GSAP 3.12.5
    └── ScrollTrigger.min.js
```

## 页面结构

| 区块 | 锚点 | 内容 |
| --- | --- | --- |
| 首屏 | `#top` | 主标题「抬头，即开。」、产品简介、下载入口、抖音 / 哔哩哔哩 / GitHub 平台入口 |
| 壹 · 缘起 | `#idea` | 项目由来，滚动钉住式段落过渡 |
| 贰 · 功能 | `#features` | 系统级凭据注入、本地 2D DNN 识别、活体检测、全程离线，横向卡片轨道 |
| 叁 · 数据 | `#stats` | 识别延迟、上传量、本地推理占比等数字滚动 |
| 肆 · 下载 | `#download` | Releases、国内镜像（密码 5969）、问题反馈入口 |

## 本地预览

无需构建，直接打开 `index.html`，或启动任意静态服务器：

```bash
python -m http.server 8080
# 访问 http://localhost:8080/
```

## 部署

站点通过 GitHub Pages 托管，`main` 分支根目录直接发布：

1. 仓库 **Settings → Pages**，Source 选择 `Deploy from a branch`；
2. 分支选 `main`，目录选 `/ (root)`；
3. 自定义域名由根目录 `CNAME` 指定（当前为 `fach.bodom.cn`），并在 Pages 中开启 **Enforce HTTPS**。

入口文件必须命名为 `index.html`，否则站点根路径无法访问。

## 技术说明

- 单文件 HTML + 内联 CSS，主题色变量集中在 `:root`：纸 `#f3ede3`、墨 `#17120d`、朱砂 `#b23b2c`。
- 动效由本地 GSAP 与 ScrollTrigger 驱动，不依赖 CDN；字体使用 Noto Serif SC / Noto Sans SC。
- 系统开启「减少动态效果」时自动跳过字符拆分与滚动动画，内容直接可见；GSAP 加载失败时同样降级。
- 响应式布局，移动端隐藏竖排装饰与部分导航项，平台入口由竖排切换为横排。

## 相关链接

- 产品仓库：<https://github.com/zs1083339604/FaceWinUnlock-Tauri>
- 下载发行版：<https://github.com/zs1083339604/FaceWinUnlock-Tauri/releases>
- 国内下载：<https://wwbqv.lanzoul.com/b019vlktwf>（密码 5969）

## 说明

FaceWinUnlock 自 2026-09 起为闭源商业软件，可试用后决定是否购买授权，商用请联系产品作者。
