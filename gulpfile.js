/*
 *
 *  ©2016-2017 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 *  Bangalore, India. All Rights Reserved.
 *
 */

const gulp = require('gulp');
const concat = require('gulp-concat');
const watch = require('gulp-watch');
const insert = require('gulp-insert');
const clean = require('gulp-clean');
const peg = require('./utils/dev/gulp-pegjs');
const gutil = require('gulp-util');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');
const through = require('through2');

const log = label => {
    const log = (file, enc, cb) => {
        console.log(`${label} : ${file.path}`);
        cb(null, file);
    };
    return through.obj(log);
};

gulp.task('initialize:feel', () => gulp.src('./grammar/feel-initializer.js')
    .pipe(insert.transform((contents, file) => {
        return '{ \n' + contents + '\n }';
    }))
    .pipe(gulp.dest('./temp')));

gulp.task('concat:feel', ['initialize:feel'], () => gulp.src(['./temp/feel-initializer.js', './grammar/feel.pegjs'])
    .pipe(concat('feel.pegjs'))
    .pipe(gulp.dest('./src/')));

gulp.task('clean:temp', ['initialize:feel', 'concat:feel'], () => gulp.src('./temp', {
    read: false,
}).pipe(clean()));

gulp.task('clean:dist', ['src:lint'], () => gulp.src('./dist/feel*.js', {
    read: false,
}).pipe(clean()));

gulp.task('clean:src:feel', () => gulp.src('./src/feel.pegjs', {
    read: false,
}).pipe(clean()));

gulp.task('generate:parser', () => gulp.src('src/feel.pegjs')
    .pipe(peg({
        format: 'commonjs',
        cache: true,
        allowedStartRules: ["Start", "SimpleExpressions", "SimpleUnaryTests"]
    }))
    .pipe(gulp.dest('./dist')));

gulp.task('dist:ast', () => gulp.src(['src/feel-ast.js', 'src/feel-ast-parser.js'])
    .pipe(gulp.dest('./dist')));

gulp.task('mocha', () => gulp.src(['test/*.js'], {
    read: false,
}).pipe(mocha({
    reporter: 'list',
})).on('error', gutil.log));

gulp.task('lint', () => {
    return gulp.src(['**/*.js', '!node_modules/**'])
        .pipe(log('linting'))
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('src:lint', () => {
    return gulp.src(['src/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('utils:lint', () => {
    return gulp.src(['utils/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('build:pre', ['initialize:feel', 'clean:src:feel', 'concat:feel', 'clean:temp']);
gulp.task('build:dist', ['generate:parser', 'dist:ast']);
gulp.task('default', ['build:pre', 'build:dist', 'mocha']);

gulp.task('watch', () => {
    gulp.watch('./grammar/*', ['build']);
    gulp.watch('./src/*.pegjs', ['generate:parser']);
    gulp.watch('./src/*.js', ['dist:feel:ast', 'dist:feel:ast:parser']);
    gulp.watch('./utils/*.js', ['utils:lint']);
});
