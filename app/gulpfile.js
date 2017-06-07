var gulp = require('gulp'),
	requirejs = require('requirejs'),
	mainBowerFiles = require('main-bower-files');

var r = {
	appDir: 'src',
	baseUrl: 'scripts',
	dir: 'dist',
	removeCombined: true,
	paths: { 
		/* worker */
		'fcWorker': 		'worker/fastclass-worker',
		'waWorker': 		'worker/annotation-worker',
		/* core */
		'core': 		'../../../core/src',
		'modules': 		'../../../core/src/modules',
		'model': 		'../../../core/src/model/model',
		'utilities': 	'../../../core/src/utilities',
		'conf': 		'../../../core/src/configs',
		'configs': 		'../../../core/src/configs',
		/* 3rd party*/
		'd3': 			'../vendor/d3',
		'pie': 			'../vendor/d3pie', 
		'mg': 			'../vendor/metricsgraphics',
		'zip': 			'../vendor/jszip',
		'selectize': 	'../vendor/selectize',
		'jquery': 		'../vendor/jquery',
		'localforage': 	'../vendor/localforage',
		'microplugin': 	'../vendor/microplugin',
		'sifter': 		'../vendor/sifter',
		'almond': 		'../vendor/almond',
		'pdfjs-dist/build/pdf': 
			'../vendor/pdf', 
		'pdfjs-dist/build/pdf.worker': 
			'../vendor/pdf.worker',
	},
	modules: [
		/* main modules */
		{ name: 'main' },
		{ name: 'view/plot' },
		{ name: 'selectize' },
		/* fcWorker */
		{
			name: 'fcWorker',
			include: ['almond'],
			insertRequire: ['fcWorker'],
			wrap: true
		},
		/* waWorker */
		{
			name: 'waWorker',
			include: ['almond'],
			insertRequire: ['waWorker'],
			wrap: true
		}
	],
	pragmasOnSave: {
        importScripts: true
    },
	optimizeCss: 'standard.keepComments',
	writeBuildTxt: true,
	uglify2: { 
		mangle: true 
	},
	wrap: true,
	fileExclusionRegExp: /^\.|node_modules/,
	preserveLicenseComments: true
};

gulp.task('bower', function(){
    gulp.src(mainBowerFiles()).pipe(gulp.dest('./src/vendor'));
});

gulp.task('build', ['bower'], function(cb){
    requirejs.optimize(r, function (buildResponse) {
	    console.log(buildResponse);
	    cb();
	}, function(err) {
	    console.log(err);
	    cb(err);
	});
});

gulp.task('default', [ 'bower' ]);