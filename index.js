var path = require('path');
var glob = require('glob');
var fs = require('fs');
var knox = require('knox');
var exec = require('child_process').exec;

module.exports = function(options) {
  var client = knox.createClient({
    key: options.key,
    secret: options.secret,
    bucket: options.bucket
  });
  var files = glob.sync(options.dir + '/**/*').filter(function(filename) {
    return fs.statSync(filename).isFile();
  });
  exec('git rev-parse --short HEAD', function(err, commitHash) {
    files.forEach(function(filename) {
      uploadFile(client, commitHash, filename)
    });
  }
}

var uploadFile = function(client, commitHash, filename) {
  
  // Generate headers
  var ext = path.extname(filename);
  var headers = {
    'Content-Type': contentTypeMap[ext],
    'x-amz-acl': 'public-read'
  }
  if(ext == '.gz') headers['Content-Encoding'] = 'gzip';
  
  // Upload file to s3
  var s3Path = '/assets/' + commitHash.trim() + '/';
  client.putFile(filename, s3Path, headers, function(err, res) {
    if (err) {
      console.warn('Error uploading ' + filename + ' to ' + 
                    APPLICATION_NAME + s3Path + ': ' + err);
    } else {
      console.warn('Uploaded ' + filename + ' to ' + 
                    APPLICATION_NAME + s3Path + '(' + contentTypeMap[ext] + ')' );
    }
  });
}

var contentTypeMap = {
  '.css': 'text/css',
  '.jpg': 'image/x-icon',
  '.png': 'image/png',
};