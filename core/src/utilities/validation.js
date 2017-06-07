/** 
	fastclass
	WORKER
	VALIDATION MODULE
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT
	
*/

define(['configs/config-validation', 'modules/sets'], function (cfg, sets) {
	/*

	validation namespace (val)
	
	*/

	var val = {

		selfValidation: function (inputTextObj, memoryMatrix) {
			var modelMatrix = memoryMatrix || fc.train(inputTextObj),
				resultArr = val._getResult(inputTextObj, modelMatrix),
				returnValue = val._getRounded(resultArr[0], 1);
			return [returnValue, resultArr[1]];
		},

		randomSubsampling: function (inputTextObj) {
			var nrOfTests = Math.round(1 / cfg.crossValidRatio),
				allResults = [],
				testNr = 1;

			while (allResults.length < nrOfTests && testNr < cfg.subsamplingLimit) {
				var trainingSet = [],
					trainingClasses = {},
					validationSet = [],
					validationClasses = {};

				for (var i = 0; i < inputTextObj.length; i++) {
					var rnd = Math.random();
					if (rnd <= cfg.crossValidRatio) {
						if (validationSet.length / trainingSet.length <= cfg.crossValidRatio) {
							validationSet.push(inputTextObj[i]);
							validationClasses[inputTextObj[i].clf] = true;
						} else {
							trainingSet.push(inputTextObj[i]);
							trainingClasses[inputTextObj[i].clf] = true;
						}
					} else {
						trainingSet.push(inputTextObj[i]);
						trainingClasses[inputTextObj[i].clf] = true;
					}
				}

				var memoryMatrix = fc.train(trainingSet);

				// check if all classes of the validation set are actually in the training set.
				var validTestConstellation = Object.keys(validationClasses).every(
					/*jshint loopfunc: true */
					function (cl) {
						return Object.keys(trainingClasses).indexOf(cl) !== -1;
					}
				);

				if (validTestConstellation) {
					var singleResult = val._getResult(validationSet, memoryMatrix)[0];
					allResults.push(singleResult);
				}

				testNr++;
			}

			var returnValue =  val._getRounded(sets.avg(allResults), 1);
			return [returnValue, allResults];
		},

		crossValidation: function (inputTextObj) {
			var nrOfTests = Math.round(1 / cfg.crossValidRatio),
				allResults = [];

			function randomizeArrayOrder(arr) {
				var j, x, i;
				for (i = arr.length; i; i--) {
					j = Math.floor(Math.random() * i);
					x = arr[i - 1];
					arr[i - 1] = arr[j];
					arr[j] = x;
				}
			}

			randomizeArrayOrder(inputTextObj);

			for (var testNr = 0; testNr < nrOfTests; testNr++) {
				var size = Math.round(cfg.crossValidRatio * inputTextObj.length),
					start = testNr * size;

				var	validationSet = inputTextObj.slice(start, start + size),
					trainingSet = [].concat(inputTextObj.slice(0, start), inputTextObj.slice(start + size));

				var memoryMatrix = fc.train(trainingSet);

				var setResult = val._getResult(validationSet, memoryMatrix),
					singleResult = setResult[0];
				allResults.push(singleResult);
			}

			allResults = sets.cln(allResults);

			var returnValue =  val._getRounded(sets.avg(allResults), 1),
				sDeviation = sets.sdv(allResults);

			return [returnValue, allResults, sDeviation];
		},

		leaveOneOut: function (inputTextObj) {
			var allResults = [];

			for (var i = 0; i < inputTextObj.length; i++) {

				var	validationSet = inputTextObj.slice(i, i + 1),
					trainingSet = [].concat(inputTextObj.slice(0, i), inputTextObj.slice(i + 1));

				var memoryMatrix = fc.train(trainingSet);

				var singleResult = val._getResult(validationSet, memoryMatrix)[0];
					allResults.push(singleResult);
			}

			var returnValue =  val._getRounded(sets.avg(allResults), 1);
			return [returnValue, allResults];
		},

		_getResult: function (validationSet, memoryMatrix) {
			var correctPredictions = 0,
				falsePredictions = [];

			for (var i = 0; i < validationSet.length; i++) {
				var moduleID = (validationSet[i].hasOwnProperty('xid')) ? validationSet[i].xid : 'n' + i,
					classified = fc.classify(validationSet[i].txt, memoryMatrix);

				if (classified.pred === validationSet[i].clf) {
					correctPredictions++;
				} else {
					falsePredictions.push({
						object: moduleID,
						correct: validationSet[i].clf,
						guessed: classified.pred,
						confidence: classified.conf,
						values: classified.info,
						time: classified.time
					});
				}
			}

			var testResult = correctPredictions / validationSet.length * 100;
			return [testResult, falsePredictions];
		},

		_getRounded: function (value, decimalPlace) {
			var dP = decimalPlace || 0;
			return Math.round(value * Math.pow(10, dP)) / Math.pow(10, dP);
		}
	};

	return val;
});