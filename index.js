var path = require('path');
var glob = require('glob');
var fs = require('fs');
var knox = require('knox');
var exec = require('child_process').exec;
var _ = require('underscore');

module.exports = function(options) {
  var client = knox.createClient({
    key: options.key,
    secret: options.secret,
    bucket: options.bucket
  });
  var files = glob.sync(options.dir + '/**/*').filter(function(filename) {
    return fs.statSync(filename).isFile();
  });
  options.callback = _.after(files.length, options.callback || function() {});
  exec('git rev-parse --short HEAD', function(err, commitHash) {
    var uploadFile = function(filename) {

      // Generate headers
      var ext = path.extname(filename);
      var headers = {
        'Content-Type': contentTypeMap[ext],
        'x-amz-acl': 'public-read'
      }
      if(ext == '.gz') headers['Content-Encoding'] = 'gzip';

      // Upload file to s3
      var s3Path = '/assets/' + commitHash.trim() + '/' + path.relative(options.dir, filename);
      client.putFile(filename, s3Path, headers, function(err, res) {
        if (err) {
          console.warn('Error uploading ' + filename + ' to ' + 
                        options.bucket + s3Path + ': ' + err);
        } else {
          console.warn('Uploaded ' + filename + ' to ' + 
                        options.bucket + s3Path + '(' + contentTypeMap[ext] + ')' );
          options.callback()
        }
      });
    };
    files.forEach(uploadFile);
  });
}

var contentTypeMap = {
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.js':  'application/javascript',
  '.ico': 'image/x-icon' 
};