# bucket-assets

Uploads a folder of static assets to an s3 bucket with convenient assumptions. These assumptions include:

* Uploads to a folder under a truncated git hash for naive fingerprinting and rollback purposes.
* Adds appropriate s3 headers like setting files to 'public-read' and 'Content-Type'.

Bucket Assets is used in deploys of Artsy apps, but may be useful for you too.

## Example

Pass in the asset directory and 

````javascript
var bucketAssets = require('bucket-assets');
bucketAssets({
  dir: __dirname + 'public/assets',
  secret: '<s3-secret>',
  key: '<s3-key>',
  bucket: 'flare-production',
  callback: function(err) {
    // If no err all assets uploaded to S3 fine!
  }
});
````

## Contributing

Please fork the project and submit a pull request with tests. Install node modules `npm install` and run tests with `make test`.

## License

MIT
