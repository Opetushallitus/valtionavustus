const path = require("path")

const makeConfig = (webpack, basedir) => {
  const plugins =
    (process.env.NODE_ENV === "production"
      ? [new webpack.DefinePlugin({
          "process.env.NODE_ENV": JSON.stringify("production")
        })]
      : []
    ).concat(
      new webpack.optimize.CommonsChunkPlugin({
        name: "commons",
        filename: "js/commons.js"
      }),
      new webpack.ProvidePlugin({
        Promise: "bluebird"
      })
    ).concat(process.env.NODE_ENV === "production"
      ? [new webpack.optimize.UglifyJsPlugin({
          uglifyOptions: {
            compress: {warnings: false}
          }
        })]
      : [])

  return {
    output: {
      path: path.resolve(basedir, "resources/public"),
      filename: "js/[name].js"
    },
    devtool: process.env.NODE_ENV === "production" ? false : "eval-source-map",
    module: {
      rules: [
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
          test: /\.(?:png|gif|jpe?g|svg)$/,
          loader: "url-loader"
        }
      ]
    },
    resolve: {
      alias: {
        bluebird: path.resolve(basedir, "../soresu-form/node_modules/bluebird"),
        react: path.resolve(basedir, 'node_modules/react'),
        "react-dom": path.resolve(basedir, 'node_modules/react-dom')
      }
    },
    plugins: plugins
  }
}

module.exports = makeConfig
