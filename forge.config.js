const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./resources/Icons/note-manager.png",
    extraResource: [
      "./resources/Themes",
      "./resources/Icons",
    ],
    appCategoryType: "public.app-category.utilities",
    win32metadata: {
      CompanyName: "Note Manager",
      FileDescription: "Note Manager App",
      OriginalFileName: "NoteManager.exe",
      ProductName: "Note Manager"
    }
  },
  appBundleId: 'github.note-manager.note-manager',
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
      icon: "./resources/Icons/note-manager.png"
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      icon: "./resources/Icons/note-manager.png"
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        categories: ["Utility", "TextEditor"],
        icon: "./resources/Icons/note-manager.png"
      },
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
