# FaceWinUnlock · 宣传页

FaceWinUnlock 的水墨风单页宣传站。FaceWinUnlock 是一款把面容识别接进 Windows 锁屏的工具：凭据由 WinLogon 直接校验，识别全程在本地完成，人脸数据不出本机。

本仓库只包含这一个静态宣传页面，不包含客户端源码。

## 预览

页面为纯静态 HTML，无构建步骤。直接双击 `FaceWinUnlock.html`，或起一个本地服务：

```powershell
python -m http.server 8080
# 打开 http://localhost:8080/FaceWinUnlock.html
```

## 页面结构

| 区块 | id | 内容 |
| --- | --- | --- |
| 首屏 | — | 主标题「抬头，即开。」、简介与下载入口 |
| 壹 · 缘起 | `idea` | 项目由来，钉住式段落过渡 |
| 贰 · 功能 | `features` | 四张功能卡片，横向滚动轨道 |
| 叁 · 数据 | `stats` | 延迟 / 上传量 / 本地推理占比等数字滚动 |
| 肆 · 下载 | `download` | Releases、蓝奏云镜像与相关链接 |

## 技术说明

- 单文件 HTML + 内联 CSS，样式变量集中在 `:root`（纸 `#f3ede3` / 墨 `#17120d` / 朱砂 `#b23b2c`）。
- 动效依赖仓库内置的 [GSAP](https://gsap.com/) 与 ScrollTrigger（`vendor/` 目录），不依赖 CDN。
- 系统开启「减少动态效果」时自动降级：跳过字符拆分与滚动动画，内容直接可见。
- 响应式布局，移动端隐藏竖排装饰文字与部分导航项。

## 相关链接

- 产品仓库：https://github.com/zs1083339604/FaceWinUnlock-Tauri
- 下载发行版：https://github.com/zs1083339604/FaceWinUnlock-Tauri/releases

## 说明

FaceWinUnlock 自 2026-09 起为闭源商业软件，可试用后决定是否购买授权，商用请联系产品作者。
