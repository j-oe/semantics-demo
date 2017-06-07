/** 
	fastclass
	L10N MODULE (localization)
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

var defaultLocale = 'de',	
	userLocale = document.documentElement.lang || defaultLocale;

define(['../../res/lang/' + userLocale], function (lang) {

	var localizer =  function (key) {
		if (lang.hasOwnProperty(key)) {
			return lang[key];
		} else {			
			console.log('Missing l10n key: ', key);
			return 'MISSING STRING DEFINITION';
		}
	};

	return localizer;
});