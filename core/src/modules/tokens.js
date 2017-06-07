/**  
	fastclass
	FC/TOKENS MODULE
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define({
	seperate: function(textString, minimumLength) {
		var minLength = minimumLength || 1;

		if (typeof textString === 'string') {

			var noCamelCase = textString.replace(/([a-z])([A-Z]+)/g, '$1 $2');
				//noUppercase = noCamelCase.toLowerCase();

			var tokenizedString = noCamelCase.split(/\s+/g);

			var filteredTokens = tokenizedString.filter( function(token) {
				return token.length >= minLength;
			});

			return filteredTokens;
		} else {
			return [];
		}
	},

	clean: function(token) {
		var forbiddenChars = /[0-9@,\.\-–;:_\?!\\§$%&#\/\(\)=\+±`'‚’„“”"\*´°><^\[\]]+/g;

		// clean forbidden characters
		if (typeof token === 'string') {
			return token.replace(forbiddenChars, ' ');
		} else {
			return '';
		}
	},

	count: function(tokens) {
		var countObj = {};

		// count unique tokens
		for (var t = 0; t < tokens.length; t++) {
			var token = tokens[t];
			countObj[token] = countObj[token] + 1 || 1;
		}

		return countObj;
	},

	update: function(classifier, tokens, signalTokens, tokenWeight, signalWeight) {
		var sTokens = signalTokens || [],
			tWeight = tokenWeight || 1,
			sWeight = signalWeight || 2.5;

		// count unique tokens
		for (var t = 0; t < tokens.length; t++) {
			var token = tokens[t];
			classifier[token] = classifier[token] + tWeight || tWeight;

			// add weight to signal tokens
			if (sTokens.indexOf(token) !== -1 && token.slice(0,1) !== '@') {
				classifier[token] = classifier[token] + sWeight;
			}
		}
	},

	ngram: function(textString, numberOfGrams, minLengthOfToken, encryptTokens) {
		var cleanedString = this.clean(textString),
			inputTokens = this.seperate(cleanedString, minLengthOfToken);

		function hashGrams (string) {
			/* based on http://stackoverflow.com/a/7616484 */
			var hash = 0, i, chr;

			if (string.length === 0) return hash;
			
			for (i = 0; i < string.length; i++) {
				chr   = string.charCodeAt(i);
				hash  = ((hash << 5) - hash) + chr;
				hash |= 0;
			}
			return hash;
		}

		function makeGrams (tokens, nOfG) {
			var nMin = (nOfG > 1) ? nOfG - 1 : 1,
				nGrams = [];

			if (tokens.length > nMin) {
				// make token n-grams with token candidates
				for (var r = 0, rl = tokens.length - nMin; r < rl; r++) {
					var nGram = [];

					for (var n = 0; n < nOfG; n++) {
						var token = tokens[r + n];

						if (token && token !== '') nGram.push(token);
					}
					// kick out nGrams with wrong length
					if (nGram.length === nOfG) {
						nGrams.push(nGram.join(' '));
					} else {
						console.log('weird case', nGram);
					}
				}
			// account for single words
			} else if (tokens.length === 1) {
				nGrams.push(tokens[0]);
			}

			// hash tokens if configured
			if (encryptTokens) {
				nGrams = hashGrams(nGrams.toString());
			}

			return nGrams;
		}

		// combination of ngrams
		if (numberOfGrams === 0){
			var unigrams = inputTokens,
				bigrams = makeGrams(inputTokens, 2),
				trigrams = makeGrams(inputTokens, 3);

				return ['@total'].concat(unigrams, bigrams, trigrams);
		// unigram
		} else if (numberOfGrams === 1){
			return ['@total'].concat(inputTokens);
		
		// multigram
		} else {
			return ['@total'].concat(makeGrams(inputTokens, numberOfGrams));
		}
	}
});