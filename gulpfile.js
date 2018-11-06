'use strict';
 
var gulp = require('gulp')
var sass = require('gulp-sass')
var cloudfront = require('gulp-cloudfront-invalidate');

var AWS = {
  "accessKeyId":    "AKIAJKH6L35ZOMS6MEPA",
  "secretAccessKey": "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",
}

var s3 = require('gulp-s3-upload')(AWS);
 

gulp.task('upload', () => {
  gulp.src('./public/**').pipe(s3({ Bucket: "www.danielk.se", ACL: "public-read"}));
})


var settings = {
 distribution: 'E2F9GAJ2W7S79E', // Cloudfront distribution ID 
 paths: ['/index.html'],          // Paths to invalidate 
 accessKeyId: AWS.accessKeyId,             // AWS Access Key ID 
 secretAccessKey: AWS.secretAccessKey,         // AWS Secret Access Key 
 wait: true                      // Whether to wait until invalidation is completed (default: false) 
}

gulp.task('deploy', ['upload'], function () {
  return gulp.src('*')
    .pipe(cloudfront(settings));
});
 
gulp.task('sass', function () {
  return gulp.src('./themes/daniel/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./themes/daniel/static/css'))
})
 
gulp.task('sass:watch', ['sass'], function () {
  gulp.watch('./themes/daniel/scss/**/*.scss', ['sass'])
})