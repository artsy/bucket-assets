# bucket-assets

Uploads a folder of static assets to an s3 bucket with convenient features. These include:

* Fingerprints asset package based on file contents
* Uploads a manifest file that stores a git hash to make rollback easy
* Provides middleware to easily point to your uploaded assets
* Adds appropriate s3 headers like setting files to 'public-read' and 'Content-Type'.

Bucket Assets is used in deploys of Artsy apps, but may be useful for you too.

## Example

Run the CLI in your deployment process. (You may omit these arguments if you use the defaults below.)

````
node_modules/.bin/bucketassets --dir public/assets --secret s3-secret --key s3-key --bucket force-production
````

Add the middleware to your app

````javascript
var bucketAssets = require('bucket-assets');
app.use(bucketAssets.middleware({
  dir: __dirname + '/public/assets', // Defaults to finding all "public" folders that are children of process.cwd() e.g. /public + /components/modal/public
  key: 's3-key', // Defaults to process.env.S3_KEY
  secret: 's3-secret', // Defaults to process.env.S3_SECRET
  bucket: 'force-production', // Defaults to process.env.S3_BUCKET
  cdnUrl: '//xyz.cloudfront.net/assets' // Defaults to process.env.CDN_URL
}));
````

This provides the view helper to point to the fingerprinted CDN assets if process.env.NODE_ENV=production or process.env.NODE_ENV=staging, otherwise it'll act as a noop that just returns the passed in string.

````jade
head
  link( type='text/css', rel='stylesheet', href=asset('/main.css') )
body
  script( src=asset('/main.js') )
````

## Contributing

Please fork the project and submit a pull request with tests. Install node modules `npm install` and run tests with `make test`.

## License

MIT
