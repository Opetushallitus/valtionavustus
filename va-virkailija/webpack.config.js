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
    app: "./web/va/HakemustenArviointiApp.jsx",
    adminApp: "./web/va/HakujenHallintaApp.jsx",
    login: "./web/va/Login.jsx"
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
        include: /(va-virkailija\/web|va-common\/web|soresu-form\/web)/,
        loader: 'babel'
      },
      {
        test: /\.less$/,
        loader: "style!css!less"
      },
      {
        test: /\.png$/,
        loader: "url-loader",
        query: { mimetype: "image/png" }
      },
      {
        include: /\.json$/,
        loaders: ["json-loader"]
      }
    ]
  },
  plugins: plugins
}
