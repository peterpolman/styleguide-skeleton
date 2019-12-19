'use strict';

const importOnce = require('node-sass-import-once'),
    plumber = require('gulp-plumber'),
    gulp = require('gulp'),
    clean = require('gulp-clean'),
    $ = require('gulp-load-plugins')(),
    browserSync = require('browser-sync').create(),
    sass = require('gulp-sass'),
    autoprefixer = require('autoprefixer'),
    mqpacker = require('css-mqpacker'),
    hologram = require('gulp-hologram'),
    sourcemaps = require('gulp-sourcemaps'),
    twig = require('gulp-twig'),
    backstopjs = require('backstopjs'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    path = require('path'),
    runSequence = require('run-sequence');

const options = {};

options.theme = {
    root: __dirname + '/',
    html: __dirname + '/html/',
    twig: __dirname + '/twig/',
    css: __dirname + '/assets/css/',
    scss: __dirname + '/scss/',
    icons: __dirname + '/icons/'
};

options.scss = {
    importer: importOnce,
    includePaths: [
        options.theme.scss
    ],
    outputStyle: 'expanded'
};

const scssFiles = [
    options.theme.scss + '**/*.scss',
    '!' + options.theme.scss + '**/_*.scss'
];

const twigFiles = [
    options.theme.twig + '**/*.twig',
    '!' + options.theme.twig + '**/_*.twig'
];

const scssProcessors = [
    autoprefixer({ browsers: ['> 1%', 'last 2 versions'] }),
    mqpacker({ sort: true })
];

gulp.task('clean', function () {
    return gulp.src([options.theme.styleguide + '*',
        '!' + options.theme.styleguide + 'backstop_data/',
        '!' + options.theme.styleguide + 'static/',
        '!' + options.theme.styleguide + 'pdp.html'],
        {read: false})
        .pipe(clean());
});

gulp.task('icons', function () {
    return gulp.src(options.theme.icons + '/**/*.svg')
        .pipe(svgmin(function (file) {
            // var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{removeAttrs: {attrs:['fill','fill-rule']}}]
            }
        }))
        .pipe(svgstore())
        .pipe(gulp.dest(options.theme.root + 'doc_assets/assets/icons/'));
});

gulp.task('styles', function () {
  return gulp.src(scssFiles)
      .pipe(sourcemaps.init())
      .pipe($.sass(options.scss).on('error', sass.logError))
      .pipe(plumber({
          errorHandler: function (error) {
              console.log(error.message);
              this.emit('end');
          }
      }))
      .pipe($.rename({ dirname: '' }))
      .pipe($.size({ showFiles: false }))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(options.theme.root + 'doc_assets/assets/css/'))
      .pipe($.cssmin())
      .pipe($.concat('styles.min.css'))
      .pipe($.postcss(scssProcessors))
      .pipe(gulp.dest(options.theme.root + 'doc_assets/assets/css/'))
});

gulp.task('styles:watch', function () {
    gulp.watch(options.theme.scss + '**/*.scss', ['styles']);
});

gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: 'html/'
        },
        open: true
    });
});

gulp.task('styleguide', function () {
    return gulp.src('hologram_config.yml')
        .pipe(hologram()) // This executes a ruby gem installed with 'sudo gem install hologram'
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task('styleguide:watch', ['clean', 'build', 'browser-sync'], function () {
    gulp.watch(options.theme.scss + '**/*.scss', ['styles', 'styleguide']);
    gulp.watch(options.theme.twig + '**/*.twig', ['prototype']);
});

gulp.task('backstop:reference', function () {
    return backstopjs('reference');
});

gulp.task('backstop:test', function () {
    return backstopjs('test');
});

gulp.task('backstop:approve', function () {
    return backstopjs('approve');
});

gulp.task('backstop:openReport', function () {
    return backstopjs('openReport');
});

gulp.task('prototype', function () {
    return gulp.src(twigFiles)
        .pipe(twig())
        .pipe(gulp.dest(options.theme.html))
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task('prototype:watch', ['clean', 'prototype', 'browser-sync'], function () {
    gulp.watch(options.theme.twig + '**/*.twig', ['prototype']);
});

gulp.task('build', function(done) {
    runSequence('icons', 'styles', 'prototype', 'styleguide', function() {
        done();
    });
});

gulp.task('default', function(){
    console.log('No default task set! View gulpfile.js for an overview of the tasks.');
});
