const {node} = require("prop-types");
module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main.ts',
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  target: 'electron-main',
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx"]
  }
};
