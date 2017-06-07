/** 
	fastclass 
	BIND MODULE
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define(['view/ui', 'config/config', 'controller/store', 'helper/util'], function (ui, cfg, store, util) {
	var bind = {

		addFile: function() {
			ui.loading('add_data', false);
			
			ui.e('userinput').value = null;
			ui.hide(['disclaimer', 'import_xml', 'import_json','load_fcm']);

			bind.resetXMLoptions();

			ui.show('importFile');
		},

		getIndicator: function (value, property) {
			var indication = 'neutral';

			if (cfg.indicators) {
				var indicatorType = cfg.indicatorValues[property].type,
					indicatorValue = cfg.indicatorValues[property].values;

				if (indicatorType === 'range') {
					if (value <= indicatorValue[0]) indication = 'bad';
					if (value > indicatorValue[0] && value < indicatorValue[1]) indication = 'good';
					if (value > indicatorValue[1] && value < indicatorValue[2]) indication = 'medium';
					if (value > indicatorValue[2]) indication = 'bad';
				}

				if (indicatorType === 'scale') {
					if (value <= indicatorValue[0]) indication = 'bad';
					if (value > indicatorValue[0]) indication = 'medium';
					if (value > indicatorValue[1]) indication = 'good';
				}
			}

			return '<span class="indicator indicator-' + indication + '"></span>';
		},

		setClassificationProgress: function (progress, elem_prog, elem_bar) {
			var el_bar = elem_bar || 'status_cl_bar',
				el_prog = elem_prog || 'status_cl';
			
			ui.show(el_bar, 'inline-block');

			ui.e(el_prog).style = 'width:' + progress;
			ui.e(el_prog)['data-tooltip'] = progress;
			/*ui.e(el_prog).innerHTML = progress;*/
		},

		showNewModal: function (models) {
			ui.e('new-modal').classList.add('active');

			ui.click(['new-modal-x', 'new-modal-overlay', 'new-modal-cancel'], function (e){
				ui.loading(e.target.id, false);
				ui.e('new-modal').classList.remove('active');
			});
		},

		showLoadModal: function (models) {
			// init load modal
			ui.e('load-modal').classList.add('active');
			ui.show('no-local-models');
			ui.hide('load_localModel');

			ui.click(['load-modal-x', 'load-modal-overlay'], function (e){
				ui.loading(e.target.id, false);
				ui.e('load-modal').classList.remove('active');
			});

			// get default panel
			if (models && models.length > 0) {
				bind.showLocalModels(models);
				refreshModal('from-browser');
			} else {
				refreshModal('from-filesystem');
			}	

			// render tabs and panels
			ui.q('#load-modal .tab-item').forEach(function (elem) {
				elem.addEventListener('click', function (e) {
					e.preventDefault();
					refreshModal(e.target.id);
				});
			});

			function refreshModal (activeTabID) {
				ui.q('#load-modal .tab-item a').forEach( function (tab) {
					tab.classList.remove('active');
					ui.hide('load-' + tab.id);
				});

				ui.e(activeTabID).classList.add('active');
				ui.show('load-' + activeTabID, 'flex');
			}		
		},

		showLocalModels: function (models) {
			ui.hide('no-local-models');
			ui.show('load_localModel');
			// lazy requiring dependecy-heavy selectitze plugin
			util.requireCSS('vendor/selectize.css');
			require(['selectize'], function (selectize) {

				function toDataObj (dataArray) {
					return dataArray.map(function (item) {
						return {text: item.name, value: item.id};
					});
				}

				$('#localModel').selectize({
					options: toDataObj(models),
					selectOnTab: true
				});
			});
		},

		closeModalAndContinue: function (modal, nextView, unload) {
			// stop loading animation on buttons
			if (unload) ui.loading(unload, false);
			// close modal 
			ui.e(modal).classList.remove('active');
			// move on
			if (nextView) {
				window.location.hash = nextView;
				if (nextView === 'training') {
					ui.unlockPanels();
				}
			}
		},

		fillWithDemoData: function (metaData, example) {
			// training
			window.location.hash = 'training';
			bind.printTrainingAnalysis(metaData);
			ui.hide(['importFile', 'save_source']);
			// classification (PDF)
			ui.hide(['prepareClassificationData', 'downloadResults', 'userinput_cl', 'disclaimer_cl']);
			ui.show('disclaimer_demo');
			// get data for PDF visualizations
			ui.show('import_demo');
			ui.hide('')
		},

		printTrainingAnalysis: function (data) {
			ui.show(['manageModel', 'trainingAnalysis']);
			ui.hide(['importFile', 'xmlAnalysis']);

			var timeInSec = Math.round(data.trainingDuration / 10) / 100;

			if (store.model.meta.modelName) ui.e('model-name').innerText = store.model.meta.modelName;

			bind.clearTrainingAnalysis();

			ui.content({
				'tA_cnt': data.analyzedObjects + bind.getIndicator(data.analyzedObjects, 'nrOfObjects'),
				'tA_cls': data.analyzedClasses + bind.getIndicator(data.analyzedClasses, 'nrOfClasses'),
				'tA_avg': data.averageWordCount + bind.getIndicator(data.averageWordCount, 'sizeOfObjects'),
				'tA_tme': timeInSec + 's' + bind.getIndicator(timeInSec, 'timeElapsed')
			});

			// lazy requiring plot module
			require(['view/plot'], function (plot) {
				plot.pieChartClassDistribution('tA_plot', data.classDistribution);
			});
		},

		clearModel: function () {
			ui.hide(['trainingAnalysis', 'xmlAnalysis']);
			ui.show(['importFile', 'manageModel']);
			bind.clearTrainingAnalysis();
			ui.e('userinput').value = null;
		},

		clearTrainingAnalysis: function () {
			ui.content({
				'tA_cnt': '?',
				'tA_cls': '?',
				'tA_avg': '?',
				'tA_tme': '?'
			});
		
			ui.empty('tA_plot');
		},

		printReportAnalysis: function (data) {
			ui.show(['reportAnalysis']);
			ui.hide(['importFile_rp', 'xmlAnalysis_rp']);

			var timeInSec = Math.round(data.tme / 10) / 100;

			ui.content({
				'rA_idf': data.idf.length,
				'rA_tme': timeInSec + 's'
			});

			// lazy requiring plot module
			require(['view/plot'], function (plot) {
				plot.histogramSimDist('rA_histogramChart', data.arr);
				plot.forceDirectedGraph('rA_graph', data.map);
			});
		},

		printClassificationAnalysis: function (data, source) {
			ui.show(['manageClassification', 'classificationAnalysis']);
			ui.hide('classificationData');

			ui.content({
				'clModelName': store.model.meta.modelName,
				'classifiedFile': store.classifiedFileSources.join(', ') + 
					'  (Typ: ' + source.toUpperCase() + ')'
			});

			var timeInSec = Math.round(data.tme / 10) / 100;

			ui.content({
				'cA_cnt':  data.cnt,
				'cA_tme':  timeInSec + 's',
				'cA_cls':  data.dis.length,
				'cAM_cls': store.model.meta.analyzedClasses
			});

			// lazy requiring plot module
			require(['view/plot'], function (plot) {
				ui.empty(['cA_plot', 'cA_histogramChart']);
				
				plot.pieChartClassDistribution('cA_plot', data.dis);
				plot.histogramConfDist('cA_histogramChart', data.arr);

				if (source === 'pdf') {
					ui.show(['classDistributionAnalysis', 'confidenceAnalysis']);

					plot.scatterPlotClassDist('cA_scatterPlot', data.arr);
					plot.lineChartConfidenceTrans('cA_lineChart', data.arr);
				}
			});			
		},

		printClassificationAnalysisText: function (data) {
			ui.show('classificationAnalysisText');

			var timeInSec = Math.round(data.time / 10) / 100;

			ui.content({
				'cAT_clf': data.pred,
				'cAT_cfd': data.conf + '%',
				'cAT_tme': timeInSec + 's'
			});
			
			// lazy requiring plot module
			require(['view/plot'], function (plot) {
				ui.empty('cAT_plot');
				plot.barChartClassScores('cAT_plot', data.info);
			});
				
		},

		prepareQualityAnalysis: function (options) {
			ui.show('qsAnalysis', 'flex');
			if (options[0]) { // svl
				ui.show('tA_svl_panel', 'flex');
			}
			if (options[1]) { // cvl
				ui.show('tA_cvl_panel', 'flex');
			}
			ui.loading('qs');
		},

		printQualityScore: function (label, score) {
			ui.content('tA_' + label, score + '%');				
					
			// lazy requiring plot module
			require(['view/plot'], function (plot) {
				ui.empty('tA_' + label +'_g');
				plot.pieChartGauge('tA_' + label +'_g', score);
			});
		},

		resetXMLoptions: function (classify) {
			var suffix = (classify) ? '_cl' : '';

			// lazy requiring dependecy-heavy selectitze plugin
			util.requireCSS('vendor/selectize.css');
			require(['selectize'], function (selectize) {
				var selectAttrInstance = $('#xmlAttr' + suffix).selectize();
					selectElemInstance = $('#xmlElem' + suffix).selectize();

				if (selectAttrInstance && selectElemInstance) {
					selectAttrInstance[0].selectize.clearOptions();
					selectElemInstance[0].selectize.clearOptions();
				}
			});
		},

		printXMLoptions: function (xmlMap, target) {
			var suffix = '';
			if (target === 'classify') suffix = '_cl';
			if (target === 'report') suffix = '_rp';

			var sortedElements = Object.keys(xmlMap).sort();
			
			// lazy requiring dependecy-heavy selectitze plugin
			util.requireCSS('vendor/selectize.css');
			require(['selectize'], function (selectize) {

				ui.show('xmlAnalysis' + suffix);

				if (!target) {
					ui.show('showSignalSelection');

					ui.click('showSignalSelection', function() {
						$('#signalSelection').toggle();
					});

					$('#xmlElemSignal').selectize({
						options: toDataObj(sortedElements)
					});
				}
				
				$('#xmlAttr' + suffix).selectize({
					options: [],
					onChange: function (val) {
						if (val !== '') {
							ui.show('import_xml' + suffix);
						} else {
							ui.hide('import_xml' + suffix);
						}
					}
				});

				$('#xmlElem' + suffix).selectize({
					options: toDataObj(sortedElements),
					selectOnTab: true,
					onChange: function () {
						updateAttributes();
					}
				});

				function toDataObj (dataArray) {
					return dataArray.map(function (item) {
						return {text: item, value: item};
					});
				}

				function getValidAttributes () {
					var selectedElements = [],
						validAttributes = [];

					ui.q('#xmlElem' + suffix +' option:checked').forEach(function (item) {
						selectedElements.push(item.value);
					});

					for (var i = 0; i < selectedElements.length; i++) {
						/* jshint loopfunc: true */
						var currentElement = selectedElements[i],
							elementAttrs = Object.keys(xmlMap[currentElement]);
						// if more than one element, find intersection between attributes
						if (i > 0) {
							validAttributes = validAttributes.filter(function (n) {
							    return elementAttrs.includes(n);
							});
						} else {
							validAttributes = validAttributes.concat(elementAttrs);
						} 
					}

					return toDataObj(validAttributes.sort());				
				}

				function updateAttributes () {
					var	validAttributes = getValidAttributes(),
						selectInstance = $('#xmlAttr' + suffix).selectize();

					selectInstance[0].selectize.clearOptions();
					selectInstance[0].selectize.addOption(validAttributes);
					selectInstance[0].selectize.refreshOptions();
				}
			});
		},

		getXMLoptions: function (target) {
			var suffix = '';
			if (target === 'classify') suffix = '_cl';
			if (target === 'report') suffix = '_rp';

			var selectOption = ui.e('xmlAttr' + suffix).value,
				selectElements = [], signalElements = [];

			ui.q('#xmlElem' + suffix + ' option:checked').forEach(function (entry) {
				selectElements.push(entry.value);
			});	

			if (!target) {
				ui.q('#xmlElemSignal option:checked').forEach(function (entry) {
					signalElements.push(entry.value);
				});
			}

			return [selectElements, selectOption, signalElements];
		},

		getQSoptions: function () {
			var svl_Checked = ui.e('tA_svl_mode').checked,
				cvl_Checked = ui.e('tA_cvl_mode').checked;

			return [svl_Checked, cvl_Checked];
		},

		getTextFromUserInput: function () {
			var textInput = ui.e('textinput').value,
				sanitizedInput = textInput.replace(/(\r?\n)+|(\r)+/g, ' ');
			return sanitizedInput;
		}
	};

	// fix scoping
	return bind;
});