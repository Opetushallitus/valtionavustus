const webpack = require("webpack")
const parentConfig = require("../parent-webpack.config")

module.exports = Object.assign(
  {},
  parentConfig(webpack, __dirname),
  {
    entry: {
      app: "./web/va/VaApp.jsx",
      selvitysApp: "./web/va/SelvitysApp.jsx",
      login: "./web/va/VaLogin.jsx"
    }
  }
)
