const path = require("path")
const webpack = require("webpack")

const plugins =
  (process.env.NODE_ENV === "production"
    ? [new webpack.DefinePlugin({
        "process.env": {NODE_ENV: JSON.stringify("production")}
      })]
    : []
  ).concat(
    new webpack.optimize.CommonsChunkPlugin({
      name: "commons",
      filename: "js/commons.js"
    })
  ).concat(process.env.NODE_ENV === "production"
    ? [new webpack.optimize.UglifyJsPlugin({
        uglifyOptions: {
          compress: {warnings: false}
        }
      })]
    : [])

module.exports = {
  entry: {
    app: "./web/va/VaApp.jsx",
    selvitysApp: "./web/va/SelvitysApp.jsx",
    login: "./web/va/VaLogin.jsx"
  },
  output: {
    path: path.resolve(__dirname, "resources/public"),
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
          ].map(m => path.resolve(__dirname, m)),
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
      react: path.resolve(__dirname, 'node_modules/react'),
      "react-dom": path.resolve(__dirname, 'node_modules/react-dom')
    }
  },
  plugins: plugins
}
