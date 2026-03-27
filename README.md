# ZAPI

## 准备搭建环境

```
node -v
v22.22.0

# 搭建
npm create electron-vite@latest zapi -- --template vue-ts
mv zapi.... zapi # 生成会携带后缀
```

## 开发模式

这个项目现在支持两种目标：

- Web 开发：只启动 Vite，不加载 Electron
- Electron 开发：启动 Vite，并通过 Electron 打开桌面窗口

常用命令：

```bash
# 纯 Web 开发
npm run dev:web

# Electron 开发
npm run dev:electron

# Web 构建
npm run build:web

# Electron 构建安装包
npm run build:electron
```

## 配置原理

项目通过环境变量 `APP_TARGET` 区分构建目标：

- `APP_TARGET=electron` 时，加载 `vite-plugin-electron`
- 未设置时，按普通 Vite Web 项目运行

这样可以复用同一套 Vue 页面代码，同时分别支持浏览器和 Electron 桌面端。
