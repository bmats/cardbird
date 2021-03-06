import gulp from 'gulp';
import connect from 'gulp-connect';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';

gulp.task('browserify', () => {
  return browserify('src/app.js')
    .transform(babelify, { presets: ['es2015'] })
    // .on('error', (e) => console.err(e))
    .bundle()
    .pipe(source('bundle.js')) // output filename
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('watch', () => {
  gulp.watch('src/**/*.js', ['browserify']);
});

gulp.task('connect', () => {
  connect.server({
    livereload: true
  });
});

gulp.task('build', ['browserify']);
gulp.task('default', ['build', 'watch', 'connect']);
