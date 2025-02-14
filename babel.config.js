module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript',
    '@babel/preset-react'
  ],
  plugins: [
    ['module-resolver', {
      alias: {
        '@utils': './src/utils',
        '@works': './src/works',
        '@tests': './src/tests',
        '@client': './src/client',
        '@clientPuppeteer': './src/clientPuppeteer',
        '@': '.'
      }
    }],
    [
      require('@babel/plugin-proposal-decorators').default,
      {
        legacy: true
      }
    ],
  ],
  ignore: [
    '**/*.spec.ts'
  ]
}
