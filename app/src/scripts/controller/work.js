/** 
	fastclass
	WORK MODULE (worker handling)
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/


define(['view/ui', 'view/bind', 'controller/store', 'helper/util', 'helper/l10n', 'config/config'], 
	function (ui, bind, store, util, l, cfg) {

	var work = {

		processPDF: function (pdfObject) {
			var pdfWorker = new Worker(cfg.fcWorkerURL);

			pdfWorker.addEventListener('error', function (err) {
				ui.showModal(l('work_proc_pdf'));
			});

			pdfWorker.addEventListener('message', function (msg) {
				if (msg.data.ready) {
					pdfWorker.postMessage(['chunkPDF', 
						pdfObject, store.model.meta.averageWordCount]);
				} else {
					store.inputDataCl = msg.data;

					// remove PDF array buffer after processing
					store.pdfArrayBuffer = null;

					ui.loading('import_pdf_cl');

					pdfWorker.terminate();
				}				
			});
		},

		getSimilarityReport: function (source) {
			if (store.inputDataRp && store.inputDataRp.length !== 0) {
				var simWorker = new Worker(cfg.smWorkerURL);

				simWorker.addEventListener('error', function (err) {
					ui.showModal(l('work_proc_dupes'));
				});

				simWorker.addEventListener('message', function (msg) {
					if (msg.data.ready) {
						simWorker.postMessage(['findSimilar', store.inputDataRp]);
					} else {

						console.log(msg.data[2]);

						store.repSimilarModules = msg.data[0];
						store.repSimilarModulesMap = msg.data[2];
						/*store.repDuplicateModules = msg.data[0][1];*/

						// all similarities and duplicates
						var allSimAndDup = msg.data[0],
							similarityDistribution = allSimAndDup.map(function(i) {
								return i[0];
						});

						bind.printReportAnalysis({
							arr: similarityDistribution,
							map: msg.data[2],
							tme: msg.data[1],
							idf: allSimAndDup
						});

						ui.loading('import_' + source + '_rp');

						simWorker.terminate();
					}				
				});
			} else {
				ui.showModal(l('work_no_userdata'));
				ui.loading('import_' + source + '_rp');
			}
		},

		trainModel: function (source) {
			if (store.inputData && store.inputData.length !== 0) {
				var inputWorker = new Worker(cfg.fcWorkerURL),
					startTime = util.getTime();

				inputWorker.addEventListener('error', function (err) {
					ui.showModal(l('work_proc_userdata'));
				});

				inputWorker.addEventListener('message', function (msg) {
					if (msg.data.ready) {
						inputWorker.postMessage(['trainFromScratch', 
							store.inputData, store.model.data.object]);
					} else {
						processResults(msg.data, inputWorker);
					}
				});				
			} else {
				ui.showModal(l('work_no_userdata'));
				ui.loading('import_' + source);
			}

			function processResults (data, worker) {
				store.model.data.matrix = data[0];
				store.model.data.object = data[1];
				
				store.model.meta.analyzedFiles	   = store.model.meta.analyzedFiles + 1 || 1;
				store.model.meta.analyzedObjects   = data[1]['@cnt'];
				store.model.meta.analyzedClasses   = data[1]['@cls'];
				store.model.meta.averageWordCount  = data[1]['@avg'];
				store.model.meta.trainingDuration  = util.getTime() - startTime;
				store.model.meta.classDistribution = util.getClassDistribution(store.model.data.object);

				ui.loading('import_' + source);
				bind.printTrainingAnalysis(store.model.meta);
				ui.unlockPanels();

				worker.terminate();
			}		
		},

		classifyUserInput: function (source) {
			if (store.inputDataCl && store.inputDataCl.length !== 0) {
				var clfWorker = new Worker(cfg.fcWorkerURL);

				clfWorker.addEventListener('error', function (err) {
					ui.showModal(l('work_class_userdata'));
				});

				clfWorker.addEventListener('message', function (msg) {
					if (msg.data.ready) {
						clfWorker.postMessage(['classifyMultiple', 
							store.inputDataCl, store.model.data.matrix]);
					} else if (msg.data[0] === 'result') {
						store.classifiedData = msg.data[1][0];
						
						var overThreshold = 0,
							timingInformation = msg.data[1][1];

						store.classifiedData.forEach(function(i){
							if (i.cfd >= cfg.confidenceThreshold) overThreshold++;
						});

						bind.printClassificationAnalysis({
							cnt: store.classifiedData.length,
							tme: timingInformation,
							cfd: overThreshold,
							dis: util.getClassDistribution(store.classifiedData),
							arr: store.classifiedData
						}, source);

						ui.hide('status_cl');
						ui.loading('import_' + source + '_cl');

						clfWorker.terminate();
					} else if (msg.data[0] === 'status') {
						var currentObjectIndex = msg.data[1][0],
							totalNrOfObjects = msg.data[1][1];

						bind.setClassificationProgress(util.percent(currentObjectIndex, totalNrOfObjects));				
					}
					
				});

				
			} else {
				ui.showModal(l('work_no_classdata'));
				ui.loading('import_' + source + '_cl');
			}				
		},

		getQualityScores: function (options) {
			var getSVL = options[0],
				getCVL = options[1];
			
			// if already calculated, then get from metadata
			if (store.model.meta.qsQuality && store.model.meta.qsForecast) {
				bind.prepareQualityAnalysis(options);
				bind.printQualityScore('svl', store.model.meta.qsQuality);
				bind.printQualityScore('cvl', store.model.meta.qsForecast);
				ui.loading('qs', false);

			// if not in metadata, calculate scores
			} else {
				if (store.model.data.matrix && store.model.data.matrix.length !== 0) {

					bind.prepareQualityAnalysis(options);

					// SVL :: SelfVaLidation (quality score)
					if (getSVL) {
						var svlWorker = new Worker(cfg.fcWorkerURL);

						svlWorker.addEventListener('error', function (err) {
							ui.showModal(l('quality_score_svl'));
						});

						svlWorker.addEventListener('message', function (msg) {
							if (msg.data.ready) {
								svlWorker.postMessage(['selfValidate', 
									store.inputData, store.model.data.matrix]);
							} else {
								var svlScore = msg.data[0];

								if (msg && svlScore > 0) {
									store.model.meta.qsQuality  = msg.data[0];
									store.repProblematicModules = msg.data[1];

									bind.printQualityScore('svl', svlScore);
									ui.show('downloadQSreport');
								} else {
									ui.showModal(l('quality_score_svl'));
								}

								svlWorker.terminate();
							}
						});
					}

					// CVL :: CrosssVaLidation (quality score)
					if (getCVL) {
						var cvlWorker = new Worker(cfg.fcWorkerURL);

						cvlWorker.addEventListener('error', function (err) {
							ui.showModal(l('quality_score_cvl'));
						});

						cvlWorker.addEventListener('message', function (msg) {
							if (msg.data.ready) {
								cvlWorker.postMessage(['crossValidate', 
									store.inputData]);
							} else {
								var cvlScore = msg.data[0];

								if (msg && cvlScore > 0) {
									store.model.meta.qsForecast     = msg.data[0];
									store.model.meta.qsCvlScores    = msg.data[1];
									store.model.meta.qsCvlDeviation = msg.data[2];

									bind.printQualityScore('cvl', cvlScore);
								} else {
									ui.showModal(l('quality_score_cvl'));
								}

								cvlWorker.terminate();
							}
						});
					}
				} else {
					ui.showModal(l('routing_model'));
					ui.loading('qs', false);
				}
			}
		},

		classifyTextInput: function (textInput) {
			if (store.model.data.matrix && Object.keys(store.model.data.matrix).length !== 0) {
				if (textInput && textInput !== '') {
					if (textInput.split(/\s+/).length >= 3) {
						var textWorker = new Worker(cfg.fcWorkerURL);

						textWorker.addEventListener('error', function (err) {
							ui.showModal(l('authoring_error'));
						});

						textWorker.addEventListener('message', function (msg) {
							if (msg.data.ready) {
								textWorker.postMessage(['classifyText', 
									textInput, store.model.data.matrix]);
							} else {
								ui.loading('classify_textinput');
								bind.printClassificationAnalysisText(msg.data);
								
								textWorker.terminate();
							}
						});
					} else {
						ui.showModal(l('authoring_text_min'));
						ui.loading('classify_textinput');
					}
				} else {
					ui.showModal(l('authoring_no_text'));
					ui.loading('classify_textinput');
				}
			} else {
				ui.showModal(l('routing_model'));
				ui.loading('classify_textinput');
			} 
		},

		exportSource: function () {
			if (store.inputData) {
				util.downloadFile(store.inputData, 'fastclass_source' + Date.now() + '.json');
				ui.loading('save_source');
			}
		},

		exportMemory: function () {
			if (store.model.data.matrix && Object.keys(store.model.data.matrix).length !== 0) {
				// build ZIP-based FCM format
				require(['zip', 'conf/config-core'], function (JSZip, coreconfig) {
					var zip = new JSZip();

					store.model.conf = coreconfig;
				
					zip.folder('fastclass')
						.file("model.json", JSON.stringify(store.model));

					zip.generateAsync({
						type:'blob',
						compression: 'DEFLATE',
						compressionOptions : {
							// level between 1 (best speed) and 9 (best compression)
							level: 6 
						}
					}).then(function(content) {
					    util.downloadBlob(content, 
					    	util.createFileName(store.model.meta.modelName) + '.fcm');
					    ui.loading('save_fcm');
					});
				});
			} else {
				ui.showModal(l('work_no_model'));
				ui.loading('save_fcm');
			}
		},

		exportResults: function (stripText) {
			if (store.classifiedData && store.classifiedData.length !== 0) {
				var resultDownload = [].concat(store.classifiedData);
				
				if (stripText) {
					//resultDownload.forEach(function(i){ delete i.txt; });
					resultDownload.forEach(function(i){ i.txt = 'text redacted for demo'; });
				}

				util.downloadFile(resultDownload, 'fastclass_' + // TODO 
					Date.now() + '.json');
				ui.loading('export_results');
			} else {
				ui.showModal(l('work_no_classdata'));
				ui.loading('export_results');
			}
		},

		exportAnnotations: function () {
			var annoWorker = new Worker(cfg.waWorkerURL);

			annoWorker.addEventListener('error', function (err) {
				ui.showModal(l('work_proc_annos'));
			});

			annoWorker.addEventListener('message', function (msg) {
				if (msg.data.ready) {
					annoWorker.postMessage(['createAnnotations', 
						store.classifiedData, store.classifiedFileSources,
						store.classifiedFileCurrentType, store.model.meta.modelID]);
				} else {
					store.repAnnotations = msg.data;

					util.downloadFile(store.repAnnotations, 
						'fastclass_anno_' + Date.now() + '.json');
					ui.loading('export_wa');

					annoWorker.terminate();
				}				
			});
		},

		exportReport: function () {
			if (store.repProblematicModules && store.repProblematicModules.length !== 0) {
				var reportDownload = [].concat(store.repProblematicModules);
				reportDownload.forEach(function(i){ delete i.txt; });

				util.downloadFile(reportDownload, 'fastclass_problematicModules_' + 
					Date.now() + '.json');
			} else {
				ui.showModal(l('work_no_classdata'));
			}
		}
	};

	// fix scoping
	return work;
});