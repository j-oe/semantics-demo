/** 
	fastclass
	UTIL MODULE (utilities & helper functions)
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define(function () {
	var util = {
		browserHasFunctionality: function () {
			var hasFeatures = window.Worker && window.File && window.FileReader &&
							  window.DOMParser && window.fetch &&
							  Object.keys && Object.assign,
				isIEBrowser = /Trident/i.test(navigator.userAgent);

			return hasFeatures && !isIEBrowser;
		},

		stripURL: function (url) {
			if (url && url.indexOf('#') !== -1) {
				return url.substring(url.indexOf('#') + 1);
			} else {
				return 'start';
			}
		},

		makeUnique: function (sourceArray) {
			var uniqueObj = {};

			for (var i = 0; i < sourceArray.length; i++) {
				uniqueObj[sourceArray[i]] = true;
			}

			return Object.keys(uniqueObj);
		},

		pushArray: function (sourceArray, targetArray) {
			Array.prototype.push.apply(sourceArray, targetArray);
		
			return sourceArray;
		},

		indexOfMax: function (sourceArray) {
			var max = sourceArray[0],
				maxIndex = 0;

			for (var i = 1; i < sourceArray.length; i++) {
				if (sourceArray[i] > max) {
					maxIndex = i;
					max = sourceArray[i];
				}
			}

			return maxIndex;
		},

		getClassDistribution: function (data) {
			var classDistribution = [];
			
			// if native memoryObject (generated)
			if (data.constructor === Object) {
				for (var classname1 in data) {
					if (classname1.substring(0,1) !== '@') {
						classDistribution.push({
							label: classname1,
							value: data[classname1]['@total']
						});
					}
				}
			} else {
			// if array data for classifying
				var classObj = {};
				for (var i = 0; i < data.length; i++) {
					classObj[data[i].clf] = classObj[data[i].clf] + 1 || 1;
				}
				for (var classname2 in classObj) {
					classDistribution.push({
						label: classname2,
						value: classObj[classname2]
					});
				}
			}		
			return classDistribution;
		},

		copyObject: function (original) {
			return JSON.parse(JSON.stringify(original));
		},

		createFileName: function (string) {
			var spaceless = string.replace(/\s+/g, '-'),
				sanitized = spaceless.replace(/[@,\.;:\?!\\§$%&#\/\(\)=\+±`'‚’„“”"\*´°><^\[\]]+/g, '');

			return 'fastclass_' + sanitized;
		},

		requireCSS: function (url) {
			var links = Array.prototype.slice.call(document.getElementsByTagName("link")),
				loaded = links.some(function(l){return l.attributes.href.value === url;});

			if (loaded === false) {
				var link = document.createElement("link");
				link.type = "text/css";
				link.rel = "stylesheet";
				link.href = url;
				document.getElementsByTagName("head")[0].appendChild(link);
			}
		},

		downloadFile: function (data, filename) {
			var json = JSON.stringify(data),
				blob = new Blob([json], {type: 'octet/stream'});

			util.downloadBlob(blob, filename);
		},

		downloadBlob: function (blob, filename) {
			var url  = window.URL.createObjectURL(blob),
				link = document.createElement('a');
			
			link.download = filename;
			link.href = url;
			link.click();
			link.remove();
			window.URL.revokeObjectURL(url);
		},

		getUUID: function () {
			/*based on http://stackoverflow.com/a/2117523*/
			var d = new Date().getTime(),
				templateString = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
			
			var uuid = templateString.replace(/[xy]/g, function(c) {
				var r = (d + Math.random()*16)%16 | 0;
				d = Math.floor(d/16);
				return (c=='x' ? r : (r&0x3|0x8)).toString(16);
			});
			return uuid;
		},

		
		findOverlap: function (stringA, stringB) {
			/* based on https://www.garysieling.com/blog/javascript-function-find-overlap-two-strings */
			if (stringB.length === 0) {
				return "";
			}
			 
			if (stringA.endsWith(stringB)) {
				return stringB;
			}
			 
			if (stringA.indexOf(stringB) >= 0) {
				return stringB;
			}
			 
			return util.findOverlap(stringA, stringB.substring(0, stringB.length - 1));
		},

		getLocale: function() {
			return document.documentElement.lang;
		},

		getTime: function() {
			if (performance) {
				return performance.now();
			} else {
				return Date.now();
			}
		},

		getDateString: function() {
			var currentDate = new Date();
			return currentDate.toISOString();
		},

		round: function (value, decimalPlace) {
			var dP = decimalPlace || 0;
			return Math.round(value * Math.pow(10, dP)) / Math.pow(10, dP);
		},

		percent: function (fraction, total, decimalPlace) {
			if (fraction && total && total !== 0) {
				return util.round(fraction / total * 100, decimalPlace) + '%';
			}
		}
	};

	return util;
});