var outputDir = "./resources/public/"

var webpack = require("webpack");
var commonsPlugin = new webpack.optimize.CommonsChunkPlugin({
  name: "commons",
  filename: "js/commons.js"
});

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
  plugins: [commonsPlugin]
}