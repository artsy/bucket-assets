var path = require('path'),
    glob = require('glob'),
    fs = require('fs'),
    knox = require('knox'),
    exec = require('child_process').exec,
    _ = require('underscore'),
    crypto = require('crypto');

module.exports = function(options) {

  // Setup default options, S3 client, and expand glob
  if (!options) options = {};
  _.defaults(options, {
    files: process.cwd() + '**/*/public/**/*',
    key: process.env.S3_KEY,
    secret: process.env.S3_SECRET,
    bucket: process.env.S3_BUCKET,
    cdnUrl: process.env.CDN_URL
  });
  var client = knox.createClient({
    key: options.key,
    secret: options.secret,
    bucket: options.bucket
  });
  var files = glob.sync(options.files, { nodir: true });

  // Find the commit hash for rollback
  exec('git rev-parse --short HEAD', function(err, commitHash) {

    // Create a manifest of fingerprinted JS/CSS
    var manifest = {};
    files.forEach(function(file) {
      var ext = path.extname(file);
      if(ext != '.js' && ext != '.css') return;
      var contents = fs.readFileSync(file);
      var hash = crypto.createHash('sha1')
        .update(contents).digest('hex').slice(0, 8);
      var fingerprintedFilename = path.basename(file, ext) + '-' + hash + ext;
      manifest[_.last(file.split('public'))] = '/' + fingerprintedFilename;
    });

    // Upload the manifest
    client.putBuffer(
      JSON.stringify(manifest),
      '/manifest-' + commitHash + '.json',
      { 'Cache-Control': 'max-age=315360000, public' },
      function(err) {
        if (err) return options.error(err);

        // Upload each file to S3
        options.callback = _.after(
          files.length,
          options.callback || function() {}
        );
        files.forEach(function(filename) {

          // Generate headers
          var contentType = contentTypeMap[
            path.extname(filename.replace('.gz', '').replace('.cgz', ''))
          ];
          var headers = {
            'Cache-Control': 'max-age=315360000, public',
            'Content-Type': contentType,
            'x-amz-acl': 'public-read'
          };
          if(filename.match(/\.gz$/) || filename.match(/\.cgz$/))
            headers['Content-Encoding'] = 'gzip';

          // Upload file
          var s3Path = _.last(filename.split('public'));
          if (manifest[s3Path]) s3Path = manifest[s3Path];
          client.putFile(filename, s3Path, headers, function(err, res) {
            if (err) {
              console.warn('Error uploading ' + filename + ' to ' +
                options.bucket + s3Path + ': ' + err);
            } else {
              console.warn('Uploaded ' + filename + ' to ' +
                options.bucket + s3Path + '(' + contentType + ')' );
              options.callback()
            }
          });
        });
      }
    );
  });
}

var contentTypeMap = {
  '.css': 'text/css',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.js':  'application/javascript',
  '.ico': 'image/x-icon',
  '.xml': 'text/xml'
};
