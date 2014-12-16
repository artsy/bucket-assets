var rewire = require('rewire');
var bucketAssets = rewire('../');
var sinon = require('sinon');
var should = require('should');

describe('bucketAssets', function() {
  var putFileStub, createClientStub, putBufferStub;

  beforeEach(function() {
    putFileStub = sinon.stub();
    putBufferStub = sinon.stub();

    createClientStub = sinon.stub();
    createClientStub.returns({
      putFile: putFileStub,
      putBuffer: putBufferStub
    });
    bucketAssets.__set__('knox', {
      createClient: createClientStub
    });
    bucketAssets.__set__('exec', function(str, callback) {
      callback(null, 'git-hash');
    });
  });

  it('passes on options to knox', function() {
    bucketAssets.upload({
      files: __dirname + '/assets/**/*',
      root: 'assets',
      secret: 'foobar',
      key: 'baz',
      bucket: 'flare-production'
    });
    createClientStub.args[0][0].key.should.equal('baz');
    createClientStub.args[0][0].bucket.should.equal('flare-production');
    createClientStub.args[0][0].secret.should.equal('foobar');
  });

  it('puts files and non-empty folders to the s3 bucket', function() {
    bucketAssets.upload({
      files: __dirname + '/assets/**/*',
      root: 'assets',
      secret: 'foobar',
      key: 'baz',
      bucket: 'flare-production'
    });
    putBufferStub.args[0][3]();
    putFileStub.args[0][0].should.containEql('test/assets/app.css');
    putFileStub.args[0][1].should.containEql('/app-c1920422.css');
    putFileStub.args[1][0].should.containEql('test/assets/app.js');
    putFileStub.args[1][1].should.containEql('/app-72f6c492.js');
    putFileStub.args[4][0].should.containEql('test/assets/folder_with_file/app.js');
    putFileStub.args[4][1].should.containEql('/folder_with_file/app-72f6c492.js');
  });

  it('adds the proper Content-Type header', function() {
    bucketAssets.upload({
      files: __dirname + '/assets/**/*',
      root: 'assets',
      secret: 'foobar',
      key: 'baz',
      bucket: 'flare-production'
    });
    putBufferStub.args[0][3]();
    putFileStub.args[0][2]['Content-Type'].should.equal('text/css');
    putFileStub.args[1][2]['Content-Type'].should.equal('application/javascript');
  });

  it('adds the proper Max-Age header', function() {
      bucketAssets.upload({
          files: __dirname + '/assets/**/*',
          root: 'assets',
          secret: 'foobar',
          key: 'baz',
          bucket: 'flare-production'
      });
      putBufferStub.args[0][3]();
      putFileStub.args[0][2]['Cache-Control'].should.equal('max-age=315360000, public');
      putFileStub.args[1][2]['Cache-Control'].should.equal('max-age=315360000, public');
  });

  it('sends gzipped files under gz or cgz with Content-Encoding and the underyling Content-Type', function() {
    bucketAssets.upload({
      files: __dirname + '/assets/**/*',
      root: 'assets',
      secret: 'foobar',
      key: 'baz',
      bucket: 'flare-production'
    });
    putBufferStub.args[0][3]();
    putFileStub.args[2][2]['Content-Type'].should.equal('application/javascript');
    putFileStub.args[2][2]['Content-Encoding'].should.equal('gzip');
    putFileStub.args[3][2]['Content-Type'].should.equal('application/javascript');
    putFileStub.args[3][2]['Content-Encoding'].should.equal('gzip');
  });

  it('uploads a manifest of fingerprinted files', function() {
    bucketAssets.upload({
      secret: 'foobar',
      key: 'baz',
      bucket: 'flare-production'
    });
    var manifest = JSON.parse(putBufferStub.args[0][0]);
    manifest['/bar.js'].should.equal('/bar-9b57f0be.js');
    manifest['/foo.js'].should.equal('/foo-190774dc.js');
    manifest['/baz.js'].should.equal('/baz-842ebc9d.js');
  });

  it('uploads a manifest of fingerprinted files retaining sub-folders', function() {
    bucketAssets.upload({
      files: __dirname + '/assets/**/*',
      root: 'assets',
      secret: 'foobar',
      key: 'baz',
      bucket: 'flare-production'
    });
    var manifest = JSON.parse(putBufferStub.args[0][0]);
    manifest['/folder_with_file/app.js'].should.equal('/folder_with_file/app-72f6c492.js');
  });

  it('can join files from all sorts of public folders', function() {
    bucketAssets.upload({
      files: __dirname + '/app/**/public/**',
      secret: 'foobar',
      key: 'baz',
      bucket: 'flare-production'
    });
    putBufferStub.args[0][3]();
    putFileStub.args[0][1].should.equal('/bar-9b57f0be.js');
    putFileStub.args[1][1].should.equal('/foo-190774dc.js');
    putFileStub.args[2][1].should.equal('/baz-842ebc9d.js');
  });
});
