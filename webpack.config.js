const path = require('path');
const copyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
    entry: {
        content: './src/content.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    // mode: 'production',
    mode: 'development',
    devtool: false,
    watch: true,
    plugins: [
        new copyWebpackPlugin({
            patterns: [{ from: 'public' }]
        })
    ]
}