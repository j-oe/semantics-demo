/** 
	fastclass
	FC/MATRIX MODULE
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define({
	/*
		Initialize matrix

		This function takes a memory object and returns
		a matrix (array of arrays) of this form:

		@avg    | class A | class B | class C | ...
		-------------------------------------------
		Token 1 |  weight |  weight |  weight | ...
		-------------------------------------------
		Token 2 |  weight |  weight |  weight | ...

	*/
	init: function(memoryObj) {

		 /*
			The weighting function is described here: https://www.home.hs-karlsruhe.de/~oeja0001/pub/oevermann-ziegler_doceng_2016-preprint.pdf
		*/

		var matrix = [], firstRow = [], allTokenWeights = {};

		// save avg length of objects in upper left corner
		var avgLength = memoryObj['@avg'] || 0;
		firstRow.push(avgLength);

		// get term frequency (tf) of term (i) across all classes & get total number of classes (C)
		var tf_i = {},
			C = [];
		for (var c in memoryObj) {
			if (c.slice(0,1) !== '@'){
				C.push(c);
				for (var token in memoryObj[c]) {
					if (!tf_i.hasOwnProperty(token)) tf_i[token] = 0;
					tf_i[token] += memoryObj[c][token];
				}
			}
		}

		// calculate all weights w_ij for term (i) in class (j)
		for (var j in memoryObj) {
			// create first row
			if (j.slice(0,1) !== '@') {
				firstRow.push(j);
			}
			// loop through tokens (i) in class (j)
			for (var i in memoryObj[j]) {

				var tf_ij = memoryObj[j][i],
					C_j = memoryObj[j]['@total'];

				// calculate token propability in class
				if (i.slice(0,1) !== '@') {
					
					// use TF-ICF-CF weighting method.
					var w_ij = Math.log(1 + tf_i[i]) * Math.log(1 + C.length / tf_i[i]) * (tf_ij / C_j),
						classAndTokenWeight = [j, w_ij];

					// don't store zero weight results as they are automatically added later in prefill step
					if (w_ij > 0) {
						if (!allTokenWeights.hasOwnProperty(i)) allTokenWeights[i] = [];
						allTokenWeights[i].push(classAndTokenWeight);
					}
				}
			}
		}

		// GC
		memoryObj = null;

		// add first row of matrix
		matrix.push(firstRow);
		var firstRowLength = firstRow.length;

		for (var t in allTokenWeights) {
			// create row template with token label (t) and prefill with zeros
			var newRow = [t];

			// caching
			var	tokenWeights = allTokenWeights[t],
				tokenWeightsLength = tokenWeights.length;

			for (var n = 1; n < firstRowLength; n++) newRow.push(0);

			// replace with calculated values (v) where applicable
			for (var v = 0; v < tokenWeightsLength; v++){
				// caching
				var classAndVal = tokenWeights[v],
					valInClass = classAndVal[1],
					classLabel = classAndVal[0];

				// finding position in matrix
				var	position = firstRow.indexOf(classLabel);

				newRow[position] = valInClass;
			}

			// add row to matrix
			matrix.push(newRow);
		}

		return matrix;
	},

	trans: function(matrix) {
		return  matrix[0].map(function (col, i) {
		  return matrix.map(function (row) {
			return row[i];
		  });
		});
	},

	create: function(memoryObj, inputTextObj) {
		return this.trans(this.init(memoryObj, inputTextObj));
	}
});