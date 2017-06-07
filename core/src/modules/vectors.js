/** 
	fastclass
	FC/VECTORS MODULE
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define({
	create: function(inputObj, matrix) {
		var vector = [];

		// adjust vector size to matrix, non-mutual components as zero
		for (var c = 1; c < matrix[0].length; c++){
			var component = matrix[0][c];

			if (inputObj.hasOwnProperty(component)) {
				// shift to left to account for matrix row label
				vector[c-1] = inputObj[component];
			} else {
				vector[c-1] = 0;
			}
		}

		return vector;
	},

	match: function(vector1, vector2) {
		var common = vector1.concat(vector2),
			unique = [];

		for (var i = 0; i < common.length; i++){
			if(unique.indexOf(common[i]) === -1) {
				unique.push(common[i]);
			}
		}

		return unique;
	},

	dot: function(vector1, vector2) {
		var product = 0;

		// dot product of two vectors (Skalarprodukt)
		for (var i = 0; i < vector1.length; i++){
			product += vector1[i] * vector2[i];
		}

		return product;
	},

	norm: function(vector) {
		var lengthOfVector = 0;

		// squareroot of dot product with self is length (norm) of vector
		lengthOfVector = Math.sqrt(this.dot(vector, vector));

		return lengthOfVector;
	},

	cosine: function(vector1, vector2) {
		var cosineOfVectors = 0;

		// calculate cosine of two vectors (https://en.wikipedia.org/wiki/Cosine_similarity)
		cosineOfVectors = this.dot(vector1, vector2) / (this.norm(vector1) * this.norm(vector2));

		return cosineOfVectors;
	},

	l1: function(vector1, vector2) {
		var l1 = 0;

		// manhattan or L1 distance between two vectors
		for (var i = 0; i < vector1.length; i++){
			l1 += Math.abs(vector1[i] - vector2[i]);
		}

		return 1 / l1; // has to be inverted, to get similarity
	}
});