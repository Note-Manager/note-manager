const fs = require("node:fs");

module.exports = function glob(pattern, options, callback) {
    if (typeof options === "function") {
        return glob(pattern, {}, options);
    }
    fs.glob(pattern, {cwd: options.cwd}, callback);
};
