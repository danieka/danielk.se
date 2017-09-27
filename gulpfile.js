'use strict';
 
var gulp = require('gulp')
var sass = require('gulp-sass')


var s3 = require('gulp-s3-upload')();
 
gulp.task('deploy', () => {
  gulp.src('./public/**').pipe(s3({ Bucket: "www.danielk.se", ACL: "public-read"}));
})
 
gulp.task('sass', function () {
  return gulp.src('./themes/daniel/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./themes/daniel/static/css'))
})
 
gulp.task('sass:watch', ['sass'], function () {
  gulp.watch('./themes/daniel/scss/**/*.scss', ['sass'])
})