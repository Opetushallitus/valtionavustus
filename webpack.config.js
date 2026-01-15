const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

const plugins = [new ForkTsCheckerWebpackPlugin()]

const makeConfig = (basedir, componentName) => {
  const env = process.env.NODE_ENV || 'development'
  const devtool = env === 'production' ? 'source-map' : 'eval'
  return {
    mode: env,
    devtool,
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
          test: /\.css$/,
          use: [
            { loader: 'style-loader' },
            {
              loader: 'css-loader',
              options: {
                modules: {
                  auto: /\.module\.\w+$/i,
                  localIdentName: '[local]__[hash:base64]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    [
                      'postcss-preset-env',
                      {
                        // Options
                        stage: 2,
                        features: {
                          'nesting-rules': true,
                        },
                      },
                    ],
                  ],
                },
              },
            },
          ],
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
