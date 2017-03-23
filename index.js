var path = require('path');
var SERVERROOT = '../imwebsvr/worker/m.ke.qq.com';

module.exports = function(fis, opts) {
  var root = fis.project.getProjectPath();
  var serverRoot = fis.util(root, opts.serverRoot || SERVERROOT);
  var pageList = opts.pageList;

  if (!pageList || !pageList.length) {
    return;
  }

  fis.on('compile:postprocessor', function(file) {
    var match;
    var cnt;

    if ((match = file.id.match(/^pages\/([^/]+)\/.+/)) &&
      match[1] &&
      ~pageList.indexOf(match[1]) &&
      (file.isHtmlLike || file.isJsLike)) {
      cnt = file.getContent();
      cnt = cnt.replace(/require\('(pages\/[^']*)'\)/g, function(str, p) {
        var s = fis.util(serverRoot, file.subpath);
        var d = fis.util(serverRoot, p);
        var r = path.relative(s, d);

        return 'require(\'' + r.replace(/\\/g, '/').replace(/^\.\./, '.') + '\')';
      });

      if (file.isTplFile) {
        cnt = cnt.replace(/^return/, 'module.exports =');
      }

      fis.util.write(fis.util(serverRoot, file.subpath), cnt);
    }
  });
};
