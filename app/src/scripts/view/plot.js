/** 
	fastclass 
	PLOT MODULE
	(c) 2016 Jan Oevermann
	jan.oevermann@hs-karlsruhe.de
	License: MIT

*/

define(['d3', 'helper/l10n', 'helper/util'], function (d3, l, util) {
	// expose d3 as global to fix missing dependency in d3pie
	window.d3 = d3;

	return {
		pieChartClassDistribution: function (element, data) {
			// lazy requiring d3pie module
			require(['pie'], function (pie) {
				var pieChart = new pie(element, {
					size: {
						canvasHeight: 800,
						canvasWidth: 900,
						pieOuterRadius: '60%'
					},
					data: {
						sortOrder: 'label-asc',
						content: data			
					},
					labels: {
						percentage: {
							font: 'inherit',
							fontSize: 14
						},
						mainLabel: {
							font: 'inherit',
							fontSize: 14
						},
						inner: { hideWhenLessThanPercentage: 5 } 
					},
					tooltips: {
						enabled: true,
						type: 'placeholder',
						placeholderParser: function(index, data) {
							data.label = data.label.slice(data.label.indexOf('#'));
						},
						string: '{label}: {value} ' + 
								l('plot_label_ccs') + 
								', {percentage}%'
					},
					misc: { 
						pieCenterOffset: {
							x: 25,
							y: -25 
						}
					} 
				});
			});
		},

		pieChartGauge: function (element, data) {
			// lazy requiring d3pie module
			require(['pie'], function (pie) {
			
				function makeGaugeData (data) {
					return [
						{label: 'Score', value: data, color: '#96c11f'},
						{label: '', value: 100 - data, color: '#ffffff'}
					];
				}

				var pieChart = new pie(element, {
					size: {
						canvasHeight: 350,
						canvasWidth: 350,
						pieOuterRadius: '100%',
						pieInnerRadius: '75%'
					},
					data: {
						content: makeGaugeData(data),
						sortOrder: 'value-desc'	
					},
					labels: {
						/*inner: { hideWhenLessThanPercentage: 99 }, 
						outer: { hideWhenLessThanPercentage: 99 },*/
						lines: { enabled: false } 
					},
					tooltips: {
						enabled: false,
					},
					misc: { 
						pieCenterOffset: {
							x: 35,
							y: -30 
						}
					} 
				});
			});
		},

		barChartClassScores: function (element, data) {
			// lazy requiring MetricsGraphic module
			util.requireCSS('vendor/metricsgraphics.css');
			require(['mg'], function (MG) {
				var sorted = data.sort(function (a,b) {
					return a.val - b.val; 
				});

				var	named = sorted.map(function(d) {
					return {
						class: d.lbl, 
						cosine: d.val
					};
				});

				MG.data_graphic({
					data: named,
					left: 100,
					width: 650,
					height: 250,
					top: 10,
					right: 5,
					chart_type: 'bar',
					x_accessor: 'cosine',
					x_label: l('plot_label_cosine'),
					y_accessor: 'class',
					y_label: l('plot_label_class'),
					target: '#' + element,
					animate_on_load: true,
					mouseover: function(d) {
						d3.select('#' + element + ' svg .mg-active-datapoint')
						  .text(l('plot_label_class') + ': ' + d.class + '  ' +
								l('plot_label_cosine') + ': ' + util.round(d.cosine, 2));
					}
				});
			});
		},

		lineChartConfidenceTrans: function (element, data) {
			// lazy requiring MetricsGraphic module
			util.requireCSS('vendor/metricsgraphics.css');
			require(['mg'], function (MG) {
				var named = data.map(function(d, i) { 
					return {
						page: d.pos, 
						object: i, 
						conf: d.cfd
					};
				});

				MG.data_graphic({
					width: 650,
					height: 250,
					bottom: 35,
					top: 10,
					data: named,
					area: false,
					target: '#' + element,
					baselines: [{value: 30, label: l('plot_label_threshold')}],
					x_accessor: 'object',
					x_label: l('plot_label_object'),
					y_accessor: 'conf',
					y_label: l('plot_label_confidence'),
					yax_units_append: '%',
					animate_on_load: true,
					mouseover: function(d) {
						d3.select('#' + element + ' svg .mg-active-datapoint')
						  .text(l('plot_label_object') + ': ' + d.object + '  ' +
								l('plot_label_page') + ': ' + d.page + '  ' +
								l('plot_label_confidence') + ': ' + 
									util.round(d.conf, 2) + '%');
					}
				});
			});
		},

		scatterPlotClassDist: function (element, data) {
			// lazy requiring MetricsGraphic module
			util.requireCSS('vendor/metricsgraphics.css');
			require(['mg'], function (MG) {
				var named = data.map(function(d) {
					return {
						Page: d.pos, 
						Confidence: d.cfd, 
						class: d.clf
					};
				});

				MG.data_graphic({
					width: 650,
					height: 250,
					bottom: 35,
					top: 10,
					show_tooltips: false,
					data: named,
					chart_type: 'point',
					target: '#' + element,
					x_accessor: 'Page',
					x_label: l('plot_label_page'),
					y_accessor: 'Confidence',
					y_label: l('plot_label_confidence'),
					yax_units_append: '%',
					xax_count: 10,
					color_accessor: 'class',
					color_type:'category',
					x_rug: true
				});
			});
		},

		histogramConfDist: function (element, data) {
			// lazy requiring MetricsGraphic module
			util.requireCSS('vendor/metricsgraphics.css');
			require(['mg'], function (MG) {

				MG.data_graphic({
					data: data,
					chart_type: 'histogram',
					width: 280,
					height: 105,
					left: 25,
					right: 10,
					bottom: 25,
					top: 15,
					x_accessor: 'cfd',
					min_x: 0,
					max_x: 100,
					bins: 20,
					bar_margin: 0,
					y_extended_ticks: true,
					axes_not_compact: true,
					target: '#' + element,
					mouseover: function(d, i) {
						d3.select('#' + element + ' svg .mg-active-datapoint')
							.text(l('plot_label_confidence') + ' > ' + 
								util.round(d.x) +  '   ' + l('plot_label_count') + ': ' + d.y);
					}
				});
			});
		},

		histogramSimDist: function (element, data) {
			// lazy requiring MetricsGraphic module
			util.requireCSS('vendor/metricsgraphics.css');
			require(['mg'], function (MG) {

				MG.data_graphic({
					data: data,
					chart_type: 'histogram',
					width: 280,
					height: 105,
					left: 25,
					right: 10,
					bottom: 25,
					top: 15,
					min_x: 0,
					max_x: 1,
					bins: 20,
					bar_margin: 0,
					y_extended_ticks: true,
					axes_not_compact: true,
					target: '#' + element
				});
			});
		},

		forceDirectedGraph: function(element, data) {
			var svg = d3.select("#" + element),
				width = 900,
				height = 600;

			var graph = util.copyObject(data);

			var color = d3.scaleOrdinal(d3.schemeCategory20);

			var simulation = d3.forceSimulation()
				.force("link", d3.forceLink().id(function(d) { return d.id; }))
				.force("charge", d3.forceManyBody().strength(-3))
				.force("center", d3.forceCenter(width / 2, height / 2));

			var div = d3.select("body").append("div")
				.attr("class", "graph-tooltip")
				.style("opacity", 0);

			var link = svg.append("g")
				.attr("class", "graph-links")
				.selectAll("line")
				.data(graph.links)
				.enter().append("line")
				.attr("stroke-width", function(d) { return d.value * 3; });

			var node = svg.append("g")
				.attr("class", "graph-nodes")
				.selectAll("circle")
				.data(graph.nodes)
				.enter().append("circle")
				.attr("r", countConnected)
				.on("mouseover", mouseover)
				.on("mouseout", mouseout)
				//.attr("fill", function(d) { return color(d.group); })
				.call(d3.drag()
					.on("start", dragstarted)
					.on("drag", dragged)
					.on("end", dragended));

			node.append("title")
				.text(function(d) { return d.id; });

			link.attr("title", function(d) { return d.value; });

			simulation
				.nodes(graph.nodes)
				.on("tick", ticked);

			simulation.force("link")
				.links(graph.links);

			function countConnected (d) {
				var counter = 0,
					links = graph.links;
				for (var l = 0; l < links.length; l++) {
					if (links[l].source === d.id || links[l].target === d.id) { 
						counter++;
					}
				}
				
				return 3 + counter * 0.6;
			}

			function ticked() {
				link.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; });

				node.attr("cx", function(d) { return d.x; })
					.attr("cy", function(d) { return d.y; });
			}

			function dragstarted(d) {
				if (!d3.event.active) simulation.alphaTarget(0.3).restart();
				d.fx = d.x;
				d.fy = d.y;
			}

			function dragged(d) {
				d.fx = d3.event.x;
				d.fy = d3.event.y;
			}

			function dragended(d) {
				if (!d3.event.active) simulation.alphaTarget(0);
				d.fx = null;
				d.fy = null;
			}

			function mouseover(d) {
				div.transition()
					.duration(200)
					.style("opacity", 0.9);
			   	div.html('<b>Modul:</b> ' + d.id)
					.style("left", (d3.event.pageX) + "px")
					.style("top", (d3.event.pageY - 28) + "px");
			}

			function mouseout(d) {
				div.transition()
		        	.duration(500)
		        	.style("opacity", 0);
			}
		}	
	};
});