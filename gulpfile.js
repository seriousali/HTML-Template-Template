import pkg from 'gulp';
const { gulp, src, dest, parallel, series, watch } = pkg

import bs from 'browser-sync';
import gulpSass from 'gulp-sass';
import dartSass from 'sass';
import postCss from 'gulp-postcss';
import cssnano from 'cssnano';
const  sassfn = gulpSass(dartSass);
import concat from 'gulp-concat';
import uglifyim from 'gulp-uglify-es';
const  uglify = uglifyim.default;
import imageminfn from 'gulp-imagemin';
import imagewebp from 'gulp-webp';
import autoprefixer  from 'autoprefixer';
import fileinclude   from 'gulp-file-include';
import htmlmin       from 'gulp-htmlmin';
import {stream}      from 'critical';

process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = true;

const path = {
  src: {
    html: "src/*.html",
    others: "src/*.+(php|ico|png)",
    htminc: "src/partials/**/*.htm",
    incdir: "src/partials/",
    plugins: "src/plugins/**/*.*",
    pluginsCss: "src/plugins/**/*.css",
    pluginsJs: "src/plugins/**/*.js",
    js: "src/js/*.js",
    scss: "src/scss/**/*.scss",
    images: "src/img/**/*.+(png|jpg|gif|svg)",
  },
  build: {
    dirDev: "dist/",
    html: "dist/*.html",
    css: "dist/css/main.min.css"
  },
};

function browsersync() {
	bs.init({
		server: {
			baseDir: path.build.dirDev,
		},
		ghostMode: { clicks: false },
		notify: false,
		online: true,
    // TODO: Tunnel Name
		tunnel: '',
	})
}

function html() {
  return src(path.src.html)
    .pipe(
      fileinclude({
        basepath: path.src.incdir,
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest(path.build.dirDev))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
}

function js() {
	return src(path.src.js)
	.pipe(uglify())
	.pipe(dest(path.build.dirDev + 'js/'))
	.pipe(bs.stream())
}

function sass() {
	return src(path.src.scss)
	.pipe(sassfn())
	.pipe(postCss([
		autoprefixer({ grid: 'autoplace' }),
		cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
	]))
	.pipe(concat('main.min.css'))
	.pipe(dest(path.build.dirDev + 'css/'))
	.pipe(bs.stream())
}

function imagemin() {
	return src(path.src.images)
		.pipe(imageminfn())
    .pipe(dest(path.build.dirDev + "img/"))
}

function generateCriticalCSS() {
  return src(path.build.html)
    .pipe(stream({
      base: path.build.dirDev,
      inline: true,
      css: [path.build.css],
      dimensions: [{
        width: 320,
        height: 480
      }, {
        width: 768,
        height: 1024
      }, {
        width: 1280,
        height: 960
      }]
    }))
    .pipe(dest(path.build.dirDev));
}

function webpImage() {
  return src(path.build.dirDev + "img/**/*.+(png|jpg|gif|svg)")
   .pipe(imagewebp())
   .pipe(dest(path.build.dirDev + "img/"))
   .pipe(
     bs.reload({
       stream: true,
     })
   );
}

function plugins() {
  
  return src(path.src.plugins)
    .pipe(dest(path.build.dirDev + "plugins/"))
    .pipe(
      bs.reload({
        stream: true,
      })
    );
}

function startwatch() {
  watch(path.src.html, html);
  watch(path.src.htminc, html);
  watch(path.src.scss, sass);
  watch(path.src.js, js);
  watch(path.src.images, imagemin);
  watch(path.build.dirDev + "img/**/*.+(png|jpg|gif|svg)", webpImage);
  watch(path.src.plugins, plugins);
}

function buildProject() {
  return series(html, js, sass, imagemin, webpImage, plugins, generateCriticalCSS)
}

export const build = buildProject();
export default series(html, js, sass, imagemin, webpImage, plugins, generateCriticalCSS, parallel(browsersync, startwatch))
