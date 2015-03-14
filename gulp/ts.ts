/// <reference path="../typings.d.ts" />
import del = require('del');
import path = require('path');
var merge = require('merge2');
import vinyl = require('vinyl');
import runSequence = require('run-sequence');
import gulp = require('gulp');
import sourcemaps = require('gulp-sourcemaps');
import tslint = require('gulp-tslint');
import typescript = require('gulp-typescript');
var notify = require('gulp-notify');

var SRC_PATH = ['src/lib/index.ts'];
var DST_PATH = 'lib/';
var CLEAN_PATH = ['lib/', './index.d.ts'];
var DEFINITELY_PATH = './';

gulp.task('ts', callback =>
    runSequence('ts-lint', 'ts-build', callback));
gulp.task('ts-release', callback =>
    runSequence('ts-lint', 'ts-release-build', callback));

gulp.task('ts-lint',() =>
    gulp.src(['**/*.ts', '!node_modules/**', '!typings/**'])
        .pipe(tslint())
        .pipe(tslint.report(tsLintReporter)));

gulp.task('ts-build',() =>
    gulp.src(SRC_PATH)
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject(), undefined, tsReporter()))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(DST_PATH)));
gulp.task('ts-release-build',() => {
    var tsResult = gulp.src(SRC_PATH)
        .pipe(typescript(tsProject(), undefined, tsReporter()));
    return merge([
        tsResult.dts.pipe(gulp.dest(DEFINITELY_PATH)),
        tsResult.js.pipe(gulp.dest(DST_PATH))
    ]);
});

gulp.task('ts-watch',() => {
    gulp.watch(SRC_PATH,() =>
        runSequence('ts', 'test'));
});

gulp.task('ts-clean', callback => {
    del(CLEAN_PATH, callback);
});

function tsProject() {
    return typescript.createProject({
        module: 'commonjs',
        noImplicitAny: true,
        declarationFiles: true
    });
}

function tsLintReporter(output: tslint.Output[], file: vinyl, options: tslint.Options) {
    var YELLOW = '\u001b[33m';
    var RESET = '\u001b[0m';
    var filePath = path.relative('', file.path);
    output.forEach(failure => {
        var startPosition = failure.startPosition;
        var message = filePath
            + '(' + startPosition.line + ',' + startPosition.character + ')'
            + ': ' + failure.failure;
        console.warn(YELLOW + message + RESET);
    });
    notify.onError()(filePath + ' ' + output.length + ' warn(s)');
}

function tsReporter() {
    return {
        error: notify.onError(error => {
            console.error(error.message);
            return error.relativeFilename + ' has error.';
        })
    };
}
