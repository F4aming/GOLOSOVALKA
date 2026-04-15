const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const isDevServer = process.argv.some((a) => a === 'serve' || a.includes('webpack-dev-server'));
const mode = isDevServer ? 'development' : 'production';

const rawBase =
  process.env.APP_BASE_PATH !== undefined
    ? String(process.env.APP_BASE_PATH)
    : !isDevServer
      ? '/voting-platform'
      : '';

const appBasePath = rawBase.replace(/^\/+|\/+$/g, '');

// В dev всегда корень (localhost:3000/), иначе роутер и чанки расходятся с URL.
const clientAppBasePath = isDevServer ? '' : appBasePath;

// На GitHub Pages сайт в подкаталоге: относительный main.js при URL без "/" в конце
// превращается в /main.js → 404 и белый экран. Абсолютный publicPath от корня домена это чинит.
const publicPath = isDevServer ? '/' : appBasePath ? `/${appBasePath}/` : 'auto';

module.exports = {
  mode,
  entry: './src/main.tsx',
  output: {
    filename: mode === 'production' ? '[name].[contenthash].js' : 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 3000,
    open: true,
    hot: mode === 'development',
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      ...(appBasePath && !isDevServer
        ? { base: `/${appBasePath}/` }
        : {}),
    }),
    new webpack.DefinePlugin({
      'process.env.APP_BASE_PATH': JSON.stringify(clientAppBasePath),
      'process.env.API_BASE_URL': JSON.stringify(
        process.env.API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
      ),
    }),
  ],
};
