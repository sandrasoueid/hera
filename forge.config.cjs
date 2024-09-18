const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
  packagerConfig: {
    asar: true,
    executableName: "hera",
    icon: "./assets/icon.ico",
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        "name": "hera",
        "authors": "Sandra Soueid",
        "description": "A daily, hourly planner.",
        "setupIcon": "./assets/icon.ico",
        "setupExe": "hera-setup.exe"
      },
    },
    {
      "name": "@electron-forge/maker-wix",
      "config": {
        "ui": {
          "chooseDirectory": true,
          "images": {
            "background": "./assets/background-493x312.bmp",
            "banner": "./assets/banner-493x58.bmp"
          }
        }
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      executableName: "hera",
      config: {
        options: {
          icon: "./assets/icon.png",
          name: "hera",
          productName: "Hera",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {},
    },
  ],
  buildIdentifier: "hera-build",
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {},
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
