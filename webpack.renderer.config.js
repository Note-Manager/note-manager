const rules = require('./webpack.rules').filter(rule =>
  rule.use !== 'node-loader' && rule.use?.loader !== '@vercel/webpack-asset-relocator-loader'
);

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx"]
  }
};
