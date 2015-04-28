var expect = require('chai').expect;
var browserify = require('browserify');
var resolutions = require('../index');

describe('when bundling app-a', function() {

  // Bundle expectations
  // --------------------------
  var expectedBundledLibs = {};

  expectedBundledLibs.vanilla = [
    'lib-a-1.0.0',
    'lib-ab-1.0.0',
    'lib-ab-2.0.0',
    'lib-b-1.0.0',
    'lib-b-2.0.0',
    'lib-c-1.0.0'
  ].sort();

  expectedBundledLibs['lib-a'] = expectedBundledLibs.vanilla;

  expectedBundledLibs['lib-ab'] = [
    'lib-a-1.0.0',
    'lib-ab-1.0.0',
    'lib-b-1.0.0',
    'lib-b-2.0.0',
    'lib-c-1.0.0'
  ].sort();

  expectedBundledLibs['lib-ab,lib-b'] = [
    'lib-a-1.0.0',
    'lib-ab-1.0.0',
    'lib-b-1.0.0',
    'lib-c-1.0.0'
  ].sort();

  expectedBundledLibs['*'] = expectedBundledLibs['lib-ab,lib-b'];

  // Execution expectations
  // --------------------------
  var expectedExecutedLibs = {};

  expectedExecutedLibs.vanilla = expectedBundledLibs.vanilla.concat([
    'lib-a-1.0.0'
  ]).sort();

  expectedExecutedLibs['lib-a'] = expectedBundledLibs['lib-a'];

  expectedExecutedLibs['lib-ab'] = [
    'lib-a-1.0.0',
    'lib-a-1.0.0',
    'lib-ab-1.0.0',
    'lib-b-1.0.0',
    'lib-b-2.0.0',
    'lib-c-1.0.0'
  ].sort();

  expectedExecutedLibs['lib-ab,lib-b'] = [
    'lib-a-1.0.0',
    'lib-a-1.0.0',
    'lib-ab-1.0.0',
    'lib-b-1.0.0',
    'lib-c-1.0.0'
  ].sort();

  expectedExecutedLibs['*'] = [
    'lib-a-1.0.0',
    'lib-ab-1.0.0',
    'lib-b-1.0.0',
    'lib-c-1.0.0'
  ].sort();

  // Test helpers
  // --------------------------
  var bundler;

  function getBundledLibs(bundleString) {
    var bundled = [];
    var regex = /libs\.push\('(lib-.+)'\)/g;
    var matches;

    /* jshint -W084 */
    while (matches = regex.exec(bundleString)) {
      bundled.push(matches[1]);
    }

    return bundled;
    /* jshint +W084 */
  }

  function bundleCallback(testFunc) {
    return function(err, buf) {
      var bufferString = buf.toString();
      var bundledLibs = getBundledLibs(bufferString);
      eval(bufferString);

      return testFunc(bundledLibs);
    };
  }

  // Tests
  // --------------------------
  beforeEach(function() {
    libs = [];
    bundler = browserify({
      entries: ['./test/app-a']
    });
  });

  describe('using vanilla browserify', function() {
    it('dedupes identical sources', function(done) {
      bundler
        .bundle(bundleCallback(function(bundledLibs) {
          expect(bundledLibs.sort()).to.eql(expectedBundledLibs.vanilla);
          done();
        }));
    });

    it('executes deduped sources', function(done) {
      bundler
        .bundle(bundleCallback(function() {
          expect(libs.sort()).to.eql(expectedExecutedLibs.vanilla);
          done();
        }));
    });
  });

  describe('using browserify-resolutions', function() {
    describe('and not passing options', function() {
      it('is vanilla dedupe', function(done) {
        bundler
          .plugin(resolutions)
          .bundle(bundleCallback(function(bundledLibs) {
            expect(bundledLibs.sort()).to.eql(expectedBundledLibs.vanilla);
            expect(libs.sort()).to.eql(expectedExecutedLibs.vanilla);
            done();
          }));
      });
    });

    describe('and passing empty array', function() {
      it('is vanilla dedupe', function(done) {
        bundler
          .plugin(resolutions, [])
          .bundle(bundleCallback(function(bundledLibs) {
            expect(bundledLibs.sort()).to.eql(expectedBundledLibs.vanilla);
            expect(libs.sort()).to.eql(expectedExecutedLibs.vanilla);
            done();
          }));
      });
    });

    describe('and passing a matching package name', function() {
      it('bundles and executes the matching package once', function(done) {
        var options = ['lib-ab'];

        bundler
          .plugin(resolutions, options)
          .bundle(bundleCallback(function(bundledLibs) {
            expect(bundledLibs.sort()).to.eql(expectedBundledLibs[options.toString()]);
            expect(libs.sort()).to.eql(expectedExecutedLibs[options.toString()]);
            done();
          }));
      });
    });

    describe('and passing multiple matching package names', function() {
      it('bundles and executes the matching packages once', function(done) {
        var options = ['lib-ab', 'lib-b'];

        bundler
          .plugin(resolutions, options)
          .bundle(bundleCallback(function(bundledLibs) {
            expect(bundledLibs.sort()).to.eql(expectedBundledLibs[options.join(',')]);
            expect(libs.sort()).to.eql(expectedExecutedLibs[options.join(',')]);
            done();
          }));
      });
    });

    describe('and passing *', function() {
      it('bundles and executes all packages once', function(done) {
        var options = '*';

        bundler
          .plugin(resolutions, options)
          .bundle(bundleCallback(function(bundledLibs) {
            expect(bundledLibs.sort()).to.eql(expectedBundledLibs[options]);
            expect(libs.sort()).to.eql(expectedExecutedLibs[options]);
            done();
          }));
      });
    });

    describe('and passing a matching package name that is a subset of another', function() {
      it('dedupes only the matching package name, not the superset', function(done) {
        var options = ['lib-a'];

        bundler
          .plugin(resolutions, options)
          .bundle(bundleCallback(function(bundledLibs) {
            expect(bundledLibs.sort()).to.eql(expectedBundledLibs[options]);
            expect(libs.sort()).to.eql(expectedExecutedLibs[options]);
            done();
          }));
      });
    });
  });
});
