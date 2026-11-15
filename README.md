# FaceWinUnlock · 宣传页

FaceWinUnlock 的静态宣传站，水墨风格，支持日间 / 夜间双主题。FaceWinUnlock 是一款把面容识别接入 Windows 锁屏的工具：凭据由 WinLogon 直接校验，识别在本地完成，人脸数据不出本机。

> 本仓库仅包含宣传页面，不包含客户端源码。

## 目录结构

```
FaceWinUnlock/
├── index.html              # 首页
├── download.html           # 国内下载页（四个镜像、提取码复制）
├── changelog.html          # 历史版本页（Release 记录 + 贡献者头像组）
├── CNAME                   # GitHub Pages 自定义域名
├── README.md
├── .gitignore
└── assets/
    ├── css/
    │   ├── base.css        # 共用变量、重置、纸纹背景与夜间主题
    │   ├── home.css        # 首页样式
    │   ├── download.css    # 下载页样式
    │   └── changelog.css   # 历史版本页样式
    ├── js/
    │   ├── home.js         # 首页动效与交互
    │   ├── download.js     # 下载页主题切换、镜像卡片
    │   ├── changelog.js    # 版本页主题切换、筛选
    │   └── vendor/         # GSAP 3.12.5 + ScrollTrigger
    ├── fonts/              # Noto Serif SC / Noto Sans SC（按用字裁剪）
    └── avatars/            # 贡献者头像
```

## 页面结构

| 页面 | 区块 / 锚点 | 内容 |
| --- | --- | --- |
| `index.html` | `#top` | 主标题「抬头，即开。」、产品简介、下载入口、抖音 / 哔哩哔哩 / GitHub 平台入口 |
| | `#idea` | 项目由来，滚动钉住式段落过渡 |
| | `#features` | 系统级凭据注入、本地 2D DNN 识别、活体检测、全程离线，横向卡片轨道 |
| | `#stats` | 识别延迟、上传量、本地推理占比等数字滚动 |
| | `#download` | Releases、国内下载、历史版本、Beta 版、问题反馈与交流群入口 |
| `download.html` | — | 镜像站、蓝奏云、百度网盘、天翼云四张扇形卡片，提取码可一键复制 |
| `changelog.html` | — | 0.3.4 – 0.4.1 六个版本的更新要点，每行右下角为贡献者头像组 |

页内指向 GitHub、网盘、QQ 群的外链仍需联网才能打开。

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

- 纯静态站点，无构建步骤。样式与脚本按页面拆分为独立文件，公共变量集中在 `assets/css/base.css`：纸 `#f3ede3`、墨 `#17120d`、朱砂 `#b23b2c`。
- 动效由本地 GSAP 与 ScrollTrigger 驱动，不依赖 CDN；字体使用 Noto Serif SC / Noto Sans SC。
- 日间 / 夜间主题：默认按本地时间切换（19:00 – 07:00 为夜间），导航栏右侧按钮可手动覆盖；夜间铺 Canvas 字符渐变背景，并关闭滚动时的墨团转场红底。
- 系统开启「减少动态效果」时自动跳过字符拆分与滚动动画，内容直接可见；GSAP 加载失败时同样降级。
- 响应式布局，移动端隐藏竖排装饰与部分导航项，平台入口由竖排切换为横排。

## 相关链接

- 产品仓库：<https://github.com/zs1083339604/FaceWinUnlock-Tauri>
- 下载发行版：<https://github.com/zs1083339604/FaceWinUnlock-Tauri/releases>
- 国内下载：<https://wwbqv.lanzoul.com/b019vlktwf>（密码 5969）
- Beta 版：<https://download.mingqwq.top/>
- 交流群：<https://qm.qq.com/q/eRWoqsI9xu>

## 说明

FaceWinUnlock 自 2026-09 起为闭源商业软件，可试用后决定是否购买授权，商用请联系产品作者。
