const webpack = require("webpack")
const path = require("path")
const TerserPlugin = require('terser-webpack-plugin')

const makeConfig = (basedir, componentName) => {
  return {
    mode: process.env.NODE_ENV || 'development',
    output: {
      path: path.resolve(basedir,`resources/public/${componentName}`),
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
              "../soresu-form/web/"
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
            {
              loader: "css-loader",
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[local]__[hash:base64]',
                },
              },
            },
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
          test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
          use: 'url-loader?name=[name].[ext]',
        },
        {
          test: /\.(?:png|gif|jpe?g|svg)$/,
          loader: "url-loader"
        }
      ]
    },
    resolve: {
      alias: {
        "soresu-form": path.resolve(basedir, "../soresu-form")
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /soresu-form/,
            name: 'commons',
            chunks: 'all'
          }
        }
      }
    }
  }
}

const virkailijaConfig = Object.assign(
  {},
  makeConfig(path.resolve(__dirname, "va-virkailija"), "virkailija"),
  {
    entry: {
      app: path.resolve(__dirname, "va-virkailija/web/va/HakemustenArviointiApp.tsx"),
      adminApp: path.resolve(__dirname, "va-virkailija/web/va/HakujenHallintaApp.tsx"),
      summaryApp: path.resolve(__dirname, "va-virkailija/web/va/YhteenvetoApp.jsx"),
      login: path.resolve(__dirname, "va-virkailija/web/va/Login.jsx"),
      codeValues: path.resolve(__dirname, "va-virkailija/web/va/KoodienhallintaApp.tsx"),
    }
  }
)

const hakijaConfig = Object.assign(
  {},
  makeConfig(path.resolve(__dirname, "va-hakija"), "hakija"),
  {
    entry: {
      app: path.resolve(__dirname, "va-hakija/web/va/VaApp.tsx"),
      selvitysApp: path.resolve(__dirname, "va-hakija/web/va/SelvitysApp.tsx"),
      login: path.resolve(__dirname, "va-hakija/web/va/VaLogin.jsx"),
      muutoshakemusApp: path.resolve(__dirname, "va-hakija/web/va/muutoshakemus/MuutoshakemusApp.tsx"),
    }
  }
)


module.exports = [
  hakijaConfig,
  virkailijaConfig,
]
