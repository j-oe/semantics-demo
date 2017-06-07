/** 
	fastclass
	PDFTEXT MODULE
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT
	
*/

define(['configs/config-pdftext', 'modules/tokens'], function (cfg, tkns) {
	/*

	pdftext namespace (pdf)
	
	*/
	var pdf = {
		chunk: function (pdfData, avgWordCount) {
			var extracted = pdf._getText(pdfData),
				inputText = extracted[0],
				inputMeta = extracted[1];

			var	inputTokens = tkns.seperate(inputText),
				avgLength = Math.round(avgWordCount + cfg.avgDeviation),
				indexShift = Math.round(avgLength * cfg.indexShift);

			var	txtObjects = [],
				absPosition = 0;

			for (var o = 0; o < inputTokens.length - avgLength; o += indexShift) {
				var currTokens = inputTokens.slice(o, o + avgLength),
					joinedTokens = currTokens.join(' ');

				txtObjects.push({
					"xid": 'n' + o, 								/* enumerated ID for chunk */
					"pos": pdf._getPage(absPosition, inputMeta), 	/* reconstructed page position*/
					"txt": joinedTokens, 							/* fastclass-conformant text */
				});

				absPosition += joinedTokens.length * cfg.indexShift;
			}

			return txtObjects;
		},

		_getPage: function (position, metaArr) {
			var page = -1;
			
			for (var i = 0; i < metaArr.length; i++){
				var currObj = metaArr[i];
				if (position >= currObj.s && position <= currObj.e){
					page = currObj.p;
				}
			}

			return page;
		},

		_getText: function (pdfData) {
			var pdfLines = [],
				pdfMeta = [],
				pdfChars = 0;

			for (var p = 0; p < pdfData.length; p++) {
				var page = pdfData[p],
					pageNr = p + 1,
					pageChars = 0,
					pageLines = [];

				for (var i = 0; i < page.items.length; i++) {
					var lineContentRaw = page.items[i].str,
						cleanedNoSpaces = lineContentRaw.replace(/\s+/g, ' '),
						cleanedNoHyphens = cleanedNoSpaces.replace(/(\w)(\-\s)([^u])/g, '$1$3');
					pdfLines.push(cleanedNoHyphens);
					pageChars += cleanedNoHyphens.length + 1;
				}

				pdfMeta.push({p: pageNr, c: pageChars, s: pdfChars, e: pdfChars + pageChars});
				pdfChars += pageChars;
			}

			var joinedLines = pdfLines.join(' ');

			return [joinedLines, pdfMeta];
		},

		/* DEPRECATED */
		_filterLines: function (lines, nrOfPages, treshold) {
			var groupedLines = tkns.count(lines),
				boundary = treshold || 10,
				badLines = [];

			for (var line in groupedLines) {
				if (groupedLines[line] > (nrOfPages - boundary)){
					badLines.push(line);
				}
			}

			var filteredLines = lines.filter(function (line) {
				return badLines.indexOf(line) === -1;
			});

			return filteredLines;
		}
	};

	return pdf;
});