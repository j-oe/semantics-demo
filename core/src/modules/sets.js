/**  
	fastclass
	FC/SETS MODULE
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define({
	// filter out non-numbers
	cln: function(set) {
		return set.filter(function(n){
			return typeof n === 'number' && !isNaN(n);
		});
	},

	// sum of all elements of set
	sum: function(set) {
		return set.reduce(function(a, b) {
			return a + b;
		});
	},

	// maximum value of set
	max: function(set) {
		return Math.max.apply(Math, set);
	},

	// maximum value of set
	min: function(set) {
		return Math.min.apply(Math, set);
	},

	// average value of set
	avg: function(set) {
		var clean = this.cln(set);
		return this.sum(clean) / clean.length;
	},

	// sorted copy of set (decreasing order)
	srt: function(set) {
		return set.slice(0).sort(function(a, b) {
			return b - a;
		});
	},

	// standard deviation of set
	sdv: function(set) {
		var avg = this.avg(set);

		var	sqDiff = set.map(function(a){
			return Math.pow(a - avg, 2);
		});

		return Math.sqrt(1 / (set.length - 1) * this.sum(sqDiff));
	},

	// standard deviation (for discrete functions)
	sdd: function(set) {
		var v = this.vrc(set);

		return Math.sqrt(v);
	},

	// expectation value
	exp: function(set) {
		var sum = this.sum(set),
			exp = 0;

		for (var j = 0; j < set.length; j++){
			exp += (j+1) * set[j]/sum;
		}

		return exp;
	},

	// variance
	vrc: function(set) {
		var exp = this.exp(set),
			sum = this.sum(set);

		var	values = set.map(function(a, i){
			return Math.pow((i+1) - exp, 2) * (a / sum);
		});

		return this.sum(values);
	},

	// softmax
	smx: function(set) {
		var result = [],
			sumExp = 0;

		for (var i = 0; i < set.length; i++){
			sumExp += Math.exp(set[i]);
		}

		for (var k = 0; k < set.length; k++){
			result.push(Math.exp(set[k]) / sumExp);
		}

		return result;
	},

	// unique elements of array
	unq: function(set) {
		var tmpObject = {};

		for (var i = 0; i < set.length; i++) {
			tmpObject[set[i]] = true;
		}

		return Object.keys(tmpObject);
	}
});