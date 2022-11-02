const { src, dest, series } = require('gulp');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const autoprefixer = require('gulp-autoprefixer');
const minifyCSS = require('gulp-minify-css');
const babel = require("gulp-babel");
const rev = require('gulp-rev'); //对文件名加MD5后缀
const revCollector = require('gulp-rev-collector'); //路径替换
const clean = require('gulp-clean');
const entry = "src/"; //要处理的源码文件夹
const dist = 'dist/'; //被处理后的文件保存的目录

const condition = function (f) {
  if (f.path.endsWith('.min.js') || f.path.endsWith('.min.css')) {
    return false;
  }
  return true;
};

//清除文件夹里之前的内容
function cleanBefore() {
  return src(dist, { read: false, allowEmpty: true })
    .pipe(clean());
}

//打包图片
function movePic() {
  return src(entry + 'img/*')
    .pipe(rev())
    .pipe(dest(dist + 'img/'))
    .pipe(rev.manifest('rev-img-manifest.json')) //生成一个rev-img-manifest.json
    .pipe(dest('rev')); //将 rev-img-manifest.json 保存到 rev 目录内;
}

//css压缩,将源码文件夹内的css文件夹下的所有css压缩，并生成文件名带hash随机值的新文件保存在dist的css目录下
function minifyCss() {
  return src(entry + 'css/*.css')
    .pipe(gulpif(condition, autoprefixer({ cascade: false }))) //补全css
    .pipe(gulpif(condition, minifyCSS())) //压缩css
    .pipe(rev()) //文件名加MD5后缀
    .pipe(dest(dist + 'css/')) //输出到css目录
    .pipe(rev.manifest('rev-css-manifest.json')) ////生成一个rev-css-manifest.json
    .pipe(dest('rev')); //将 rev-css-manifest.json 保存到 rev 目录内
}

//js压缩,将源码文件夹src内的js文件夹下的所有js文件压缩混淆，并生成文件名带hash随机值的新文件保存在dist的js目录下
function minifyJs() {
  return src(entry + 'js/*.js')
    .pipe(gulpif(condition, babel({
      presets: ['@babel/preset-env']
    })))
    .pipe(gulpif(condition, uglify())) //压缩js到一行
    .pipe(rev()) //文件名加MD5后缀
    .pipe(dest(dist + 'js/')) //输出到js目录
    .pipe(rev.manifest('rev-js-manifest.json')) ////生成一个rev-js-manifest.json
    .pipe(dest('rev')); //将 rev-js-manifest.json 保存到 rev 目录内
}

//html压缩
function minifyHtml() {
  var options = {
    removeComments: true, //清除HTML注释
    collapseWhitespace: true, //压缩HTML
    collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> 
    minifyJS: true, //压缩页面JS
    minifyCSS: true //压缩页面CSS
  };
  return src(entry + '*.html')
    .pipe(htmlmin(options))
    .pipe(dest(dist));
}

//使用rev-collect将在css引入的资源路径也替换成md5文件名
function srcCssReplace() {
  //css，针对img
  return src(['rev/rev-img-manifest.json', dist + 'css/*.css'])
    .pipe(revCollector({ replaceReved: true }))
    .pipe(dest(dist + 'css/'));
};

//使用rev-collect将在js引入的资源路径也替换成md5文件名
function srcJsReplace() {
  //js，针对img
  return src(['rev/rev-img-manifest.json', dist + 'js/*.js'])
    .pipe(revCollector({ replaceReved: true }))
    .pipe(dest(dist + 'js/'));
};

//使用rev-collect将在html引入的资源路径也替换成md5文件名
function srcHtmlReplace() {
  //html，针对js,css,img
  return src(['rev/*.json', dist + '*.html'])
    .pipe(revCollector({ replaceReved: true }))
    .pipe(dest(dist));
};

exports.default = series(cleanBefore, movePic, minifyCss, minifyJs, minifyHtml, srcCssReplace, srcJsReplace, srcHtmlReplace); //组合任务
