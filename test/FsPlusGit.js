var expect = require('unexpected-sinon'),
    sinon = require('sinon'),
    passError = require('passerror'),
    _ = require('underscore'),
    glob = require('glob'),
    Path = require('path'),
    FsPlusGit = require('../lib/FsPlusGit');

describe('FsPlusGit', function () {
    var pathToTestRepo = Path.resolve(__dirname, '..', 'node_modules', 'gitfakefs', 'test', 'testrepo.git'),
        fsPlusGit;

    describe('applied to the built-in fs module', function () {
        var fs;
        beforeEach(function () {
            fs = _.extend({}, require('fs'));
            Object.keys(fs).forEach(function (propertyName) {
                if (typeof fs[propertyName] === 'function') {
                    sinon.spy(fs, propertyName);
                }
            });
            fsPlusGit = new FsPlusGit(fs);
        });

        describe('#statSync()', function () {
            it('should work on the .git folder itself', function () {
                expect(fsPlusGit.statSync(pathToTestRepo).isDirectory(), 'to equal', true);
            });

            it('should work on the .git/gitFakeFs folder', function () {
                expect(fsPlusGit.statSync(Path.resolve(pathToTestRepo, 'gitFakeFs')).isDirectory(), 'to equal', true);
            });

            it('should work on the .git/gitFakeFs/branches folder', function () {
                expect(fsPlusGit.statSync(Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches')).isDirectory(), 'to equal', true);
            });

            it('should work on the .git/gitFakeFs/index folder', function () {
                expect(fsPlusGit.statSync(Path.resolve(pathToTestRepo, 'gitFakeFs', 'index')).isDirectory(), 'to equal', true);
            });
        });

        describe('#realpathSync()', function () {
            it('should work on the .git folder itself', function () {
                expect(fsPlusGit.realpathSync(pathToTestRepo), 'to equal', fs.realpathSync(pathToTestRepo));
            });

            it('should work on the .git/gitFakeFs folder', function () {
                expect(
                    fsPlusGit.realpathSync(Path.resolve(pathToTestRepo, 'gitFakeFs')),
                    'to equal',
                    Path.resolve(fs.realpathSync(pathToTestRepo), 'gitFakeFs')
                );
            });

            it('should work on the .git/gitFakeFs/branches folder', function () {
                expect(
                    fsPlusGit.realpathSync(Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches')),
                    'to equal',
                    Path.resolve(fs.realpathSync(pathToTestRepo), 'gitFakeFs', 'branches')
                );
            });

            it('should throw ENOENT on .git/gitFakeFs/foobar', function () {
                expect(function () {
                    fsPlusGit.realpathSync(Path.resolve(pathToTestRepo, 'gitFakeFs', 'foobar'));
                }, 'to throw exception', /ENOENT/);
            });
        });

        describe('#readdirSync()', function () {
            it('should work on the .git folder itself', function () {
                var entries = fsPlusGit.readdirSync(pathToTestRepo);
                expect(entries, 'to be an array');
                expect(entries, 'to contain', 'gitFakeFs');
            });

            it('should work on the .git/gitFakeFs folder', function () {
                var entries = fsPlusGit.readdirSync(Path.resolve(pathToTestRepo, 'gitFakeFs'));
                expect(entries, 'to be an array');
                expect(entries, 'to contain', 'branches');
                expect(entries, 'to contain', 'index');
                expect(entries, 'to contain', 'changesInIndex');
                expect(entries, 'to contain', 'tags');
                expect(entries, 'to contain', 'commits');
            });

            it('should throw if invoked on something below .git/gitFakeFs', function () {
                expect(function () {
                    fsPlusGit.readdirSync(Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches'));
                }, 'to throw exception', 'FsPlusGit.readdirSync: Not implemented');
            });
        });

        ['stat', 'lstat'].forEach(function (methodName) {
            describe('#' + methodName + '()', function () {
                it('should report /gitFakeFs/ as a directory', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs'), passError(done, function (stats) {
                        expect(stats.isDirectory(), 'to be', true);
                        expect(stats.isFile(), 'to be', false);
                        done();
                    }));
                });

                it('should report /gitFakeFs/HEAD/ as a directory', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs', 'HEAD'), passError(done, function (stats) {
                        expect(stats.isDirectory(), 'to be', true);
                        expect(stats.isFile(), 'to be', false);
                        done();
                    }));
                });

                it('should report /gitFakeFs/HEAD/subdir/ as a directory', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs', 'HEAD', 'subdir'), passError(done, function (stats) {
                        expect(stats.isDirectory(), 'to be', true);
                        expect(stats.isFile(), 'to be', false);
                        done();
                    }));
                });

                it('should report /gitFakeFs/HEAD/foo.txt as a file', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs', 'HEAD', 'foo.txt'), passError(done, function (stats) {
                        expect(stats.isDirectory(), 'to be', false);
                        expect(stats.isFile(), 'to be', true);
                        done();
                    }));
                });

                it('should report /gitFakeFs/branches/ as a directory', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches'), passError(done, function (stats) {
                        expect(stats.isDirectory(), 'to be', true);
                        expect(stats.isFile(), 'to be', false);
                        done();
                    }));
                });

                it('should report /gitFakeFs/branches/master/ as a directory', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches', 'master'), passError(done, function (stats) {
                        expect(stats.isDirectory(), 'to be', true);
                        expect(stats.isFile(), 'to be', false);
                        done();
                    }));
                });

                it('should report /gitFakeFs/commits/738876c70f4f5243a6672def4233911678ce38db/ as a directory', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs', 'commits', '738876c70f4f5243a6672def4233911678ce38db'), passError(done, function (stats) {
                        expect(stats.isDirectory(), 'to be', true);
                        expect(stats.isFile(), 'to be', false);
                        done();
                    }));
                });

                it('should return an ENOENT error for an unsupported entry in /gitFakeFs/', function (done) {
                    fsPlusGit.stat(Path.resolve(pathToTestRepo, 'gitFakeFs', 'foo'), function (err) {
                        expect(err, 'to be an', Error);
                        done();
                    });
                });
            });
        });

        describe('#readdir()', function () {
            it('should include the /gitFakeFs/ directory when applied to the .git folder', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', 'gitFakeFs');
                    done();
                }));
            });

            it('should return the types of objects when applied to the virtual /gitFakeFs/ directory', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo, 'gitFakeFs'), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to equal', ['HEAD', 'branches', 'tags', 'commits', 'index', 'changesInIndex']);
                    done();
                }));
            });

            it('should list the branches when applied to the virtual /gitFakeFs/branches/ directory', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches'), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', 'master');
                    done();
                }));
            });

            it('should list the tags when applied to the virtual /gitFakeFs/tag/ directory', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo, 'gitFakeFs', 'tags'), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', 'myTag');
                    done();
                }));
            });

            it('should list the commits when applied to the virtual /gitFakeFs/commits/ directory', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo, 'gitFakeFs', 'commits'), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', '91fe03e2a9f37e49ddc0cf1a1fd19ef44d9b7c4b');
                    done();
                }));
            });

            it('should list the contents of the index when applied to the virtual /gitFakeFs/index/ directory', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo, 'gitFakeFs', 'index'), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', 'stagedFile.txt');
                    done();
                }));
            });

            it('should list the contents of the index when applied to the virtual /gitFakeFs/index/ directory', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo, 'gitFakeFs', 'index'), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', 'stagedFile.txt');
                    expect(entryNames, 'to contain', 'foo.txt');
                    expect(entryNames, 'not to contain', 'fileStagedForDeletion.txt');
                    done();
                }));
            });

            it('should list the entries that have changed in the index when applied to the virtual /gitFakeFs/changesInIndex/ directory', function (done) {
                fsPlusGit.readdir(Path.resolve(pathToTestRepo, 'gitFakeFs', 'changesInIndex'), passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', 'stagedFile.txt');
                    expect(entryNames, 'not to contain', 'foo.txt');
                    expect(entryNames, 'not to contain', 'fileStagedForDeletion.txt');
                    done();
                }));
            });

            it('should work outside the .git repository', function (done) {
                fsPlusGit.readdir(__dirname, passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', Path.basename(__filename));
                    done();
                }));
            });
        });

        describe('#readFile()', function () {
            it('should proxy a path outside a .git repository to the wrapped fs implementation', function (done) {
                fsPlusGit.readFile(__filename, 'utf-8', passError(done, function (gitFakeFs) {
                    expect(fs.readFile, 'was called once');
                    expect(fs.readFile, 'was always called with', __filename, 'utf-8');
                    expect(gitFakeFs, 'to match', /FsPlusGit/);
                    done();
                }));
            });

            it('should proxy a path inside a branch to the GitFakeFs', function (done) {
                fsPlusGit.readFile(Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches', 'master', 'foo.txt'), 'utf-8', passError(done, function (gitFakeFs) {
                    expect(fs.readFile, 'was not called');
                    expect(gitFakeFs, 'to match', /This is the second revision of foo\.txt/);
                    done();
                }));
            });

            it('should proxy a path inside a commit to the GitFakeFs', function (done) {
                fsPlusGit.readFile(Path.resolve(pathToTestRepo, 'gitFakeFs', 'commits', '738876c70f4f5243a6672def4233911678ce38db', 'foo.txt'), 'utf-8', passError(done, function (gitFakeFs) {
                    expect(fs.readFile, 'was not called');
                    expect(gitFakeFs, 'to match', /This is the first revision of foo\.txt/);
                    done();
                }));
            });
        });
    });

    describe('patching the built-in fs module "in-place"', function () {
        var originalReadFile = require('fs').readFile;
        require('fs').unpatch = 123;
        before(function () {
            FsPlusGit.patchInPlace();
        });

        it('should replace the original readFile', function () {
            var readFile = require('fs').readFile;
            expect(readFile, 'to be a', Function);
            expect(readFile, 'not to be', originalReadFile);
        });

        describe('#readdir()', function () {
            it('should include the /gitFakeFs/ directory when applied to the .git folder', function (done) {
                require('fs').readdir(pathToTestRepo, passError(done, function (entryNames) {
                    expect(entryNames, 'to be an array');
                    expect(entryNames, 'to contain', 'gitFakeFs');
                    done();
                }));
            });
        });

        it('should make the glob work on the gitFakeFs directory', function (done) {
            require('glob')(Path.resolve(pathToTestRepo, 'gitFakeFs', '**', '*'), {mark: true, stat: true}, passError(done, function (fileNames) {
                expect(fileNames, 'to be an array');
                expect(fileNames, 'to contain', Path.resolve(pathToTestRepo, 'gitFakeFs', 'commits', '39c5c09d660b1bac8eb66898e88f72907ccbb223', 'foo.txt'));
                expect(fileNames, 'to contain', Path.resolve(pathToTestRepo, 'gitFakeFs', 'tags', 'myTag', 'symlinkToSymlinkToNonExistentFile'));
                expect(fileNames, 'to contain', Path.resolve(pathToTestRepo, 'gitFakeFs', 'branches', 'master', 'symlinkToSubdir/subsubdir/bar.txt'));
                expect(fileNames, 'to contain', Path.resolve(pathToTestRepo, 'gitFakeFs', 'HEAD', 'symlinkToSubdir/subsubdir/bar.txt'));
                done();
            }));
        });

        after(function () {
            require('fs').unpatch();
            expect(require('fs').readFile, 'to be', originalReadFile);
            expect(require('fs').unpatch, 'to equal', 123);
        });
    });
});
