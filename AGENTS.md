# AGENTS.md

## 项目概述
- **类型**: Chrome/Edge Manifest V3 浏览器扩展
- **功能**: 按住 Alt 键点击页面元素，可视化显示该元素的 DOM 路径和内容
- **语言**: 纯前端 (HTML/CSS/JS)，无构建工具、无依赖

## 目录结构
```
├── manifest.json      # 扩展配置 (MV3)
├── content.js         # 内容脚本 - 核心逻辑 (元素路径追踪 + 弹窗)
├── content.css        # 内容脚本样式
├── background.js      # Service Worker (当前为空)
├── popup.html         # 扩展图标点击弹出的页面
└── images/            # 扩展图标 (16/48/128px)
```

## 开发命令
- **无构建步骤** - 直接修改文件即可生效
- **加载扩展**: 浏览器打开 `chrome://extensions/` 或 `edge://extensions/` → 开启开发者模式 → 加载已解压的扩展程序 → 选择此目录
- **重新加载**: 修改代码后点击扩展卡片上的刷新按钮

## 交互逻辑
- 按住配置的修饰键组合进入检测模式，鼠标悬停元素时绘制绿色边缘高亮框
- 点击高亮元素后显示路径弹窗，包含"复制路径"和"关闭"按钮
- 弹窗 class 为 `custom-dialog-box`，样式定义在 `content.css`
- 高亮框 class 为 `inspect-highlight`，通过 `mousemove` 实时更新位置
- 释放修饰键退出检测模式，清除高亮框
- 修饰键配置通过 `chrome.storage.local` 持久化，默认 `shift + alt`
- 弹窗设置页 (`popup.html`) 支持用户勾选 Ctrl/Alt/Shift 组合，实时显示当前激活方式

## 约定
- 使用中文注释和中文交流
- 代码中使用原生 JS，无框架依赖
- 文件编码为 UTF-8
