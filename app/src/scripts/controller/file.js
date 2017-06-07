/** 
	fastclass
	FILE MODULE (file handling)
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define(['helper/util', 'view/ui', 'view/bind', 'controller/work', 'controller/store', 'helper/l10n'], 
	function (util, ui, bind, work, store, l) {

	var file = {

		readFile: function (input, target) {
			if (input.files.length !== 0) {
				var fileInput = input.files[0],
					fileName = fileInput.name.toLowerCase(),
					fileType = fileName.substring(fileName.lastIndexOf('.') +1),
					cleanName = fileInput.name.substring(0,fileInput.name.lastIndexOf('.')),
					fileReader = new FileReader();

				fileReader.addEventListener('load', function () {
					file.parseInput(fileReader.result, fileType, target);
				});
				
				fileReader.addEventListener('error', function() {
					ui.showModal(l('file_format_support'));
				});

				// decide which file reading method should be used (text or buffer)
				if (fileType === 'json' || fileType === 'xml') {
					fileReader.readAsText(fileInput);
				} else if (fileType === 'fcm' || (fileType === 'pdf' && target === 'classify')) {
					fileReader.readAsArrayBuffer(fileInput);
				} else {
					ui.showModal(l('file_format_no_support'));
				}
			} else { 
				ui.showModal(l('file_no_file'));
			}
		},

		parseInput: function (input, type, target) {
			switch (type) {
				case 'json':
					file.parseJSON(input, target);
					break;

				case 'xml':
					file.analyzeXML(input, target);
					break;

				case 'pdf':
					file.preparePDF(input);
					break;
				
				default:
					ui.showModal(l('file_format_no_support'));
					break;
			}

			return type;
		},

		readFromInput: function (input, target) {
			if (input.files.length !== 0) {
				var fileInput = input.files[0],
					fileName = fileInput.name.toLowerCase(),
					fileType = fileName.substring(fileName.lastIndexOf('.') +1),
					cleanName = fileInput.name.substring(0,fileInput.name.lastIndexOf('.')),
					fileReader = new FileReader();

				// set model name & id
				if (!store.model.meta.modelID) {
					store.model.meta.modelName = cleanName;
					store.model.meta.modelID = util.getUUID();
					store.model.meta.modelCreated = util.getDateString();
					store.model.meta.modelCreator = 'fastclass Studio';
					store.model.meta.modelVersion = '0.2';
					ui.e('model-name').innerText = cleanName;
				}

				fileReader.addEventListener('load', function () {
					file.parseUserInput(fileReader.result, fileType, target);
				});
				
				fileReader.addEventListener('error', function() {
					ui.showModal(l('file_format_support'));
				});

				// cache source file name for later use when classifying
				if (target === 'classify') {
					store.classifiedFileCurrentType = fileType;
					store.classifiedFileSources.push(cleanName);
				}    

				// decide which file reading method should be used (text or buffer)
				if (fileType === 'json' || fileType === 'xml') {
					fileReader.readAsText(fileInput);
				} else if (fileType === 'fcm' || 
					(fileType === 'pdf' && target === 'classify')) {
					fileReader.readAsArrayBuffer(fileInput);
				} else {
					ui.showModal(l('file_format_no_support'));
				}
			} else { 
				ui.showModal(l('file_no_file'));
			}
		},

		parseUserInput: function (input, type, target) {
			// TODO clean up mess
			if (target === 'classify') {
				// classify JSON
				if (type === 'json') {
					file.parseJSON(input, target);
					ui.show('import_json_cl');
				// classify XML
				} else if (type === 'xml') {
					file.analyzeXML(input, target);
				// classify PDF
				} else if (type === 'pdf') {
					file.preparePDF(input);
					ui.show('import_pdf_cl');
					ui.loading('import_pdf_cl');
				} else {
					ui.showModal(l('file_format_no_support'));
				}
				ui.hide('classify');
			} else if (target === 'report') {
				// classify JSON
				if (type === 'json') {
					file.parseJSON(input, target);
					ui.show('import_json_rp');
				// classify XML
				} else if (type === 'xml') {
					file.analyzeXML(input, target);
				} else {
					ui.showModal(l('file_format_no_support'));
				}
				ui.hide('import_rp');
			} else {
				// loading native FCM model
				if (type === 'fcm') {
					ui.show('load_fcm');
					ui.loading('load_fcm');
					file.loadFCM(input, 'load_fcm');
				// train with JSON
				} else if (type === 'json') {
					file.parseJSON(input);
					ui.show('import_json');
				// train with XML
				} else if (type === 'xml') {
					file.analyzeXML(input);
				} else {
					ui.showModal(l('file_format_no_support'));
				}
				ui.hide('import');
			}
		},

		loadFCM: function(data, source) {
			
			function refreshUI () {
				// initialize Demo
				if (source === 'demo') {
					bind.fillWithDemoData(store.model.meta, l('demo_text_example'));
				} else {
					bind.printTrainingAnalysis(store.model.meta);
				}

				ui.loading(source);
				ui.unlockPanels();
			}

			// lazy loading ZIP module
			require(['zip'], function (JSZip) {
				JSZip.loadAsync(data).then(function(zip) {
					if (zip.files.hasOwnProperty('fastclass/model.json')) {

						zip.folder('fastclass')
							.file('model.json')
							.async('string')
							.then(function(data){
								store.model = JSON.parse(data);
								refreshUI();
							});
					} else {
						ui.showModal(l('file_fcm_error'));
					}					
      			});
			});
		},

		parseJSON: function (json, target) {
			try {
				var data = JSON.parse(json);
				if (Array.isArray(data) && data.length !== 0) {

					// JSON schema validation
					var validSchema = data.every(function(obj){
						if (target === 'classify'){
							return obj.hasOwnProperty('xid') && 
								obj.hasOwnProperty('txt');
						} else {
							return obj.hasOwnProperty('clf') &&
 								obj.hasOwnProperty('txt');
						}
					});

					if (validSchema){   // all tests passed:
						if (target === 'classify'){
							store.inputDataCl = data;
						} else {
							store.inputData = data;
						}
					} else { 
						ui.showModal(l('file_json_format')); 
					}
				} else { 
					ui.showModal(l('file_json_empty')); 
				}
			} catch(error) {
				ui.showModal(l('file_json_valid') + '<br/>' + 
					l('modal_text_details') + ': ' + error);
			}
		},

		analyzeXML: function (xml, target) {
			var parser = new DOMParser();
				xmlDoc = parser.parseFromString(xml, "application/xml");

			// fixing Bug https://bugzilla.mozilla.org/show_bug.cgi?id=45566
			if (xmlDoc.documentElement.firstChild.localName === 'parsererror') {
				throw xmlDoc.documentElement.firstChild.innerHTML;
			}

			// store DOM of XML document for further use
			if (target === 'classify') {
				store.xmlDocumentsCl.push(xmlDoc);
			} else {
				store.xmlDocuments.push(xmlDoc);
			}

			// check if XML document is fastclass-XML
			if (xmlDoc.documentElement.getAttribute('fastclass') === '1.0') {
				ui.show(['import_xml', 'disclaimer']);
				ui.loading('import_xml');
				ui.content('disclaimer', 'fastclass XML v1.0');

				if (target === 'classify') {
					file.parseXML([['node'], 'fc-id', []], target);
					work.classifyUserInput('xml');
				} else {
					file.parseXML([['node'], 'fc-class', []], target);
					work.trainModel('xml');
				}
			// check if HTML document is fastclass-HTML
			} else if (xmlDoc.documentElement.getAttribute('data-fastclass') === '1.0') {
				ui.show(['import_xml', 'disclaimer']);
				ui.loading('import_xml');
				ui.content('disclaimer', 'fastclass HTML v1.0');

				if (target === 'classify') {
					file.parseXML([['node'], 'data-fc-id', []], target);
					work.classifyUserInput('xml');
				} else {
					file.parseXML([['node'], 'data-fc-class', []], target);
					work.trainModel('xml');
				}
			// analyze structure if unknown
			} else {
				var allElements = xmlDoc.getElementsByTagName('*'),
					uniqueElements = {},
					mapElements = {};

				for (var i = allElements.length - 1; i >= 0; i--) {
					var elementName = allElements.item(i).tagName;
					uniqueElements[elementName] = true;
				}

				for (var uniqueName in uniqueElements) {

					// when no namespace use just name
					var elemNamespace = '*',
						elemLocalName = uniqueName;

					// handle namespaced documents
					if (uniqueName.indexOf(':') !== -1) {
						var prefix = uniqueName.split(':')[0];

						elemNamespace = xmlDoc.lookupNamespaceURI(prefix);
						elemLocalName = uniqueName.split(':')[1];
					}

					var namedElements = xmlDoc.getElementsByTagNameNS(elemNamespace, elemLocalName),
						elementAtts = {};

					for (var j = namedElements.length - 1; j >= 0; j--) {
						var attributeNodes = namedElements.item(j).attributes;
						for (var k = attributeNodes.length - 1; k >= 0; k--) {
							elementAtts[attributeNodes.item(k).name] = true;
						}
					}

					mapElements[uniqueName] = elementAtts; 
				}

				store.xmlParsingOptions = mapElements;

				bind.printXMLoptions(mapElements, target);
			}			
		},

		parseXML: function (xmlOptions, target) {
			var xmlDocuments = (target === 'classify') ? store.xmlDocumentsCl : store.xmlDocuments;

			// loop through xml documents
			for (var d = 0; d < xmlDocuments.length; d++) {
				var xmlDoc = xmlDocuments[d];

				// XML options from user input
				var xmlElements = xmlOptions[0] || [],
					xmlAttribute = xmlOptions[1] || null,
					xmlSignals = xmlOptions[2] || [];

				// loop through module elements
				for (var e = xmlElements.length - 1; e >= 0; e--) {
					var currentElementName = xmlElements[e];

					// when no namespace use just name
					var elemNamespace = '*',
						elemLocalName = currentElementName;

					// handle namespaced documents
					if (currentElementName.indexOf(':') !== -1) {
						var prefix = currentElementName.split(':')[0];

						elemNamespace = xmlDoc.lookupNamespaceURI(prefix);
						elemLocalName = currentElementName.split(':')[1];
					}

					// look up elements with namespace if available
					var	modules = xmlDoc.getElementsByTagNameNS(elemNamespace, elemLocalName);

					// loop through all modules of on module element
					for (var i = modules.length - 1; i >= 0; i--) {
						var module = modules.item(i);
						
						// write results in data objects
						if (module.hasAttribute(xmlAttribute) && module.getAttribute(xmlAttribute) !== '') {
							if (target === 'classify') {
								store.inputDataCl.push({
									xid: module.getAttribute(xmlAttribute),
									txt: module.textContent.replace(/(\r?\n)+|(\r)+/g, ' ').replace(/\s+/, ' ')
								});
							} else if (target === 'report') {
								store.inputDataRp.push({
									xid: module.getAttribute(xmlAttribute),
									txt: module.textContent.replace(/(\r?\n)+|(\r)+/g, ' ').replace(/\s+/, ' ')
								});
							} else {
								// parsing with signals
								if (xmlSignals.length > 0) {
									var sigTexts = [];

									for (var j = 0; j < xmlSignals.length; j++) {
										var sigElem = module.getElementsByTagName(xmlSignals[j]);
										for (var k = sigElem.length - 1; k >= 0; k--) {
											var sigText = sigElem.item(k).textContent.replace(/(\r?\n)+|(\r)+|\s\s+/g, ' ');
											sigTexts.push(sigText);
										}
									}

									store.inputData.push({
										clf: module.getAttribute(xmlAttribute),
										txt: module.textContent.replace(/(\r?\n)+|(\r)+|\s\s+/g, ' '),
										sig: sigTexts.join(' ')
									});
								// default parsing without signals
								} else {
									store.inputData.push({
										clf: module.getAttribute(xmlAttribute),
										txt: module.textContent.replace(/(\r?\n)+|(\r)+|\s\s+/g, ' ')
									});
								}
							}
						}
					}
				}

				// remove processed xml document from store
				store.xmlDocuments.splice(d, 1);

				// reset XML options for other documents
				ui.hide();
			}

			
		},

		preparePDF: function (arrayBuffer) {
			var dataObj = {data: arrayBuffer},
				pdfObject = [];

			// store PDF arrayBuffer
			store.pdfArrayBuffer = arrayBuffer;	

			// lazy requiring PDF.js 
			require(['pdfjs-dist/build/pdf'], function (PDFJS) {
				PDFJS.getDocument({
			        data: dataObj.data
			    }).then(function (pdfDoc) {
					var pageCount = pdfDoc.numPages,
						pagesProcessed = 0;		        

					// loop through pages and extract raw text information
					for (var p = 0; p < pageCount; p++) {
						pdfDoc.getPage(p + 1).then(function (pdfPage) {
				        	pdfPage.getTextContent().then(function (textContent) {
				        		pdfObject.push(textContent);		
				        		pagesProcessed++;
				        		
				        		// check if last reamining page
				        		if (pagesProcessed === pageCount) {
				        			work.processPDF(pdfObject);
				        		}
				        	});
				        });
					}
			    });
			});
		}

	};

	// fix scoping
	return file;
});