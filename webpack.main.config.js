module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: {
    index: './src/main.ts',
    'find-in-files-worker': './src/workers/FindInFilesWorker.ts',
  },
  output: {
    filename: '[name].cjs',
  },
  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  target: 'electron-main',
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx"],
    alias: {
      prettier$: "prettier/standalone"
    }
  }
};
