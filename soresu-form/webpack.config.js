const webpack = require("webpack")
const parentConfig = require("../parent-webpack.config")

module.exports = parentConfig(webpack, __dirname)
