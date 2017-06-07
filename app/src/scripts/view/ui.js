/** 
	fastclass 
	UI MODULE
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define(['helper/l10n', 'helper/util'], function (l, util) {
	var ui = {
		e: function (id) {
			return document.getElementById(id);
		},

		q: function (query) {
			var nodelist = document.querySelectorAll(query);
			return Array.prototype.slice.call(nodelist);
		},

		qA: function (query) {
			return document.querySelectorAll(query);
		},

		show: function (id, type) {
			if (Array.isArray(id)) {
				id.forEach( function (e) {
					ui.show(e, type);
				});
			} else {
				if (ui.e(id).style.display === 'none') {
					ui.e(id).style.display = type || 'block';
				}
			}
		},

		hide: function (id) {
			if (Array.isArray(id)) {
				id.forEach( function (e) {
					ui.hide(e);
				});
			} else {
				var e = ui.e(id);
				if (e && ui.e(id).style.display !== 'none') {
					ui.e(id).style.display = 'none';
				}
			}
		},

		loading: function (id, mode) {
			if (Array.isArray(id)) {
				id.forEach( function (e) {
					ui.loading(e, mode);
				});
			} else if (id) {
				if (mode === undefined) ui.e(id).classList.toggle('loading');
				if (mode === true) 		ui.e(id).classList.add('loading');
				if (mode === false) 	ui.e(id).classList.remove('loading');
			}
		},

		content: function (id, content) {
			if (id === Object(id)) {
				for (var eid in id) {
					ui.content(eid, id[eid]);
				}
			} else {
				ui.e(id).innerHTML = content;
			}
		},

		empty: function (id) {
			if (Array.isArray(id)) {
				id.forEach( function (e) {
					ui.empty(e);
				});
			} else {
				var elem = ui.e(id);
				if (elem.firstChild) {
					while (elem.firstChild) {
						elem.removeChild(elem.firstChild);
					}
				}
			}
		},

		bind: function (id, event, callback) {
			if (ui.e(id)) {
				ui.e(id).addEventListener(event, callback);
			}
		},	

		click: function (id, callback) {
			if (Array.isArray(id)) {
				id.forEach( function (e) {
					ui.click(e, callback);
				});
			} else {
				ui.bind(id, 'click', function (e) {
					ui.loading(id);
					callback(e);
				});
			}
		},

		change: function (id, callback) {
			ui.bind(id, 'change', callback);
		},

		showModal: function (content, title, modal) {
			var showTitle = title || l('modal_title_error');

			ui.content({
				'modal-title': showTitle,
				'modal-content': content
			});	

			ui.e('modal').classList.add('active');
		},

		closeModal: function (modal) {
			ui.loading(['modal-ok', 'modal-x'], false);

			ui.e('modal').classList.remove('active');
		},

		unlockPanels: function () {
			ui.hide(['panel_quality_warning', 'panel_classify_warning', 'panel_authoring_warning']);
			ui.show('classificationData');

			ui.q('.dropdown .disabled').forEach(function (nav) {
				nav.classList.remove('disabled');
			});
		},

		showPanel: function (newActive) {
			ui.q('section').forEach(function (panel) {
				ui.hide(panel.id);
			});

			if (newActive) {
				ui.show('panel_' + newActive);
			}
		}
	};

	// fix scoping
	return ui;
});