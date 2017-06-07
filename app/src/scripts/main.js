/** 
	fastclass
	MAIN SCRIPT (init, routing & control flow)
	(c) 2017 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

require.config({
	baseUrl: 'scripts', // all app modules are in this directory
	paths: {
		// fastclass core configuration
		'core': '../../../core/src', 
		'conf': '../../../core/src/configs',
		'model': '../../../core/src/model/model',
		// D3.js modules
		'd3': '../vendor/d3', 
		'pie': '../vendor/d3pie', 
		'mg': '../vendor/metricsgraphics',
		// PDF.js modules 
		'pdfjs-dist/build/pdf': '../vendor/pdf', 
		'pdfjs-dist/build/pdf.worker': '../vendor/pdf.worker',
		// JSZIP module
		'zip': '../vendor/jszip',
		// Selectize & jQuery
		'selectize': '../vendor/selectize', 
		'jquery': '../vendor/jquery',
		'sifter': '../vendor/sifter',
		'microplugin': '../vendor/microplugin',
		// localforage
		'localforage': '../vendor/localforage' 
	}
});

require([ // main dependencies
		'config/config', 'model',
		'helper/util', 'helper/l10n',
		'view/ui','view/bind',
		'controller/file','controller/work',
		'controller/store','controller/local'
		], 
	function (cfg, Model, util, l, ui, bind, file, work, store, local) {

	// initialize local storage
	local.init();

	// Check browser compatibility 
	if (!util.browserHasFunctionality()) {
		ui.showModal(l('browser_support') + l('browser_alternatives'), 
			l('modal_title_note'));
	}

	var routes = ['start', 'training', 'classify'];

	function route () {
		var target = util.stripURL(window.location.hash);
		if (routes.includes(target)) {
			ui.showPanel(target);
		} else {
			ui.showModal(l('routing_site_404') + ': <b>"' + target + '"</b>', 
				l('modal_title_oops'));
		}
	}

	// Routing at location change
	window.addEventListener('hashchange', function () {
		route(); // take routing information from hash
	});

	// Routing at startup
	if (window.location.hash !== '' && window.location.hash !== '#') {
		route(); // only route when something is in hash
	}

	// Fix default behavior in navbar
	document.querySelectorAll('.dropdown-toggle, .no-link').forEach(function (elem) {
		elem.addEventListener('click', function (e) {
			e.preventDefault();
		});
	});

	// Default Bindings
	ui.click(['modal-ok', 'modal-x'], ui.closeModal);
	ui.click('logo', function() { 
		window.location.hash = ''; 
		window.location.reload(); 
	});

	// Bind model name
	ui.bind('model-name', 'input', function() {
		store.model.meta.modelName = ui.e('model-name').innerText;
	});

	// Training
	ui.change('userinput', function () {
		ui.hide(['disclaimer', 'prepareTrainingData']);
		ui.show('import', 'inline-block');
		
		file.readFromInput(ui.e('userinput'));
	});

	ui.click('import_xml', function () {
		file.parseXML(bind.getXMLoptions());
		work.trainModel('xml');
	});

	ui.click('import_json', function () {
		work.trainModel('json');
	});

	// Classification
	ui.change('userinput_cl', function () {
		ui.hide(['import_demo', 'disclaimer_cl', 'prepareClassificationData']);
		ui.show('classify', 'inline');
		
		file.readFromInput(ui.e('userinput_cl'), 'classify');
	});

	ui.click('import_xml_cl', function () {
		file.parseXML(bind.getXMLoptions('classify'), 'classify');
		work.classifyUserInput('xml');
	});

	ui.click('import_json_cl', function () {
		work.classifyUserInput('json');
	});

	ui.click('import_pdf_cl', function () {
		work.classifyUserInput('pdf');
	});

	// Add data (show file input again)
	ui.click('add_data', function () {
		bind.addFile();
	});

	ui.click('load_model', function () {
		bind.showLoadModal(local.getModels());
		ui.loading('load_model');

		var nextView = window.location.hash.slice(1) || 'training';

		ui.click('load_localModel', function() {
			local.loadModel(ui.e('localModel').value)
		  .then(function(data){
				store.model = data;
				bind.clearModel();
				bind.printTrainingAnalysis(store.model.meta);
				ui.hide('prepareTrainingData');
				bind.closeModalAndContinue('load-modal', nextView, ['load_localModel']);
			});
		});

		ui.click('load_fileModel', function() {
			bind.clearModel();
			file.readFromInput(ui.e('fileModel'));
			ui.hide('prepareTrainingData');
			bind.closeModalAndContinue('load-modal', nextView, ['load_fileModel']);
		});
	});

	// New model
	ui.click('new_model', function () {
		ui.loading('new_model');	
		bind.showNewModal();

		ui.click('new-modal-continue', function (){
			bind.clearModel();
			// reset and set default name
			store.model = util.copyObject(store.modelTemplate);
			ui.e('model-name').innerText = l('model_noname');
			// redirect to training
			ui.e('new-modal').classList.remove('active');
			window.location.hash = 'training';
		});
	});

	// Clear data
	ui.click('clear_data', function () {
		local.clear().then(function (){
			ui.loading('clear_data');
		});
	});

	// Save model
	ui.click('save_fcm', function () {
		work.exportMemory();
	});

	ui.click('save_locally', function () {
		local.storeModel(store.model)
		  .then(function(){
			ui.loading('save_locally', false);
		}).catch(function(err){
			ui.showModal(l('local_save_error') + err);
		});
	});

	// Export results
	ui.click('export_results', function () {
		work.exportResults(true);
	});

	ui.click('export_wa', function () {
		work.exportAnnotations();
	});

	ui.click('save_source', function () {
		work.exportSource();
	});

	/*
		ONLY FOR DEMO PURPOSES
		NO PRODUCTION CODE BELOW
	*/


	// training data
	ui.click(['demo', 'load_demo'], function () {
		ui.hide('prepareTrainingData');
		
		var fcmDemo = cfg.demoFiles.fcm[util.getLocale()];

		// get demo model from server
		fetch(fcmDemo).then(function(response) {
			if(response.ok) {
				response.blob().then(function(dataBlob) {
					file.loadFCM(dataBlob, 'demo');
					ui.loading(['demo', 'load_demo'], false);
				});
			} else {
				ui.showModal(l('demo_load_fcm'));
			}
		});
	});

	// get demo pdf data analysis
	ui.click('import_demo', function () {
		ui.hide(['prepareClassificationData', 'panel_classify_warning']);

		var pdfDemo = cfg.demoFiles.pdf[util.getLocale()];

		// get demo pdf data from server
		fetch(pdfDemo).then(function (response) {
			if(response.ok) {
				response.json().then(function(pdfMeta) {
					window.location.hash = 'classify';

					store.classifiedData = pdfMeta.arr;
					store.classifiedFileSources = ['DemoManual'];
					store.classifiedFileCurrentType = 'pdf';
					store.model.meta.modelID = '53f0e50c-7cac-4550-8198-537d70e1e7d9';
					
					bind.printClassificationAnalysis(pdfMeta, 'pdf');
					
					ui.loading('import_demo', false);
					ui.content({
						'clModelName': 'iiRDS training data',
						'classifiedFile': 'Demo Manual (Type: PDF)'
					});

				});
			} else {
				ui.showModal(l('demo_load_pdf'));
			}
		});
	});

});