/* 
	fastclass
	ANNOTATION WORKER MODULE
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT
*/

//>>excludeStart("importScripts", pragmas.importScripts);
importScripts('../../vendor/require.js');
require.config({
	baseUrl: '../'
});
//>>excludeEnd("importScripts");

require(['helper/util', 'config/config'], function (util, cfg) {

	// post message when ready
	self.postMessage({ready: true});

	var worker = {

		createAnnotations: function (classifiedData, fileName, type, uuid) {
			var result = [],
				metaData = {
					appID: cfg.appIRI,
					appName: cfg.appName,
					modelID: uuid,
					sourceID: createSourceID(fileName)
				};

			function createSourceID (fileName) {
				if (fileName.includes('http')) {
					return fileName;
				} else {
					return cfg.appIRI + '/resource/' + fileName + '.' + type;
				}
			}

			function createClassID (className) {
				if (className.includes('http')) {
					return className;
				} else {
					return cfg.appIRI + '/model/' + metaData.modelID + '/class#' + className;
				}
			}

			if (type === 'pdf') {
				/* range-based annotations*/
				var ranges = worker.findRanges(classifiedData);

				for (var i = 0; i < ranges.length; i++) {
					var rangeClass = ranges[i].clf,
						rangeText = ranges[i].txt,
						startPos = ranges[i].start,
						endPos = ranges[i].end;

					var pdfAnno = worker.createPDFAnnotation(metaData, createClassID(rangeClass), startPos, endPos, rangeText);
					result.push(pdfAnno);
				}
			} else {
				/* per module annotations */
				for (var j = 0; j < classifiedData.length; j++) {
					var moduleID = classifiedData[j].xid,
						moduleClass = classifiedData[j].clf,
						moduleText = classifiedData[j].txt;

					var anno = worker.createXMLAnnotation(metaData, moduleID, createClassID(moduleClass), moduleText);
					result.push(anno);
				}
			}

			self.postMessage(result);		
		},

		findRanges: function (data) {
			var ranges = [];

			function findRange (data, index) {
				var startPos = data[index].pos,
					startTxt = data[index].txt || 'text redacted for demo',
					clf = data[index].clf;

				// set inital values
				var nextIndex = index,
					allText = startTxt,
					endPos = startPos;
				
				for (var p = index; p < data.length && data[p].clf === clf; p++) {
					endPos = data[p].pos;
					nextIndex = p + 1;

					// remove overlapping text fragments from PDF chunking
					var commonTxt = util.findOverlap(allText, data[p].txt);
					allText = allText + data[p].txt.slice(commonTxt.length);
				}

				// save range
				ranges.push({
					clf: clf,
					txt: allText,
					start: startPos,
					end: endPos
				});

				// next search
				if (nextIndex < data.length) {
					findRange(data, nextIndex);
				}
			}

			// start recursive search
			findRange(data, 0);

			return ranges;
		},

		createXMLAnnotation: function (metaData, moduleID, classID, text) {

			var uuid = util.getUUID(),
				date = util.getDateString();

			return {
				'@context': 'http://www.w3.org/ns/anno.jsonld',
				'@id': uuid,
				'@type': 'Annotation',
				'creator': {
					'@id': metaData.appID,
					'@type': 'Software',
					'name': metaData.appName
				},
				'created': date,
				'motivation': 'classifying',
				'body': {
					'@id': classID 
				},
				'target': {
					'@id': uuid + '/target',
					'@type': 'SpecificResource',
					'source': metaData.sourceID + '#' + moduleID,
					'format': 'application/xml',
					'refinedBy': {
						'@id': uuid + '/selector/text',
						'@type': 'TextQuoteSelector',
						'exact': text
					}
				}
			};
		},

		createPDFAnnotation: function (metaData, classID, start, end, text) {

			var uuid = util.getUUID(),
				date = util.getDateString();

			return {
				'@context': 'http://www.w3.org/ns/anno.jsonld',
				'@id': uuid,
				'@type': 'Annotation',
				'creator': {
					'@id': metaData.appID,
					'@type': 'Software',
					'name': metaData.appName
				},
				'created': date,
				'motivation': 'classifying',
				'body': {
					'@id': classID 
				},
				'target': {
					'@id': uuid + '/target',
					'@type': 'SpecificResource',
					'source': metaData.sourceID,
					'format': 'application/pdf',
					'selector': {
						'@id': uuid + '/selector',
						'@type': 'RangeSelector',
						'startSelector': {
							'@id': uuid + '/selector/start',
							'@type': 'FragmentSelector',
							'value': 'page=' + start,
							'conformsTo': 'http://tools.ietf.org/rfc/rfc3778'
						},
						'endSelector': {
							'@id': uuid + '/selector/end',
							'@type': 'FragmentSelector',
							'value': 'page=' + end,
							'conformsTo': 'http://tools.ietf.org/rfc/rfc3778'
						},
						'refinedBy': {
							'@id': uuid + '/selector/text',
							'@type': 'TextQuoteSelector',
							'exact': text
						}
					}
				}
			};
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