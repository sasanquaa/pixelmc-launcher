var child_process   = require('child_process');
var shellEscape     = require('shell-escape');
var exec            = child_process.exec;

var UnrarModule = function(options) {
    this._filePath = options.path || options;
};

UnrarModule.prototype.extract = function(dstPath, options, cb) {
    var _self   = this;
    dstPath     = escape(dstPath);

    _self._execute(['x'], dstPath, function(err, data) {
        if (err) return cb(new Error(err));

        cb(null, data);
    });
};

UnrarModule.prototype._execute = function(args, dstPath, cb) {
    var execCommand = "unrar " + args.join() + ' ' + escape(this._filePath);

    if(dstPath) execCommand += ' ' + dstPath;

    exec(execCommand, function(err, stdout) {
        if (err) cb(new Error(err));
        if (stdout.length > 0 && stdout.match(/.*not RAR archive.*/g)) {
            return cb(new Error('Unsupported RAR.'));
        }

        cb(null, stdout);
    });
};

function escape(input) {
    return shellEscape([input]);
}

module.exports = UnrarModule;