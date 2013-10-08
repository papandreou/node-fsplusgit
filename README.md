FsPlusGit
=========

An `fs`-compatible module compatible that exposes the contents of git
repositories (including bare ones) inside virtual `gitFakeFs` folders.

```javascript
var FsPlusGit = require('fsplusgit'),
    fsPlusGit = new FsPlusGit(require('fs'));

fsPlusGit.readFile('/path/to/repo.git/gitFakeFs/HEAD/fileAtTheRootOfTheRepo.txt', 'utf-8', function (err, contents) {/*...*/});
fsPlusGit.readFile('/path/to/repo.git/gitFakeFs/index/fileAtTheRootOfTheRepo.txt', 'utf-8', function (err, stagedContents) {/*...*/});
fsPlusGit.readdir('/path/to/repo.git/gitFakeFs/branches/', function (err, branchNames) {/*...*/});
fsPlusGit.readdir('/path/to/repo.git/gitFakeFs/tags/', function (err, tagNames) {/*...*/});
fsPlusGit.readdir('/path/to/repo.git/gitFakeFs/tags/foo/', function (err, fileNamesAtTheRootInFoo) {/*...*/});
```

All other method calls are proxied to the wrapped `fs` module, so any
operation happening outside the `gitFakeFs` folders should work as usual.

There's also a special folder containing all the files and directories
that have staged changes. This is useful in a pre-commit hook scenario
where you might want to only lint the files that actually have changes:

```javascript
fsPlusGit.readdir('/path/to/repo.git/gitFakeFs/changesInIndex/', function (err, entriesWithChangesInIndex) {/*...*/});
fsPlusGit.readFile('/path/to/repo.git/gitFakeFs/changesInIndex/fileWithStagedChanges.txt', 'utf-8', function (err, stagedContents) {/*...*/});
```

You can also patch the `fs` module in-place to make every other module
instantly capable of getting to the contents of your git
repositories. Just make sure to do it before any other module might
grab a reference to an `fs` method:

```javascript
require('fsplusgit').patchInPlace(require('fs'));

require('glob')('**/*', {cwd: '/path/to/repo.git/gitFakeFs/', mark: true}, function (err, fileNames) {
    if (err) throw err;
    console.log(fileNames);
});
```

which will produce something like:

```
[ 'HEAD/',
  'HEAD/fileStagedForDeletion.txt',
  'HEAD/foo.txt',
  'HEAD/subdir/',
  'HEAD/subdir/quux.txt',
  'branches/',
  'branches/master/',
  'branches/master/fileStagedForDeletion.txt',
  'branches/master/foo.txt',
  'branches/master/subdir/',
  'branches/master/subdir/quux.txt',
  'index/',
  'index/foo.txt',
  'index/stagedFile.txt',
  'index/subdir/',
  'index/subdir/stagedFileInSubdir.txt',
  'changesInIndex/',
  'changesInIndex/stagedFile.txt',
  'changesInIndex/subdir/',
  'changesInIndex/subdir/stagedFileInSubdir.txt',
  'commits/',
  'commits/019433c0486da194b36a8da59910316ad704accd/',
  'commits/019433c0486da194b36a8da59910316ad704accd/foo.txt',
  'commits/019433c0486da194b36a8da59910316ad704accd/fileThatOnlyExistedInTheFirstCommit.txt',
  'commits/a1410fe23cc0c126d5546a366545a88e1d649759/',
  'commits/a1410fe23cc0c126d5546a366545a88e1d649759/fileStagedForDeletion.txt',
  'commits/a1410fe23cc0c126d5546a366545a88e1d649759/foo.txt',
  'tags/theFirstCommit/',
  'tags/theFirstCommit/foo.txt',
  'tags/theFirstCommit/fileThatOnlyExistedInTheFirstCommit.txt'
```

Limitations
-----------

The synchronous fs operations aren't supported inside the `gitFakeFs`
folders due to limitations in the underlying libraries. If you need to
make this work (eg. with third party code that uses `readFileSync`,
such as the less compiler), you can wrap `FsPlusGit` in a
[cachedfs](https://github.com/papandreou/node-cachedfs) and make sure
that you have read the files that you need to access before passing on
control to the code that needs the synchronous operations to work:

```javascript
var fs = require('fs'),
    glob = require('glob'),
    async = require('async');
require('fsplusgit').patchInPlace(fs);
require('cachedfs').patchInPlace(fs);

// node-cachedfs does not yet make use of an already cached response with a different encoding,
// so we need to read both variants:
function readFileAsBufferAndUtf8(fileName, cb) {
    fs.readFile(fileName, function (err) {
        if (err) return cb(err);
        fs.readFile(fileName, 'utf-8', cb);
    });
}

glob('/path/to/repo.git/gitFakeFs/HEAD/**/*.less', {stat: true}, function (err, lessFileNamesInHead) {
    if (err) throw err;
    async.each(lessFileNamesInHead, readFileAsBufferAndUtf8, function (err) {
        if (err) throw err;
        // Now it's safe to require('fs').readFileSync() and .stat() any .less file in repo.git/gitFakeFs/HEAD/

        require('less').render(fs.readFileSync(lessFileNamesInHead[0], 'utf-8'), function (err, cssText) {
            // ...
        });
    });
});
```

Implementation
--------------

Uses [gitfakefs](https://github.com/papandreou/node-gitfakefs), which
in turn uses [nodegit](https://github.com/nodegit/nodegit) to do the
actual reading from git repositories.

Installation
------------

Make sure you have node.js and npm installed, then run:

    npm install fsplusgit

License
-------

3-clause BSD license -- see the `LICENSE` file for details.
