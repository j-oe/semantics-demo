/* 
	fastclass
	WORKER MODULE
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT
*/

//>>excludeStart("importScripts", pragmas.importScripts);
importScripts('../../vendor/require.js');
require.config({
	baseUrl: '../../../../core/src', 
	paths: {
		'core/main': 'main'
	}
});
//>>excludeEnd("importScripts");

require(['core/main', 'utilities/validation', 'utilities/pdftext'], function (fc, val, pdf) {

	// post message when ready
	self.postMessage({ready: true});

	var worker = {

		trainFromScratch: function (inputArray) {
			self.postMessage(fc.train(inputArray, {returnObj: true}));
		},

		trainAndExtend: function (inputArray, memoryObject) {
			self.postMessage(fc.extend(inputArray, memoryObject));
		},

		classifyText: function (textInput, memoryMatrix) {
			self.postMessage(fc.classify(textInput, memoryMatrix));
		},

		classifyMultiple: function (inputArray, memoryMatrix) {
			var startTime = performance.now();

			for (var i = 0; i < inputArray.length; i++) {
				var classified = fc.classify(inputArray[i].txt, memoryMatrix);

				inputArray[i].clf = classified.pred;
				inputArray[i].cfd = classified.conf;
				
				self.postMessage(['status', [i, inputArray.length]]);
			}
			
			var stopTime = performance.now(), 
				timeElapsed = stopTime - startTime;
			self.postMessage(['result', [inputArray, timeElapsed]]);
		},

		crossValidate: function (inputArray) {
			self.postMessage(val.crossValidation(inputArray));
		},

		selfValidate: function (inputArray, memoryMatrix) {
			self.postMessage(val.selfValidation(inputArray, memoryMatrix));
		},

		chunkPDF: function (pdfData, avgWordCount) {
			self.postMessage(pdf.chunk(pdfData, avgWordCount));
		}

	};

	self.addEventListener('message', function (msg) {
		var functionName = msg.data[0],
			functionArguments = msg.data.splice(1);
		if (worker.hasOwnProperty(functionName)) {
			worker[functionName].apply(this, functionArguments);
		} else {
			throw new Error('No function with name: ' + functionName);
		}
	});
});

