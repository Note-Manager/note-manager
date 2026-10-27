const rules = [...require('./webpack.rules')];

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  module: {
    rules,
  },
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx"],
    alias: {
      prettier$: "prettier/standalone"
    }
  }
};
