// 打包环境配置

const path = require('path')

const { merge } = require('webpack-merge')

const baseConfig = require('./webpack.base')

const CopyPlugin = require('copy-webpack-plugin')

module.exports = merge(baseConfig, {
    mode: 'production', // 生产模式：压缩代码和开始 tree-shaking 
    // 打包环境：静态资源托管
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, '../public'),
                    to: path.resolve(__dirname, '../dist'),
                    filter: source => {
                        return !source.includes('index.html') // 忽略index.html htmlWebpackPlugin 会在 dist 自动生成
                    }
                }
            ]
        })
    ]
})
