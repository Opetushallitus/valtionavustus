const path = require("path")
const TerserPlugin = require('terser-webpack-plugin')

const makeConfig = (webpack, basedir) => {
  return {
    mode: process.env.NODE_ENV || 'development',
    output: {
      path: path.resolve(basedir, "resources/public"),
      filename: "js/[name].js"
    },
    module: {
      rules: [
        {
          test: /\.(ts)x?$/,
          exclude: /node_modules/,
          loader: 'ts-loader'
        },
        {
          test: /\.jsx?$/,
          include:
            [
              "web/",
              "../soresu-form/web/",
              "../va-common/web/"
            ].map(m => path.resolve(basedir, m)),
          use: {
            loader: "babel-loader",
            options: {
              cacheDirectory: true
            }
          }
        },
        {
          test: /\.less$/,
          use: [
            {loader: "style-loader"},
            {loader: "css-loader"},
            {loader: "less-loader"}
          ]
        },
        {
          test: /\.css$/,
          use: [
            {loader: "style-loader"},
            {loader: "css-loader"}
          ]
        },
        {
          test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
                outputPath: 'fonts/'
              }
            }
          ]
        },
        {
          test: /\.(?:png|gif|jpe?g|svg)$/,
          loader: "url-loader"
        }
      ]
    },
    resolve: {
      alias: {
        "soresu-form": path.resolve(basedir, "../soresu-form"),
        "va-common": path.resolve(basedir, "../va-common")
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /(soresu-form|va-common)/,
            name: 'commons',
            chunks: 'all'
          }
        }
      }
    }
  }
}

module.exports = makeConfig
