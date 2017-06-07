/** 
	fastclass
	CORE MAIN MODULE
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define(['modules/tokens', 'modules/sets', 'modules/vectors', 'modules/matrix', 'configs/config-core'], 
	function (tkns, sets, vec, mtx, cfg) {
	/*

	the core module returns the fc object which can be used for training and classifying data.

	*/

	this.fc = {

		version: '1.0.0',

		train: function (inputTextArr, options) {
			var defaults = {
				returnMatrix: true,
				returnObj: false,
				defaultClass: false,
				timeElapsed: true,
				extendObj: {},
			}, opt = Object.assign({}, defaults, options);
			
			var memoryObj = fc.prepare(inputTextArr, opt.extendObj, opt.defaultClass);

			if (opt.returnMatrix && !opt.returnObj) {
				return mtx.create(memoryObj);
			} else if (opt.returnMatrix && opt.returnObj) {
				return [mtx.create(memoryObj), memoryObj];
			} else if (!opt.returnMatrix && opt.returnObj) {
				return memoryObj;
			} else {
				return [];
			}
		},

		extend: function (inputTextArr, memoryObj) {
			return fc.train(inputTextArr, {
				extendObj: memoryObj,
				returnObj: true
			});
		},

		prepare: function (inputTextArr, existingMemoryObj, defaultClass) {

			var memoryObj = existingMemoryObj || {},
				nrOfValidObjects = 0,
				objLenghts = [],
				averageLength = 0;

			// loop over text fragments of input
			for (var i = 0; i < inputTextArr.length; i++) {
				var className = defaultClass || inputTextArr[i].clf,
					textTokens = tkns.ngram(inputTextArr[i].txt, cfg.nrOfNgrams, cfg.minLengthOfTokens, cfg.encryptTokens),
					signalTokens = [];

				// advanced use: signal token with semantic weighting
				if (cfg.signalsEnabled && inputTextArr[i].hasOwnProperty('sig')) {
					signalTokens = tkns.ngram(inputTextArr[i].sig, cfg.nrOfNgrams, cfg.minLengthOfTokens, cfg.encryptTokens);
				}

				if (textTokens.length > 1 + cfg.minNrOfTokens) {
					// create or update property for className of fragment
					if (!memoryObj.hasOwnProperty(className)) memoryObj[className] = {};
					tkns.update(memoryObj[className], textTokens, signalTokens, cfg.tokenWeighting, cfg.signalWeighting);

					nrOfValidObjects++;
					objLenghts.push(tkns.seperate(inputTextArr[i].txt, cfg.minLengthOfTokens).length);
				}
			}

			// filter out 0-lengths and calculate average object length
			objLenghts = objLenghts.filter(function (objLength) {return objLength > 0;});
			averageLength = Math.round(sets.avg(objLenghts) * 10) / 10;

			memoryObj['@cls'] = Object.keys(memoryObj).length;  // set number of classes
			memoryObj['@avg'] = averageLength;                  // set average object length
			memoryObj['@inp'] = inputTextArr.length;            // set number of analyzed objects (input)
			memoryObj['@cnt'] = nrOfValidObjects;	            // set number of objects qualified for training

			return memoryObj;
		},

		classify: function (textInput, memoryMatrix) {
			var startTime = fc._getTime(),
				inputTokens = tkns.ngram(textInput, cfg.nrOfNgrams, cfg.minLengthOfTokens, cfg.encryptTokens),
				inputVector = vec.create(tkns.count(inputTokens), memoryMatrix);

			var predictions = [null];

			for (var r = 1; r < memoryMatrix.length; r++) {
				var classVector = memoryMatrix[r].slice(1),
					predictionValue = vec[cfg.similarityCalc](inputVector, classVector);

				predictions.push(predictionValue);
			}

			var prediction = fc._getClass(predictions, memoryMatrix),
				confidence = fc._getConf(predictions);

			var stopTime = fc._getTime(),
				timeElapsed = stopTime - startTime,
				infoObj = [];
			
			for (var i = predictions.length - 1; i >= 0; i--) {
				if (predictions[i] !== null){
					infoObj.push({
						lbl: memoryMatrix[i][0],
						val: predictions[i]
					});
				}
			}

			var resultObject = {
				pred: prediction,
				conf: Math.round(confidence),
				time: Math.round(timeElapsed),
				info: infoObj
			};

			return resultObject;
		},

		_getClass: function (predictions, memoryMatrix) {
			// get index of predicition with highest value
			var indexOfMax = predictions.indexOf(sets.max(predictions));
			// if maxmimum is distinct return label, if not return null
			return memoryMatrix[indexOfMax] ? memoryMatrix[indexOfMax][0] : 'CLASSIFICATION_ERROR';
		},

		_getConf: function (predictions) {
			// rank predicition by value
			var ranked = sets.srt(predictions);
			// calculate distance from first to second prediction value in relation to all values
			var r = (ranked[0] - ranked[1]) / (ranked[0] - ranked[ranked.length - 1]) * 100;
			return r || 0;
		},

		_getTime: function() {
			if (typeof performance !== 'undefined') {
				return performance.now();
			} else {
				return Date.now();
			}
		}
	};

	return this.fc;
});