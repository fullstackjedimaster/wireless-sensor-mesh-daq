/**
 * @preserve Copyright 2012 Draker Inc - Pats Pending
 */

/*

FLEXIBLE JSON CHARTS v2.0 w/ Highcharts

Author: Justin Winslow
Last updated: 09/13/2012 by Justin Winslow

Dependencies:
/highcharts.js

AVAILABLE OPTIONS:
{
	title : 'Chart', //Title for chart or `false`.
	chartType : string, //Type of chart (line, area, scatter, etc.)
	autoUpdate : boolean, //Automated updates for today's data
	downloadWidget : boolean, //Whether or not to surface download data links
	template : string, //Name of options template,
	path : string //Path to data
}

*/

define( ['jquery', 'highcharts', 'static/scripts/modules/urls', 'utils'], function ($, Highcharts, urls) {

ss.charts = {
	//myCharts : [],

	template : function(options){
		var size = (options.size)?options.size + 'Width': 'fullWidth',
			addClass = options.addClass || '';

		return [
			//'<div class="container ' + size + '">',
				'<div id="' + options.id + '" class="module interactive chart dynamic ' + addClass + '">',
					'<div class="title">',
						'<h3>Loading...</h3>',
					'</div>',
					'<div class="content">',
						'<img src=' + ss.urls.src + '"../../images/icon_loading.gif" class="loading">',
					'</div>',
				'</div>'//,
			//'</div>'
		].join('')
	},

	_chartOptions : function(){
		var core = {//Shared options
			allowPointSelect : true,

			chart : {
				animation : false,
				type : 'spline',
				spacingTop : 12,
				spacingRight : 12,
				spacingBottom : 12,
				spacingLeft : 12,
				zoomType : 'xy',
				plotBorderWidth : 1,
				plotBorderColor : '#ccc',
				resetZoomButton : {
					theme : {
						border : '1px solid #f00',
						background : '#545454 url(../images/sprite_btns.png) 0 -300px repeat-x'
					},
					position : {}
				}
			},

			credits : false,

			navigation : {
				buttonOptions : {
					align : 'left'
				}
			},

			plotOptions : {
				area : {
					animation: false,
					//fillColor : '#ccc',
					fillOpacity : 0,
					lineWidth : 0,
					marker : {
						enabled : false,
						radius : 2,
						states: {
							hover: {
								enabled: true,
								radius: 3
							}
						}
					},
					stacking : 'normal',
					shadow : false
				},

				line : {
					animation : false,
					lineWidth : 2,
					marker : {
						enabled : false,
						radius : 2,
						states: {
							hover: {
								enabled: true,
								radius: 3
							}
						}
					},
					states : {
						hover :{
							lineWidth : 2
						}
					},
					shadow : false
				},

				spline : {
					animation : false,
					lineWidth : 2,
					marker : {
						enabled : false,
						radius : 3,
						states: {
							hover: {
								enabled: true,
								radius: 3
							}
						}
					},
					states : {
						hover :{
							lineWidth : 2
						}
					},
					shadow : false
				}
			},

			title : {
				text : null //that.options.title
			},

			tooltip: {
				enabled : true,
				crosshairs : true,
				shared : true,
				borderColor : '#cccccc',
				borderRadius : 2,
				borderWidth : 1,
				shadow : false,
				useHTML : true,
				xDateFormat : '%Y-%m-%d %H:%M', //%e %b %H:%M',
				headerFormat : '<span style="color:#555;font-size:1.25em;">{point.key}</span><br>'
			}
		}

		var basic = $.extend(true, {}, core, {//Arbitrary charting additional options
			legend : {
				enabled : false
			},

			xAxis : [
				{//xAxis 0
					min : 0,
					title : {
						text: '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#555'
						}
					}
				}
			],

			yAxis : [
				{//yAxis 0
					min : 0,
					title : {
						text: '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#555'
						}
					}
				}
			]
		});

		var sparkline = $.extend(true, {}, core, {
			chart : {
				animation : false,
				spacingTop : 0,
				spacingRight : 0,
				spacingBottom : 1,
				spacingLeft : 0,
				zoomType : false,
				borderWidth: 0,
				backgroundColor: false,
				plotBorderWidth : 0,
				plotBackgroundColor: false
			},
			tooltip: false,
			legend: false,
			plotOptions: {
				series: {
					marker: {
						enabled: false
					}
				}
			},
			xAxis : [
				{//xAxis 0
					title : false,
					type: 'datetime',
					labels: false,
					lineWidth: 0
				}
			],
			yAxis : [
				{//yAxis 0
					min : 0,
					title : false,
					labels: false,
					gridLineWidth: 0
				}
			]
		});

		var timeline = $.extend(true, {}, core, {//Timeline charting additional options
			chart: {
				events: {
					click: function(e) {
						//console.log(e);
						$(document).trigger('setTime', {time: e.xAxis[0].value});
					}
				}
			},
			legend : {
				layout : 'vertical',
				verticalAlign : 'bottom',
				align : 'left',
				borderRadius : 2,
				borderWidth : 1,
				borderColor : '#ccc',
				floating: true,
				backgroundColor : '#fff',
				x : 60,
				y : -24,
				itemStyle: {
					//font : '',
					color: '#06c',
					textDecoration : 'none'
				},
				itemHoverStyle: {
					color: '#06c',
					textDecoration : 'underline'
				},
				labelFormatter: function() {
		        	return this.name;
		        }
			},

			xAxis : {
				type : 'datetime',
				dateTimeLabelFormats : {
					hour : '%H:%M'
				}
			},

			yAxis: [
				{//yAxis 0
					min : 0,
					title : {
						text: '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#555'
						}
					}
				},
				{//yAxis 1
					min : 0,
					opposite: true,
					title : {
					   	text: '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#555'
						}
					}
				},
				{//yAxis 2
					min : 0,
					opposite: false,
					labels : {
						formatter: function() {
							return '';
						}
					},
					title : {
						text : '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#555'
						}
					}
				},
				{//yAxis 3
					min : 0,
					opposite: false,
					labels : {
						formatter: function() {
							return '';
						}
					},
					title : {
						text : '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#555'
						}
					}
				},
				{//yAxis 4 - Time Indicator
					gridLineWidth : 0,
					tickWidth : 0,
					showLastLabel : false,
					labels : {
						enabled : false
					},
					title : {
						text : ''
					},
					min : 0,
					max : 1,
					minPadding : 0,
					maxPadding : 0
				}
			]
		});

		var kiosk = $.extend(true, {}, core, {//Timeline charting additional options
			credits : false,
			chart : {
				type : 'spline',
				spacingTop : 12,
				spacingRight : 12,
				spacingBottom : 12,
				spacingLeft : 12,
				zoomType : null,
				plotBorderWidth : 1,
				plotBorderColor : '#222',
				backgroundColor : '#333',
				resetZoomButton : {
					theme : {
						border : '1px solid #f00',
						background : '#545454 url(../_images/sprite_btns.png) 0 -300px repeat-x'
					},
					position : {}
				}
			},
			allowPointSelect : true,
			legend : {
				layout : 'vertical',
				verticalAlign : 'bottom',
				align : 'left',
				borderRadius : 2,
				borderWidth : 1,
				borderColor : '#222',
				floating: true,
				backgroundColor : '#555',
				x : 60,
				y : -24,
				itemStyle: {
					//font : '',
					color: '#ccc',
					textDecoration : 'none'
				},
				itemHoverStyle: {
					color: '#ccc',
					textDecoration : 'underline'
				},
				labelFormatter: function() {
		        	return this.name;
		        }
			},
			plotOptions : {
				line : {
					//animation : false,
					lineWidth : 2,
					marker : {
						enabled : true,
						radius : 2,
						states: {
							hover: {
								enabled: true,
								radius: 4
							}
						}
					}
				},

				spline : {
					//animation : false,
					lineWidth : 2,
					marker : {
						enabled : false,
						radius : 0,
						states: {
							hover: {
								enabled: false,
								radius: 5
							}
						}
					}
				},

				area : {
					//fillColor : '#ccc',
					fillOpacity : 0.5,
					lineWidth : 2,
					marker : {
						enabled : true,
						radius : 3,
						states: {
							hover: {
								enabled: true,
								radius: 5
							}
						}
					},
					stacking : 'normal',
					shadow : false
				}
			},
			title : {
				text : null //that.options.title
			},
			xAxis : {
				type : 'datetime',
				dateTimeLabelFormats : {
					hour : '%H:%M'
				},
				gridLineColor: '#222',
				tickColor: '#222',
				lineColor: '#333',
				labels: {
		            style: {
		                color: '#ccc'
		            }
		        }
			},
			yAxis: [
				{//yAxis 0
					min : 0,
					gridLineColor : '#222',
					tickColor : '#222',
					title : {
						text: '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#ccc'
						}
					},
					labels: {
			            style: {
			                color: '#ccc'
			            }
			        }
				},
				{//yAxis 1
					min : 0,
					opposite: true,
					gridLineColor : '#222',
					tickColor : '#222',
					title : {
					   	text: '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#ccc'
						}
					},
					labels: {
			            style: {
			                color: '#ccc'
			            }
			        }
				},
				{
					min : 0,
					opposite: false,
					labels : {
						formatter: function() {
							return '';
						}
					},
					title : {
						text : '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#ccc'
						}
					},
					labels: {
			            style: {
			                color: '#ccc'
			            }
			        }
				},
				{
					min : 0,
					opposite: false,
					labels : {
						formatter: function() {
							return '';
						}
					},
					title : {
						text : '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#ccc'
						}
					},
					labels: {
			            style: {
			                color: '#ccc'
			            }
			        }
				},
				{
					labels : {
						formatter: function() {
							return '';
						}
					},
					title : {
						text : '',
						style : {
							fontFamily : 'Arial, Helvetica, sans-serif',
							fontWeight : 'normal',
							color : '#ccc'
						}
					},
					min : 0,
					max : 1,
					minPadding : 0,
					maxPadding : 0
				}
			],
			tooltip: {
				enabled : false,
				crosshairs : true,
				shared : true,
				borderColor : '#cccccc',
				borderRadius : 2,
				borderWidth : 1,
				useHTML : true,
				xDateFormat : '%e %b %H:%M',
				headerFormat : '<span style="color:#555;font-size:1.25em;">{point.key}</span><br>'
			},
			navigation : {
				buttonOptions : {
					align : 'left'
				}
			}
		});

		return {// Return compiled options objects
			basic: basic,
			timeline: timeline,
			kiosk: kiosk,
			sparkline: sparkline
		}
	},

	_seriesProperties : function(mySeries, series, chart){
		//console.log(series)
		var labelPieces = mySeries.dataType.split('_'); //Split Vi_avg at the underscore
		//console.log(labelPieces)
		var labelParam = function(){
			if(labelPieces[1] === "mean"){
				return "avg";
			}else{
				return labelPieces[1]; //Avg/min/max/etc from the label of the data element
			}
		}

		var deviceLabel = (ss.devices.allNodesById[mySeries.deviceID])?' (' + ss.devices.allNodesById[mySeries.deviceID].label + ')':'';

		var myProperties = {};

		if(labelPieces[0] === "V" && labelPieces[1] === "prime"){
			myProperties = {
				name: "Voltage (Inference) " + deviceLabel,
				color: '#f16eaa',
				axisLabel : "Volts"
			}
		}else if(labelPieces[0] === "V"){
			myProperties = {
				name: "Voltage" + deviceLabel,
				color: '#9e005d',
				axisLabel : "Volts"
			}
		}else if(labelPieces[0] === "Vi"){
			myProperties = {
				name: "Voltage in" + deviceLabel,
				color: '#f16eaa',
				axisLabel : "Volts"
			}

		}else if(labelPieces[0] === "Vo"){
			myProperties = {
				name: "Voltage out" + deviceLabel,
				color: '#9e005d', //'#f16eaa',
				axisLabel : "Volts"
			}
		}else if(labelPieces[0] === "P" && $('body#page_kiosk').length){
			myProperties = {
				name: "Power" + deviceLabel,
				color: '#06c',
				axisLabel : "Watts"
			}
		}else if(labelPieces[0] === "P"){
			myProperties = {
				name: "Power" + deviceLabel,
				color: '#06c',
				axisLabel : "Watts"
			}
		}else if(labelPieces[0] === "Po" && !labelPieces[1]){
			myProperties = {
				name: "AC out" + deviceLabel,
				color: '#7fbfff',
				axisLabel : "Watts"
			}
		}else if(labelPieces[0] === "Pi" && !labelPieces[1]){
			myProperties = {
				name: "DC in" + deviceLabel,
				color: '#a67c52',
				axisLabel : "Watts"
			}
		}else if(labelPieces[0] === "Pi"){
			myProperties = {
				name: "Power in" + deviceLabel,
				color: '#7fbfff',
				axisLabel : "Watts"
			}
		}else if(labelPieces[0] === "Po" && labelPieces[1] !== 'sum'){
			myProperties = {
				name: "Power out" + deviceLabel,
				color: '#06c', //'#7fbfff',
				axisLabel : "Watts"
			}
		}else if(labelPieces[0] === "Po" && labelPieces[1] === 'sum'){
			myProperties = {
				name: "Power out" + deviceLabel,
				color: '#06c',
				axisLabel : "Watts"
			}
		}else if(labelPieces[0] === "I"){
			myProperties = {
				name: "Current" + deviceLabel,
				color: '#00a651',
				axisLabel : "Amps"
			}
		}else if(labelPieces[0] === "Ii"){
			myProperties = {
				name: "Current in" + deviceLabel,
				color: '#acd473',
				axisLabel : "Amps"
			}
		}else if(labelPieces[0] === "Io"){
			myProperties = {
				name: "Current out" + deviceLabel,
				color: '#00a651', //'#acd473',
				axisLabel : "Amps"
			}
		}else if(labelPieces[0] === "RSSI"){
			myProperties = {
				name: "Radio signal strength",
				color: '#999',
				axisLabel : "Signal to noise ratio",
				min:-100,
				max:0
			}
		}else if(labelPieces[0] === "irradiance" || labelPieces[0] === "Irradiance" && labelPieces[1] !== 'sum'){
			myProperties = {
				name:"Irradiance",
				color:'#ffb218',
				axisLabel:"Irradiance (W/m²)"
			}
		}else if(labelPieces[0] === "irradiance" || labelPieces[0] === "Irradiance" && labelPieces[1] === 'sum'){
			myProperties = {
				name:"Insolation",
				color:'#ffb218',
				axisLabel:"Insolation (kWh/m²)"
			}
		}else if(labelPieces[0] === "energy" || labelPieces[0] === "Energy"){
			myProperties = {
				name:"DC Energy",
				color:'#06c',
				axisLabel:"kiloWatt hours"
			}
		}else if(labelPieces[0] === "acenergy" || labelPieces[0] === "ACEnergy"){
			myProperties = {
				name:"AC Energy",
				color:'#6ca5d9', //'#7fbfff',
				axisLabel:"kiloWatt hours"
			}
		}else if(labelPieces[0] === "efficiency" || labelPieces[0] === "Efficiency" || labelPieces[0] === "cleanliness" || labelPieces[0] === "Cleanliness"){
			myProperties = {
				name:"Soiling",
				axisLabel:"Percent",
				color: "#00a651", // Green
				fillOpacity : .75
			}
		}else if(labelPieces[0] === "health" || labelPieces[0] === "Health"){
			myProperties = {
				name: "Health",
				axisLabel: "Percent",
				color: "#9e005d", // Magenta
				fillOpacity : .75
			}
		}else if(labelPieces[1] === 'temperature'){
			if(labelPieces[0] === 'panel'){
				myProperties = {
					name: "Panel Temperature",
					axisLabel: "Degrees Celsius",
					color: "#FF7F00"
				}
			}else if(labelPieces[0] === 'ambient'){
				myProperties = {
					name:"Ambient Temperature",
					axisLabel:"Degrees Celsius",
					color: "#E41A1C"
				}
			}
		}

		/* Switch to arbitrary series colors if dataTypes are duplicated */
		if(chart.series.length > 1){
			for(var siblingSeries=0, seriesLength=chart.series.length; siblingSeries<seriesLength; siblingSeries++){
				if(series !== siblingSeries && chart.series[siblingSeries].dataType === mySeries.dataType && chart.series[siblingSeries].deviceType === mySeries.deviceType){
					myProperties.color = ss.charts.seriesColors[series];
				}
			}
		}

		/* Color node averages grey */
		if(mySeries.deviceType === 'strcalc' || mySeries.deviceType === 'invcalc' || mySeries.deviceType === 'arraycalc'){
			if(labelPieces[0] === 'Pi' || labelPieces[0] === 'Vi' || labelPieces[0] === 'Ii' || labelPieces[0] === 'Po' || labelPieces[0] === 'Vo' || labelPieces[0] === 'Io'){
				var oldLabel = myProperties.name.split(' ');
				myProperties.color = '#ddd';
				myProperties.name = oldLabel[0] + ' ' + oldLabel[1] + ' avg';
			}
		}

		/* Handle advanced data types */
		if(labelPieces[1] === 'stdev' || labelPieces[1] === 'min' || labelPieces[1] === 'max'){
			var oldLabel = myProperties.name;
			myProperties.color = '';
			myProperties.name = oldLabel + ' (' + labelPieces[1] + ')';
		}

		/* Smart axis selection */
		if(series === 0){
			myProperties.yAxis = 0;
		}else{
			for(var siblingSeries=0, seriesLength=chart.series.length; siblingSeries<seriesLength; siblingSeries++){
				if(myProperties.axisLabel === chart.series[siblingSeries].axisLabel || !chart.series[siblingSeries].axisLabel/*data.cols[col] === that.series[series].dataType*/){
					myProperties.yAxis = siblingSeries;
					break;
				}
			}
		}

		//console.log(myProperties.name, myProperties.yAxis);

		/* Return the properties object */
		return myProperties;
	},

	seriesColors : ['#8DD3C7', '#4DAF4A', '#FF7F00', '#F781BF', '#E41A1C', '#FFFF33', '#A65628', '#377EB8', '#BEBADA', '#FB8072', '#80B1D3', '#B3DE69', '#984EA3', '#FCCDE5', '#D9D9D9', '#BC80BD', '#FDB462', '#CCEBC5', '#FFED6F', '#0066cc'],

	chart : {
		_init : function(options, appendToElement){
			//console.log('chart init', options, $appendToElement, Highcharts, this);
			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			for(var option in this.options){

				if(option === 'deviceType' || option === 'deviceID' || option === 'dataType'){
					//console.log(option, typeof(this.options[option]));

					if(typeof this.options[option] === 'string'){
						this.options[option] = this.options[option].split('+');
					}
				}
			}

			this.$element = $(ss.charts.template(this.options));
			this.element = this.$element[0];

			this.$element.data('module', this);

			if(appendToElement){
				$(appendToElement).append(this.$element);
			}else{
				$('.container_modules').append(this.$element);
			}

			if(this.options.title){
				this.$element.find('h3').text(this.options.title.replace(/\+/g, ' '));
			}else{
				this.$element.find('.title').remove();
			}

			this.series = [];	//Create series array in new object

			this._dataRequested = this.options.deviceID.length;
			this._dataLoaded = 0;

			var that = this;

			if(this.$element.hasClass('fullHeight')){
				//console.log('has full height');
				/* 
					Trigger vertical fill if applicable 
					This needs to be a lot savvier
				*/
				//ss.layout.fillVertically();
				require(['static/scripts/modules/layoutHelpers'], function(layout){
					that.fullHeight = ss.layouts.fullHeight;

					that.fullHeight();

					$(window).smartresize(function(){
						that.fullHeight();
					});
				});
			}

			//Build chart options
			this._chartOptions = ss.charts._chartOptions();
			
			//console.log(that.options.deviceID);
			for(var deviceIndex=0, devicesLength=that.options.deviceID.length; deviceIndex<devicesLength; deviceIndex++){
				//console.log(deviceIndex);
				that._getData(deviceIndex);
			}

			that._addListeners();
		},

		_parseData : function(data, deviceIndex){
			var that = this;

			var addSeries = function(series){
				if(series && typeof(series) === 'object'){
					var mySeries = series;

					if(that.series.length === 0){
						//console.log('no serieses');
						that.series.push(mySeries);
					}else{
						//console.log('has series');
						for(var series=0, seriesLength=that.series.length; series<seriesLength; series++){
							//console.log(that.series[series]);
							//console.log(that.series[series].deviceID, mySeries.deviceID);
							if(that.series[series].dataType === mySeries.dataType && that.series[series].deviceID === mySeries.deviceID){
								//console.log('is match', that.series[series], mySeries);
								$.extend(that.series[series], mySeries);
							}else if((seriesLength-1) === series){
								//console.log('no has match');
								that.series.push(mySeries);
							}
						}
					}
				}else{
					throw 'Series object not provided or not correct format'
				}
			}

			if(data.cols){
				// device timeline data handling
				if(data.data[0]){
					for(var device=0, devicesLength=data.data[0][1].length; device<devicesLength; device++){
						//newSeries[device] = [];	//Array for lines generated from this data set
						for(var col=0, colsLength=data.cols.length; col<colsLength; col++){

							var mySeries = {
								data : [],
								dataType : data.cols[col],
								deviceID : data.data[0][1][device][0],
								deviceType : that.options.deviceType[deviceIndex],
								xAxis : 0,
								threshold : .00001
							}

							var smartRounding = function(){
								var myDataType = mySeries.dataType.split('_');
								//console.log(myDataType);
								if(myDataType[0] === 'I' || myDataType[0] === 'Io' || myDataType[0] === 'Ii'){
									return 3;
								}else if(myDataType[0] === 'V' || myDataType[0] === 'Vo' || myDataType[0] === 'Vi'){
									return 2;
								}else if (myDataType[1] === 'sum'){
									return 2;
								}else if (myDataType[0] === 'Cleanliness' || myDataType[0] === 'Health'){
									return 2;
								}else if (myDataType[1] === 'temperature'){
									return 1;
								}else{
									return 0;
								}
							}();

							for(var day=0, dayLength=data.data.length; day<dayLength; day++){
								if(data.data[day][1][device]){
									for(var e=0, eLength=data.data[day][1][device][1].length;e<eLength;e++){//push it's data to the array
										var myDate = data.data[day][0].split('-'),
											myTime = data.data[day][1][device][1][e][0].split(':');
										//var newDate = new Date(+myDate[2], (+myDate[1]-1), +myDate[0], +myTime[0], +myTime[1]);

										mySeries.data.push( [Date.UTC(+myDate[0], (+myDate[1]-1), +myDate[2], +myTime[0], +myTime[1]), roundNumber(data.data[day][1][device][1][e][col + 1], smartRounding)] );
									}
								}
							}

							addSeries(mySeries);
						}
					}
				}else{
					/*
					ss.errorMessages({
						element:that.$element,
						type:'warning',
						content:'Some data is unavailable',
						fixed:false
					});
					*/

					ss.modules.create('messages', that.$element[0], {
						type: 'notification',
						content: 'Some data is unavailable',
						closable: false,
						css: {
							position: 'absolute',
							top: 30,
							left: 0,
							'z-index': 100
						}
					});
					//newSeries[device] = [];	//Array for lines generated from this data set
					for(var col=0, colsLength=data.cols.length; col<colsLength; col++){
						addSeries({
							data : [],
							dataType : data.cols[col],
							deviceID : that.options.deviceID[deviceIndex],
							deviceType : that.options.deviceType[deviceIndex],
							xAxis : 0,
							threshold : .00001
						});
					}
				}
			//if data.cols
			}else{
				/* Arbitrary chart data handling */
				that.series.push({
					data : data.data,
					xAxis : 0,
					yAxis : 0
				});

				that.options.axisLabels = data.labels;
			}
		},

		_getData : function(deviceIndex){
			/*
				Load data and distribute it to series
			*/
			var that = this,
				build = function(){
					if(!that.chart){
						//If the chart hasn't been built yet build it
						that._build();
					}else{
						//else, fire update method
						that._updateData();
					}
				}

			if(!this.dataDefer){
				this.dataDefer = [];
			}

			//console.log(this.options.data);

			if(!this.options.data){
				var myData = $.ajax({
					url: (typeof(this.options.path) === 'function')?this.options.path(deviceIndex):this.options.path,
					cache: false,
					async: true,//(dataRequested > 0)?false:true,//if there are multiple datas for the same chart, disable async so the chart doesn't build prematurely
					//timeout: 5000,
					success: function(data){
						++that._dataLoaded;//Increment loaded data
						//console.log(deviceIndex + ' of ' + dataRequested)

						that._parseData(data, deviceIndex);

						//console.log(that._dataRequested + ' : ' + that._dataLoaded)
						if(that._dataLoaded === that._dataRequested){
							that._dataLoaded = 0;	//Reset the counter

							//If Sentalis project, check if DC is available
							if(window.Sentalis && !Sentalis.currentProject.attributes.spti_enabled){
								build();
							}else{
								require(['static/scripts/modules/devices'], function(devices){
									//Wait for devices to build the rest of the module
									devices.dataDefer.done(function(){
										build();
									});
								});
							}
						}
					},
					error: function(data){
						++that._dataLoaded;

						/*
						ss.errorMessages({
							element:that.$element,
							type:'error',
							content:'Data failed to load',
							fixed:(that.options.deviceID.length > 1)?false:true
						});
						*/

						ss.modules.create('messages', that.$element[0], {
							type: 'error',
							content: 'Data failed to load',
							css: {
								position: 'absolute',
								top: 30,
								left: 0,
								'z-index': 100
							}
						});

						that.$element.children('.content').children('img.loading').hide();

						that._parseData({}, deviceIndex);

						if(that._dataLoaded === that._dataRequested){
							that._dataLoaded = 0;	//Reset the counter
							
							//If Sentalis project, check if DC is available
							if(window.Sentalis && !Sentalis.currentProject.attributes.spti_enabled){
								build();
							}else{
								require(['static/scripts/modules/devices'], function(devices){
									//Wait for devices to build the rest of the module
									devices.dataDefer.done(function(){
										build();
									});
								});
							}	
						}
					}
				});

				this.dataDefer.push(myData);
			}else{
				this.series.push({
					data : this.options.data,
					xAxis : 0,
					yAxis : 0
				});

				if(!that.options.axisLabels){
					that.options.axisLabels = ['X Axis', 'Y Axis'];
				}

				this._build();
			}
		},

		_sortSeries : function(){
			this.series.sort(function (a, b) {
				//console.log(ss.devices.allNodesById[a.deviceID].label, ss.devices.allNodesById[b.deviceID].label)
				var aLabel = (ss.devices.allNodesById[a.deviceID] && ss.devices.allNodesById[a.deviceID].devtype !== 'SiteArray')?+ss.devices.allNodesById[a.deviceID].label.replace(/\D/g,''):0;
				var bLabel = (ss.devices.allNodesById[b.deviceID] && ss.devices.allNodesById[b.deviceID].devtype !== 'SiteArray')?+ss.devices.allNodesById[b.deviceID].label.replace(/\D/g,''):0;
				//console.log(a, b);
				//console.log(ss.devices.allNodesById[a.deviceID].label, aLabel, '-', ss.devices.allNodesById[b.deviceID].label, bLabel);
				return ((aLabel < bLabel) ? -1 : ((aLabel > bLabel) ? 1 : 0));
				//return ((parseInt(a.deviceID.split('-')[1]) < parseInt(b.deviceID.split('-')[1])) ? -1 : ((parseInt(a.deviceID.split('-')[1]) > parseInt(b.deviceID.split('-')[1])) ? 1 : 0));
			});
		},

		_build : function(){
			//console.log('build');
			var that = this,
				myOptions;
				//showMarkers = (ss.dates)?((ss.dates.max('UTC') - ss.dates.min('UTC')) <= 0):false;
				//console.log(showMarkers);

			// Sort series for device order
			if(this.series.length > 1 && this.options.chartType !== 'area'){//Sort series to make sure devices are in order of ID
				this._sortSeries();
			}

			// Build new options object
			myOptions = $.extend(true, {}, this._chartOptions[this.options.template]); //Create new options object to build from

			//If a chart type is defined apply it to the options
			if(this.options.chartType){
				myOptions.chart.type = this.options.chartType
			}

			//Keying off axis labels is a stupid way to detect arbitrary data requests
			if(!this.options.axisLabels){
				for(var series=0,seriesLength=this.series.length; series<seriesLength; series++){
					// Add any necessary options before drawing
					var mySeries = {
						dataType: this.series[series].dataType,
						deviceType: this.series[series].deviceType,
						deviceID: this.series[series].deviceID
					}

					if(mySeries.dataType && mySeries.deviceType){
						// Add series properties to series definitions
						$.extend(this.series[series], ss.charts._seriesProperties(mySeries, series, this));
					}
					
					myOptions.yAxis[this.series[series].yAxis].title.text = this.series[series].axisLabel;
				}

				if(this.options.chartType === 'area'){//Unset minimums for area charts
					var newMin = 25;
					//console.log(this.series[0].data.length);
					for(var value=0, dataLength=this.series[0].data.length; value<dataLength; value++){
						var total = 0;
						
						for(var series=0,seriesLength=this.series.length; series<seriesLength; series++){
							total = total + Math.abs(this.series[series].data[value][1]);
						}
						//console.log(total);
						if(total > newMin){
							if(total > 25 && total < 50){
								newMin = 50;
							}else if(total > 50){
								newMin = 100;
							}
						}
					}
					
					myOptions.yAxis[this.series[0].yAxis].min = -newMin;
					myOptions.yAxis[this.series[0].yAxis].max = 0;
					//myOptions.chart.zoomType = null;
				}
			}else{
				myOptions.xAxis[0].title.text = this.options.axisLabels[0];
				myOptions.yAxis[0].title.text = this.options.axisLabels[1];
			}

			//If series colors are provided, ignore smart color selection
			if(this.options.seriesColors){
				for(var series=0, seriesLength=this.series.length; series<seriesLength; series++){
					this.series[series].color = this.options.seriesColors[series];
				}
			}

			if($('#page_summary').length){
				/*
					Special case to force summary page chart tool tips to show day only
					Find a savvier way of handling day scale tooltips
				*/
				myOptions.tooltip.xDateFormat = '%e %b';
			}

			// Set container div for chart on the fly
			myOptions.chart.renderTo = this.$element.find('.content')[0];

			// Copy series objects without overwriting originals
			myOptions.series = $.extend(this.series, []);

			//Check if any series is missing data and throw an error message
			var checkSeriesData = function(){
				for(var series=0,seriesLength=that.series.length; series<seriesLength; series++){
					if(!that.chart.series[series].data || that.chart.series[series].data.length <= 0){
						//console.log(this.series[series])
						/*
						ss.errorMessages({
							element:that.$element,
							type:'warning',
							content:'Some data is unavailable',
							fixed:false
						});
						*/
						ss.modules.create('messages', that.$element[0], {
							type: 'notification',
							content: 'Some data is unavailable',
							css: {
								position: 'absolute',
								top: 30,
								left: 0,
								'z-index': 100
							}
						});
						break;
					}
				}
			}

			//console.log('options built');

			// Embiggen the chart div if there is a lot of data to display
			if(this.series.length && this.series.length > 15 && !this.$element.find('.module').hasClass('fullHeight')){
				var height = 360;

				if(this.series.length > 20){
					height = 480;
				}else if(this.series.length > 18){
					height = 420;
				}

				this.$element.find('.content').animate({
					height: height
				}, 250, function(){
					that.chart = new Highcharts.Chart(myOptions);
					//checkSeriesData();
				});
			}else{
				this.chart = new Highcharts.Chart(myOptions);
				//checkSeriesData();
			}

			// Add data download widget
			if(this.options.downloadWidget === true || this.options.downloadWidget === "true"){
				var downloadDataWidget = [
					'<div class="downloadData">',
						'Download Chart Data: <a href="#csv">CSV</a>',
					'</div>'
				];

				this.$element.find('.content').append(downloadDataWidget.join(''));
			};

			this.$element.find('img.loading').hide();
		},

		_updateData : function(){
			//var showMarkers = (ss.dates)?((ss.dates.max('UTC') - ss.dates.min('UTC')) <= 0):false;

			for(var series=0, seriesLength=this.chart.series.length; series<seriesLength; series++){
				var mySeries = this.chart.series[series];

				// Only display markers if data set is 1 day
				//mySeries.options.marker.enabled = showMarkers;
				mySeries.setData(this.series[series].data);
			}

			this.$element.find('img.loading').hide();
		},

		update : function(){
			//Clear old data
			this.dataDefer = [];

			// Reappend the loading spinner because it gets destroyed in chart creation
			if(this.$element.find('img.loading').length <= 0){
				this.$element.find('.content').append('<img src=' + ss.urls.src + '"../../images/icon_loading.gif" class="loading">');
			}else{
				this.$element.find('img.loading').show();
			}

			//Remove any existing error messages
			this.$element.find('.message').remove();

			//Clear existing data
			for(var series=0, seriesLength=this.chart.series.length; series<seriesLength; series++){
				this.series[series].data = [];
			}

			//Fetch new data
			for(var deviceIndex=0, devicesLength=this.options.deviceID.length; deviceIndex<devicesLength; deviceIndex++){
				this._getData(deviceIndex);
			}
		},

		downloadData : function(element, dataFormat){
			var myContent = [];
			var that = this;
			var allDevices = this.options.deviceType;//Store all device types for the chart

			for(var myDevice=0, allDevicesLength=allDevices.length; myDevice<allDevicesLength; myDevice++){//Loop through each device
				var allData = this.options.dataType[myDevice].split('-');//Store all data available for current device

				var myDataType = function(dataIndex, deviceIndex){
					var dataType = allData[dataIndex].split('_')[0];
					var deviceType = allDevices[deviceIndex];

					if(deviceType === 'arraycalc' || deviceType === 'strcalc' || deviceType === 'invcalc'){
						switch (dataType){
							case 'P' :
								return 'power';
								break;
							case 'V' :
								return 'voltage';
								break;
							case 'I' :
								return 'current';
								break;
							case 'Pi' :
								return 'average power for panels on this parent node';
								break;
							case 'Vi' :
								return 'average voltage for panels on this parent node';
								break;
							case 'Ii' :
								return 'device average current for panels on this parent node';
								break;
							default : 'unknown';
						}
					}else{
						if(dataType === 'Po' || dataType === 'Pi'){
							return 'power';
						}else if(dataType === 'Vo' || dataType === 'Vi'){
							return 'voltage';
						}else if(dataType === 'Io' || dataType === 'Ii'){
							return 'current';
						}else if(dataType === 'irradiance'){
							return 'irradiance';
						}else{
							return dataType;
						}
					}
				}

				for(var myData=0, allDataLength=allData.length; myData<allDataLength; myData++){//Loop through each data type for this device
					myContent.push(
						'<p><a href="'
						+ this.options.path(myDevice).replace(this.options.dataType[myDevice], '') /* Remove data types from path */
						+ allData[myData] + '/300/' + dataFormat + '">'
						+ myDataType(myData, myDevice)
						+ ' ('
						+ dataFormat
						+ ')</a></p>'
					);
				}
			}
			//console.log(myContent);

			ss.modules.create('messages', {
				content: myContent.join(''),
				type: 'popUp',
				title: 'Download device data'
			}, $('body')[0]);

			/*
			var myPopUp = $(element).data();

			myPopUp._position();
			*/
		},

		_chartTimeIndicator : function(utcDate){
			this.chart.xAxis[0].removePlotLine('timeIndicator');

			this.chart.xAxis[0].addPlotLine({
				color: '#aaa',
	            width: 1,
	            value: utcDate,
	            id: 'timeIndicator',
	            dashStyle : 'ShortDot'
			});
		},

		_destroyChartTimeIndicator : function(){
			this.chart.xAxis[0].removePlotLine('timeIndicator');
		},

		destroy : function(){
			//Remove element from dom and purge from memory
			//console.log(this);
			if(this.chart){//Destroy fails going from a sub level up to array level, figure out why later
				this.chart.destroy();
			}

			/* Kill Ajax requests */
			if(this.dataDefer){
				for(var dataDefer=0, dataDefersLength=this.dataDefer.length; dataDefer<dataDefersLength; dataDefer++){
					this.dataDefer[dataDefer].abort();
				}
			}

			this.$element.remove();

			//Remove events
			this.$element.off();

			//Remove stored reference
			/*
			for(var chart=0, chartsLength=ss.charts.myCharts.length; chart<chartsLength; chart++){
				var myChart = ss.charts.myCharts[chart];

				if(myChart && myChart.options.id === this.options.id){
					//ss.charts.myCharts.splice(chart);
					delete(ss.charts.myCharts[chart]);
					break;
				}
			}
			*/

			$(document).unbind('.chart.' + this.options.id);
			/*
			$(document).unbind('updateModules.chart.' + this.options.id);
			$(document).unbind('mapPlay.chart.' + this.options.id);
			*/
		},

		_addListeners : function(){
			//Event based actions
			var that = this;

			/*$(window).smartresize(function(event){
				that._resize();
			});*/

			/*
			this.$element.delegate('a.deviceNavigation', 'click', function(event){
				ss.setDevice($(this).attr('href').replace(/#/g,'')); //Navigation object in script.js
			});
			*/

			/*
			this.$element.delegate('a.resetZoom', 'click', function(event){
				event.preventDefault();
				that.chart.resetZoom();
			});
			*/
			this.$element.hover(
				function(event){
					$(this).find('.downloadData').fadeIn(250);
				},
				function(event){
					$(this).find('.downloadData').fadeOut(250);
				}
			);

			this.$element.delegate('.downloadData a', 'click', function(event){
				event.preventDefault();
				that.downloadData(this, $(this).attr('href').replace('#', ''));
			});

			if(this.options.autoUpdate === true || this.options.autoUpdate === 'true'){
				$(document).bind('updateModules.chart.' + this.options.id, function(){
					that.update();
				});
			}

			$(document).bind('mapPlay.chart.' + this.options.id, function(event, data){
				if(that.chart){
					if(data.stop){
						that._destroyChartTimeIndicator();
					}else{
						that._chartTimeIndicator(data.utcDate);
					}
				}
			});

			/* Kill AJAX requests */

			var abortAjax = function(){
				if(that.dataDefer){
					for(var dataDefer=0, dataDefersLength=that.dataDefer.length; dataDefer<dataDefersLength; dataDefer++){
						that.dataDefer[dataDefer].abort();
					}
				}
			}

			$(document).bind('setDevice.chart.' + this.options.id, function(event, data){
				abortAjax();
			});

			$(window).bind('unload.chart.' + this.options.id, function(event){
				abortAjax();
			});
		},

		//series : [],//Array of objects that constitute the lines to be drawn

		options : {//Define the pieces of the chart, some defaults included
			title : 'Chart',
			chartType : 'line',
			autoUpdate : true,
			downloadWidget : true,
			template : 'timeline',
			deviceID : ['Array'],
			path : function(i){
				if(this.deviceType){
					switch(this.deviceType[i]){
						case 'env':
							return ss.urls.timelineDataEnv + this.deviceType[i] + '/' + this.dataType[i];
							break;
						case 'Site_Array':
							return this.dataType[i];
						default : return ss.urls.timelineDataDevice + this.deviceID[i] + '/' + this.deviceType[i] + '/' + this.dataType[i];
					}
				}
			}
		}
	}
}

return ss.charts.chart;

});//end define