module.exports = [
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-react'],
      },
    }
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|.webpack)/,
    loader: 'ts-loader',
    options: {
      transpileOnly: true
    }
  }
];
