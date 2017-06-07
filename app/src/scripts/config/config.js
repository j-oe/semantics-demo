/** 
	fastclass
	APP CONFIGURATION
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define({
	appIRI: 'http://dev.fastclass.de',
	appName: 'fastclass DevPreview',

	// path to fastclass worker script? string, default: 'worker/fastclass-worker.js' 
	fcWorkerURL: 'scripts/worker/fastclass-worker.js',
	// path to annotation worker script? string, default: 'worker/annotation-worker.js' 
	waWorkerURL: 'scripts/worker/annotation-worker.js',
	// include more details in report (e.g. full text of module)? boolean, default: true
	verboseReporting: true,
	// default confidence threshold for QS? integer, default: 70
	confidenceThreshold : 70,

	demoFiles: {
		fcm: {en: 'res/data/demo.fcm'}, 
		pdf: {en: 'res/data/pdf.json'} 
	},

	indicators: true,

	indicatorValues: {
		nrOfObjects: {
			type: 'scale',
			values: [100,1000]
		},
		nrOfClasses: {
			type: 'range',
			values: [2,20,40]
		},
		sizeOfObjects: {
			type: 'range',
			values: [50,500,1000]
		},
		timeElapsed: {
			type: 'scale',
			values: [100,0]
		}
	}
});