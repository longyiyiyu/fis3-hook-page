var path = require('path');
var SERVERROOT = '../server/app';

function defaultFilter(pageName, fileId, whiteList) {
  if (fileId === 'pages/' + pageName + '/actions') return true;
  if (fileId === 'pages/' + pageName + '/data.page') return true;
  if (fileId === 'pages/' + pageName + '/' + pageName) return true;
  if (fileId.match(new RegExp('^pages\/' + pageName + '\/modules\/'))) return true;
  if (whiteList) {
    for(var i = 0, l = whiteList.length; i < l; ++i) {
      if (fileId === whiteList[i]) return true;
    }
  }
  
  return false;
}

module.exports = function(fis, opts) {
  var root = fis.project.getProjectPath();
  var serverRoot = fis.util(root, opts.serverRoot || SERVERROOT);
  var pageList = opts.pageList;
  var filter = opts.filter;
  var wl = opts.fileWhiteList;

  if (!pageList || !pageList.length) {
    return;
  }

  fis.on('compile:postprocessor', function(file) {
    var match;
    var cnt;
    var pageName;

    if ((match = file.id.match(/^pages\/([^/]+)\/.+/)) &&
      (pageName = match[1]) &&
      ~pageList.indexOf(match[1]) &&
      (file.isHtmlLike || file.isJsLike)) {

      if (!defaultFilter(pageName, file.id, wl) ||
        filter && !filter(pageName, file.id)) {
        return;
      }

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

      fis.util.write(fis.util(serverRoot, file.subpath.replace(/\.es6\.js$/, '.js')), cnt);
    }
  });
};
