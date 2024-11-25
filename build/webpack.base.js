// 公共环境配置
const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')

const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: path.join(__dirname, '../src/index.tsx'),
    output: {
        filename: 'static/js/[name].js',
        path: path.join(__dirname, '../dist'),
        clean: true,
        publicPath: '/'
    },
    module: {
        rules: [
            // ts/tsx 支持
            {
                test: /.(ts|tsx)$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-react', '@babel/preset-typescript']
                    }
                }
            },
            // css/less 支持
            {
                test: /.(css|less)$/,
                use: ['style-loader', 'css-loader', 'postcss-loader', 'less-loader']
            },
            // 图片支持
            {
                test: /.(png|jpg|jpeg|gif|svg)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024,
                    }
                },
                generator: {
                    filename: 'static/asset/[name][ext]',
                }
            },
            // 字体支持
            {
                test: /.(woff2?|eot|ttf|otf)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024
                    }
                },
                generator: {
                    filename: 'static/fonts/[name][ext]'
                }
            },
            // 媒体支持
            {
                test: /.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 10 * 1024
                    }
                },
                generator: {
                    filename: 'static/media/[name][ext]'
                }
            }
        ]
    },

    resolve: {
        // ts 文件无法引入后缀为 ts/tsx 文件，使用 extension 在引入模块时不需要写文件后缀名
        extensions: ['.js', '.ts', '.tsx'],
        // 支持别名引入模块
        alias: {
            '@': path.join(__dirname, '../src')
        }
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, '../public/index.html'),
            inject: true
        }),
        new Dotenv({
            path: './.env', // 指定 .env 文件路径，默认是根目录的 .env
            safe: true,     // 如果为 true，则需要 .env.example 文件来验证环境变量
            systemvars: true // 将 process.env 的系统环境变量一起注入
        }),
    ],
    // 持久化存储缓存
    cache: {
        type: 'filesystem' // 使用文件缓存
    }

}