const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const plugins = [new ForkTsCheckerWebpackPlugin()]

const makeConfig = (basedir, componentName) => {
  return {
    mode: process.env.NODE_ENV || 'development',
    output: {
      path: path.resolve(basedir, `../server/resources/public/${componentName}`),
      filename: 'js/[name].js',
    },
    module: {
      rules: [
        {
          test: /\.(ts)x?$/,
          exclude: /node_modules/,
          loader: 'ts-loader',
        },
        {
          test: /\.jsx?$/,
          include: ['web/', '../soresu-form/web/'].map((m) => path.resolve(basedir, m)),
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.less$/,
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[local]__[hash:base64]',
                },
              },
            },
            { loader: 'less-loader' },
          ],
        },
        {
          test: /\.css$/,
          use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
        },
        {
          test: /\.(?:png|gif|jpe?g|svg)$/,
          type: 'asset/inline',
        },
      ],
    },
    plugins,
    resolve: {
      alias: {
        'soresu-form': path.resolve(basedir, '../soresu-form'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /soresu-form/,
            name: 'commons',
            chunks: 'all',
          },
        },
      },
    },
  }
}

const virkailijaConfig = Object.assign(
  {},
  makeConfig(path.resolve(__dirname, 'va-virkailija'), 'virkailija'),
  {
    entry: {
      app: path.resolve(
        __dirname,
        'va-virkailija/web/va/hakemusten-arviointi-page/HakemustenArviointiApp.tsx'
      ),
      adminApp: path.resolve(
        __dirname,
        'va-virkailija/web/va/hakujen-hallinta-page/HakujenHallintaApp.tsx'
      ),
      summaryApp: path.resolve(__dirname, 'va-virkailija/web/va/yhteenveto-page/YhteenvetoApp.jsx'),
      login: path.resolve(__dirname, 'va-virkailija/web/va/login-page/Login.jsx'),
      codeValues: path.resolve(
        __dirname,
        'va-virkailija/web/va/koodienhallinta-page/KoodienhallintaApp.tsx'
      ),
      search: path.resolve(__dirname, 'va-virkailija/web/va/search-page/SearchApp.tsx'),
    },
  }
)

const hakijaConfig = Object.assign({}, makeConfig(path.resolve(__dirname, 'va-hakija'), 'hakija'), {
  entry: {
    app: path.resolve(__dirname, 'va-hakija/web/va/VaApp.tsx'),
    selvitysApp: path.resolve(__dirname, 'va-hakija/web/va/SelvitysApp.tsx'),
    login: path.resolve(__dirname, 'va-hakija/web/va/VaLogin.tsx'),
    muutoshakemusApp: path.resolve(
      __dirname,
      'va-hakija/web/va/muutoshakemus/MuutoshakemusApp.tsx'
    ),
  },
})

module.exports = [hakijaConfig, virkailijaConfig]
