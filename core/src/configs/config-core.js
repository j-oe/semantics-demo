/** 
	fastclass
	CORE CONFIGURATION
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define({
	/*
		core configuration
	*/
	// how many tokens per group? 1 for stemmend tokens, 2 for bigrams, 3 for trigrams, 0 for combination of all, default: 0
	nrOfNgrams: 2,
	// which method of similarity calculation? 'l1' or 'cosine'
	similarityCalc: 'cosine',
	// should tokens be encrypted? boolean, default: false
	encryptTokens: false,
	// which weight has one standard token group? float, default: 1
	tokenWeighting: 1,
	//are signals enabeld? boolean, default: true
	signalsEnabled: true,
	// which weight has one signal token group? float, default. 2.5
	signalWeighting: 2.5,
	// which minimun number of tokens a module has to have to be included in the memory? integer, default: 0
	minNrOfTokens: 0,
	// which minimun length a token has to have to be included in the memory? integer, default: 0
	minLengthOfTokens: 0
});