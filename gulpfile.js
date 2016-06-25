var gulp = require('gulp'),
	minifyCSS = require('gulp-minify-css'),
	concatCss = require('gulp-concat-css'),
	concatJs = require('gulp-concat'),
	notify = require('gulp-notify'),
	uglify = require('gulp-uglify'),
  sass = require('gulp-sass')
	template = require('gulp-angular-templatecache')

gulp.task('styles', function () {
    gulp.src('sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./css/'))
})

//Watch task
gulp.task('styles', function () {
  gulp.src('dist/md-crud-formly.css')
    .pipe(concatCss("md-crud-formly.min.css"))
    .pipe(minifyCSS({keepBreaks:false}))
    .pipe(gulp.dest('./dist/'))
    .pipe(notify("Ha finalizado la task css!"))
})

gulp.task('js', function() {
  gulp.src('js/*.js')
  	.pipe(concatJs('app.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('js'))
    .pipe(notify("Ha finalizado la task js!"))
})

gulp.task('default',function () {
    gulp.watch('sass/**/*.scss',['styles'])
})