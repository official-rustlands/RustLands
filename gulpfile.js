const gulp = require('gulp');
const gulpSass = require('gulp-sass')(require('sass'));
const gulpSassGlob = require('gulp-sass-glob');
const gulpPostCss = require('gulp-postcss');
const postcssCssVariables = require('postcss-css-variables');
const postcssCalc = require('postcss-calc');
const autoprefixer = require('autoprefixer');
const gulpConcat = require('gulp-concat');
const gulpRename = require('gulp-rename');
const gulpUglify = require('gulp-uglify');
const gulpLivereload = require('gulp-livereload');
const gulpBrowserify = require('gulp-browserify');

//gulpSass.compiler = require('node-sass');

const nodemon = require('nodemon');

const js = [
    'bin/js',
    {
        bin: 'bin/js/**/*.js',
        modules: 'bin/js/modules/*.js',
        dir: 'bin/js/.dir'
    }
];

const scss = [
    'bin/scss',
    {
        bin: 'bin/scss/**/*.scss',
        modules: 'bin/scss/modules/*.scss',
        dir: 'bin/scss/.dir'
    }
];

gulp.task('scss', async () => {
    return gulp.src([scss[1].bin, scss[1].modules])
        .pipe(gulpSassGlob())
        .pipe(gulpSass({
            outputStyle: 'compressed'
        }).on('error', gulpSass.logError))
        .pipe(gulpPostCss([autoprefixer()]))
        .pipe(gulpRename('~css.css'))
        .pipe(gulp.dest(scss[1].dir))
        .pipe(gulpLivereload())
        .pipe(gulpRename('~css.min.css'))
        .pipe(gulpPostCss([postcssCssVariables(), postcssCalc()]))
        .pipe(gulp.dest(scss[1].dir));
});

gulp.task('js', async () => {
    return gulp.src([js[1].bin, js[1].modules])
        .pipe(gulpBrowserify({
            transform: ['babelify'],
            insertGlobals: true,
        }))
        .pipe(gulpConcat('~js.js'))
        .pipe(gulp.dest(js[1].dir))
        .pipe(gulpLivereload())
        .pipe(gulpRename('~js.min.js'))
        .pipe(gulpUglify())
        .pipe(gulp.dest(js[1].dir))
        .pipe(gulpLivereload());
});

gulp.task('watch', gulp.series(['scss', 'js'], async () => {
    /*gulpLivereload.listen();

    nodemon({
        script: 'www.js',
        stdout: true
    }).on('readable', () => {
        this.stdout.on('data', (chunk) => {
            if (/^listening/.test(chunk)) {
                gulpLivereload.reload();
            }

            process.stdout.write(chunk);
        });
    });*/

    gulp.watch([scss[1].bin, scss[1].modules], gulp.series(['scss']));
    gulp.watch([js[1].bin, js[1].modules], gulp.series(['js']));
}));