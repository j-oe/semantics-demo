/** 
	fastclass
	LOCAL BROWSER STORAGE 
	- native localStorage for indexing 
	- localforage for IndexedDB API
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define(['localforage'], function (localforage) {

	var local = {
		
		key: 'fc_model_index',

		init: function () {
			var index = localStorage.getItem(local.key);
			if (index === null) {
				localStorage.setItem(local.key, '[]');
			}

			localforage.config({
				name: 'fastclass'
			});
		},

		clear: function () {
			localStorage.clear();
			return localforage.clear();
		},

		getModels: function () {
			return local._getIndex(); 
		},

		storeModel: function (model) {
			var mID = model.meta.modelID,
				mName = model.meta.modelName;

			local._addModelToIndex(mID, mName);
			return localforage.setItem(mID, model);
		},
		
		loadModel: function (modelID) {
			return localforage.getItem(modelID);
		},

		deleteModel: function (modelID) {
			local._removeModelFromIndex(modelID);
			return localforage.removeItem(modelID);
		},

		_getIndex: function (index) {
			return JSON.parse(localStorage.getItem(local.key));
		},

		_updateIndex: function (index) {
			localStorage.setItem(local.key, JSON.stringify(index));
		},

		_addModelToIndex: function (id, name) {
			var index = local._getIndex();
			index.push({id: id, name: name});
			local._updateIndex(index);
		},

		_removeModelFromIndex: function (id) {
			var index = local._getIndex(),
				pos = index.map(function(e) { return e.id; }).indexOf(id);
			index.splice(pos, 1);	
			local._updateIndex(index);
		}
	};

	// fix scoping
	return local;
});