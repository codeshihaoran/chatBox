// 开发环境配置
const path = require('path')

const baseConfig = require('./webpack.base.js')

const { merge } = require('webpack-merge')

const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = merge(baseConfig, {
    mode: 'development', // 开发模式
    devtool: 'eval-cheap-module-source-map', // 源码调试模式
    // 配置本地服务器，devServer 可实现实时加载，代理功能
    devServer: {
        port: 3000,
        compress: false,
        hot: true,
        open: true, // 本地启动后，自动打开浏览器
        historyApiFallback: true,// 解决 history 路由404 问题
        static: {
            directory: path.join(__dirname, "../public") // 静态资源托管
        }
    },
    plugins: [
        // 避免修改 tsx 文件导致重新加载页面
        new ReactRefreshWebpackPlugin() // 添加热更新插件
    ]
})