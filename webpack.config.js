const outputDir = "./resources/public/"

const webpack = require("webpack");
const commonsPlugin = new webpack.optimize.CommonsChunkPlugin({
  name: "commons",
  filename: "js/commons.js"
})

const plugins = [commonsPlugin]

if (process.env.UGLIFY === "true") {
  const uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
      compress: {
          warnings: false
      }
  })
  plugins.push(uglifyJsPlugin)
}

module.exports = {
  entry: {
    app: "./web/va/VaApp.jsx",
    login: "./web/va/VaLogin.jsx"
  },
  output: {
    path: outputDir,
    filename: "js/[name].js",
    sourceMapFilename: "js/[name].map.json"
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel'
      },
      {
        test: /\.less$/,
        loader: "style!css!less"
      }
    ]
  },
  plugins: plugins
}