const path = require('path');
process.env.FAST_REFRESH = false;

module.exports = {
    paths: function(paths, env) {
        paths.appIndexJs = path.resolve(__dirname, 'app/static/js/react-entry.js');
        paths.appPublic = path.resolve(__dirname, 'app/');
        paths.appHtml = path.resolve(__dirname, 'app/static/html/react-entry.html');
        paths.appSrc = path.resolve(__dirname, 'app/static');
        return paths;
    }
}