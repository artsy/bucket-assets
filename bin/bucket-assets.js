#!/usr/bin/env node

var program = require('commander');
var bucketAssets = require('../');
var resolve = require('path').resolve;

program
  .version('0.1.0')
  .option('-f, --files [files]', 'Glob to asset files e.g. public/**')
  .option('-r, --root [root]', 'Root folder name e.g. "public"')
  .option('-k, --key [key]', 'S3 Key')
  .option('-s, --secret [secret]', 'S3 Secret')
  .option('-b, --bucket [name]', 'S3 Bucket name')
  .option('-fp, --fingerprint [bool]', 'S3 Bucket name')
  .parse(process.argv);

bucketAssets.upload({
  files: program.files,
  root: program.root,
  key: program.key,
  secret: program.secret,
  bucket: program.bucket,
  fingerprint: program.fingerprint == 'false' ? false : true,
  callback: function(err) {
    if (err) {
      console.warn("Error uploading assets: " + err);
      process.exit(1);
    } else {
      console.log("All assets uploaded successfully!");
      process.exit(0);
    }
  }
});
