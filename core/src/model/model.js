/** 
	fastclass
	CORE MODEL
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT
	
*/


define({
	
	/* 
		Model definition - v0.2
		a fastclass model, is a javascript object (or JSON object)
		which contains a the trained model for classification. In
		its minimal form it only contains matrix data (calcluated
		values) and some meta information. If a model should be 
		extendabel it has to have a configuration and object data
		included.
	*/

	model: {
		conf: {},
		meta: {
			modelVersion: '0.2'
		},
		data: {
			matrix: [],
			object: {}
		}
	},

	/* 
		Model methods
		the following methods can be used as shortcuts to important
		properties of the model.
	*/

	isAvailable: function () {
		if (this.model.data.matrix && this.model.data.matrix.length > 0) {
			return true;
		} else {
			return false;
		}
	},

	isExtendable: function () {
		if (this.hasObject() && this.hasConfig()) {
			return true;
		} else {
			return false;
		}
	},

	hasObject: function () {
		if (this.model.data.object && this.model.data.object['@cls'] > 0) {
			return true;
		} else {
			return false;
		}
	},

	hasConfig: function () {
		if (this.model.conf && Object.keys(this.model.conf).length > 0) {
			return true;
		} else {
			return false;
		}
	},

	getName: function () {
		if (this.isAvailable()) {
			if (this.model.meta.modelName && this.model.meta.modelName !== ''){
				return this.model.meta.modelName;
			} else {
				return 'Unnamed model';
			}
		} else {
			return 'No model available';
		}
	}
});
	