const webpack = require("webpack")
const parentConfig = require("../parent-webpack.config")

module.exports = Object.assign(
  {},
  parentConfig(webpack, __dirname),
  {
    entry: {
      app: "./web/va/HakemustenArviointiApp.jsx",
      adminApp: "./web/va/HakujenHallintaApp.jsx",
      summaryApp: "./web/va/YhteenvetoApp.jsx",
      login: "./web/va/Login.jsx"
    }
  }
)
