var gulp = require('gulp');
var rename = require('gulp-rename');
var browserify = require('gulp-browserify');
var uglify = require('gulp-uglify');
var watch = require('gulp-watch');

gulp.task('buildFR', function () {
	gulp.src('index.js')
		.pipe(browserify({
			insertGlobals: false,
			detectGlobals: false,
			debug: false
		}))
		.pipe(rename('fastRender.js'))
		.pipe(gulp.dest('./test/www/lib'))
		.pipe(uglify())
		.pipe(gulp.dest('./build'));
});

gulp.task('buildWorker', function () {
	gulp.src('./lib/renderWorker.js')
		.pipe(browserify({
			insertGlobals: false,
			detectGlobals: false,
			debug: false
		}))
		.pipe(rename('fastRenderWorker.js'))
		.pipe(gulp.dest('./test/www/lib'))
		.pipe(uglify())
		.pipe(gulp.dest('./build'));
});

gulp.task('default', ['buildFR', 'buildWorker']);