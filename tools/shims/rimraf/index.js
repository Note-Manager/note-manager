const fs = require("node:fs");

const toRmOptions = (options = {}) => ({recursive: true, force: true, maxRetries: options.maxBusyTries});

module.exports = function rimraf(path, options, callback) {
    if (typeof options === "function") {
        return rimraf(path, {}, options);
    }
    fs.rm(path, toRmOptions(options), callback);
};

module.exports.sync = (path, options) => fs.rmSync(path, toRmOptions(options));
