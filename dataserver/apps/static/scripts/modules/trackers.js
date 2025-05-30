/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

PRODUCTION TRACKER

Author: Justin Winslow
Last updated: 08/01/2012 by Justin Winslow

*/

define( ['jquery', 'dataTables', 'static/scripts/modules/dateBasic'], function ($, dataTables, dateBasic) {

ss.trackers = {
	myTrackers : [],

	template : function(options){
		return [
			'<div id="' + options.id + '" class="module tracker">',
				'<div class="testFilter">',
					'<label for="min_date">Start Date:</label> <input id="min_date" name="min_date" type="text" value="' + $("input[name=latest_date]").val() + '" /> ',
					'<label for="max_date">End Date:</label> <input id="max_date" name="max_date" type="text" value="' + $("input[name=latest_date]").val() + '" /><br>',
					'<strong>Models</strong>: ',
					'<label for="product_model_SPM80V12A"><input type="checkbox" name="product_model" id="product_model_SPM80V12A" value="SPM80V12A"> SPM80V12A</label> ',
					'<label for="product_model_SPM80V12A-S"><input type="checkbox" name="product_model" id="product_model_SPM80V12A-S" value="SPM80V12A-S"> SPM80V12A-S</label> ',
					'<label for="product_model_SPM125V8A"><input type="checkbox" name="product_model" id="product_model_SPM125V8A" value="SPM125V8A"> SPM125V8A</label> ',
					'<label for="product_model_SPM125V8A-S"><input type="checkbox" name="product_model" id="product_model_SPM125V8A-S" value="SPM125V8A-S"> SPM125V8A-S</label> ',
					'<label for="product_model_SPO350W80V"><input type="checkbox" name="product_model" id="product_model_SPO350W80V" value="SPO350W80V"> SPO350W80V</label>',
					'<br>',
					'<strong>Status</strong>: ',
					'<label for="fail_only"><input type="checkbox" name="fail_only" id="fail_only" value="fail"> Show Failed Tests</label>',
					'<br>',
					'<div class="container_buttons">',
						'<a href="#filter" class="button primary filter">Update Data</a>',
						'<img src=' + ss.urls.src + '"../../images/icon_loading.gif" class="loading">',
					'</div>',
				'</div>',
				//'<div class="content">',
				// Summary section
				'<table class="basic monitorSummary">',
					'<thead>',
						'<tr>',
							'<th style="width: 390px" colspan="5">SPM Functional</th>',
							'<th style="width: 390px" colspan="5">SPM Incoming</th>',
							'<th style="width: 390px" colspan="5">SPM Final</th>',
						'</tr>',
						'<tr>',
							'<th>Median Pass Time</th>',
							'<th>Median Fail Time</th>',
							'<th># Tested</th>',
							'<th># Failed</th>',
							'<th>Yield</th>',
							'<th>Median Pass Time</th>',
							'<th>Median Fail Time</th>',
							'<th># Tested</th>',
							'<th># Failed</th>',
							'<th>Yield</th>',
							'<th>Median Pass Time</th>',
							'<th>Median Fail Time</th>',
							'<th># Tested</th>',
							'<th># Failed</th>',
							'<th>Yield</th>',
						'</tr>',
					'</thead>',
					'<tbody></tbody>',
				'</table>',
				'<table class="basic monitorSummary">',
					'<thead>',
						'<tr>',
							'<th style="width: 390px" colspan="5">SPO Functional</th>',
							'<th style="width: 390px" colspan="5">SPO Incoming</th>',
							'<th style="width: 390px" colspan="5">SPO Final</th>',
						'</tr>',
						'<tr>',
							'<th>Median Pass Time</th>',
							'<th>Median Fail Time</th>',
							'<th># Tested</th>',
							'<th># Failed</th>',
							'<th>Yield</th>',
							'<th>Median Pass Time</th>',
							'<th>Median Fail Time</th>',
							'<th># Tested</th>',
							'<th># Failed</th>',
							'<th>Yield</th>',
							'<th>Median Pass Time</th>',
							'<th>Median Fail Time</th>',
							'<th># Tested</th>',
							'<th># Failed</th>',
							'<th>Yield</th>',
						'</tr>',
					'</thead>',
					'<tbody></tbody>',
				'</table>',
				// Test list section
				'<table class="basic tests sort">',
					'<thead>',
						'<tr>',
							'<th>Part ID</th>',
							'<th style="width: 120px">MAC</th>',
							'<th>Model</th>',
							'<th style="width: 50px">Functional</th>',
							'<th>Func. Overall</th>',
							'<th style="width: 50px">Incoming</th>',
							'<th>Inc. Overall</th>',
							'<th style="width: 50px">Final</th>',
							'<th>Fin. Overall</th>',
							'<th>Test Start</th>',
							'<th>Last Update</th>',
						'</tr>',
					'</thead>',
					'<tbody></tbody>',
				'</table>',
				//'</div>',
			'</div>'
		].join('')
	},

	tracker : {
		_init : function(options, appendToElement){
			//console.log(options, $appendToElement);
			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			this.$element = $(ss.trackers.template(this.options));//Create jQuery reference to container element
			this.element = this.$element[0];//Create dom reference to container element

			if(appendToElement){
				$(appendToElement).append(this.$element);
			}else{
				$('.container_modules').append(this.$element);
			}

			ss.dateBasic.init();

			this._addListeners();

			this._filter();
			$('table.sort').dataTable();
		},

		_filter : function(){
			this.$element.find('img.loading').hide();

			var whichModels = function(){
				var checkboxes = $('input[name=product_model]'),
					checked = [];

				$.each(checkboxes, function(index){
					if($(this).is(':checked')){
						checked.push($(this).val());
					}
				});

				return checked.join('+');
			}();

			//console.log(whichModels);

			var failedOnly = function(){
				var checkbox = $('input[name=fail_only]');
				if(checkbox.is(':checked')){
					return 'fail';
				}
				return '';
			}();

			this._getData({
				startdate : this.$element.find('input#min_date').val(),
				enddate : this.$element.find('input#max_date').val(),
				product_model : whichModels,
				status : failedOnly
			});
		},

		_getData : function(options){
			//console.log('get data', options);
			// fetch json data and set this.myData = data
			// /api/summary?API_TOKEN=ProdApp:Token_Seafoam
			var that = this;

			var myData = $.ajax({
				url: '/api/summary?start_date=' + options.startdate + '&end_date=' + options.enddate + '&product_model=' + options.product_model + '&status=' + options.status,
				cache: false,
				async: true,
				success: function(data){
					//console.log('success', data);
					var $table = that.$element.find('table.sort');

					// Clear data table
					$table.dataTable().fnClearTable(false);

					//console.log(data);
					that.testData_results = data.results;
					that.testData_summary = data.summary;
					that._populate();

					that.$element.find('img.loading').hide();

					$table.dataTable().fnDraw(true);
					$table.dataTable().fnSort([[7,'desc'],[6, 'desc']]);
				},
				error: function(data){
					//console.log('error', data);
					/*
					ss.messages({
						element: that.$element,
						type: 'error',
						content: 'Data failed to load',
						fixed: true
					});
					*/

					ss.modules.create('messages', that.$element[0], {
						type: 'error',
						content: 'Data failed to load'
					});

					that.$element.find('img.loading').hide();
				}
			});
		},

		_populate : function(){
			//console.log('populate')
			//Loop through myData and create the table rows
			var myMonitorSummary = this.$element.find('table.monitorSummary > tbody'),
				myMonitorSummary = this.$element.find('table.monitorSummary > tbody'),
				myTable = this.$element.find('table.tests > tbody');

			if(this.testData_results.length){
				// Populate summary tables
				myMonitorInfo = [
					'<tr>',
						'<td>' + this.testData_summary.spmfunctionaltest.median_pass_time + '</td>',
						'<td>' + this.testData_summary.spmfunctionaltest.median_fail_time + '</td>',
						'<td>' + this.testData_summary.spmfunctionaltest.num_tested + '</td>',
						'<td>' + this.testData_summary.spmfunctionaltest.num_failed + '</td>',
						'<td>' + this.testData_summary.spmfunctionaltest.yield + '</td>',
						'<td>' + this.testData_summary.spmincomingtest.median_pass_time + '</td>',
						'<td>' + this.testData_summary.spmincomingtest.median_fail_time + '</td>',
						'<td>' + this.testData_summary.spmincomingtest.num_tested + '</td>',
						'<td>' + this.testData_summary.spmincomingtest.num_failed + '</td>',
						'<td>' + this.testData_summary.spmincomingtest.yield + '</td>',
						'<td>' + this.testData_summary.spmfinaltest.median_pass_time + '</td>',
						'<td>' + this.testData_summary.spmfinaltest.median_fail_time + '</td>',
						'<td>' + this.testData_summary.spmfinaltest.num_tested + '</td>',
						'<td>' + this.testData_summary.spmfinaltest.num_failed + '</td>',
						'<td>' + this.testData_summary.spmfinaltest.yield + '</td>',
					'</tr>'
				];
				myMonitorInfo = [
					'<tr>',
						'<td>' + this.testData_summary.spofunctionaltest.median_pass_time + '</td>',
						'<td>' + this.testData_summary.spofunctionaltest.median_fail_time + '</td>',
						'<td>' + this.testData_summary.spofunctionaltest.num_tested + '</td>',
						'<td>' + this.testData_summary.spofunctionaltest.num_failed + '</td>',
						'<td>' + this.testData_summary.spofunctionaltest.yield + '</td>',
						'<td>' + this.testData_summary.spoincomingtest.median_pass_time + '</td>',
						'<td>' + this.testData_summary.spoincomingtest.median_fail_time + '</td>',
						'<td>' + this.testData_summary.spoincomingtest.num_tested + '</td>',
						'<td>' + this.testData_summary.spoincomingtest.num_failed + '</td>',
						'<td>' + this.testData_summary.spoincomingtest.yield + '</td>',
						'<td>' + this.testData_summary.spofinaltest.median_pass_time + '</td>',
						'<td>' + this.testData_summary.spofinaltest.median_fail_time + '</td>',
						'<td>' + this.testData_summary.spofinaltest.num_tested + '</td>',
						'<td>' + this.testData_summary.spofinaltest.num_failed + '</td>',
						'<td>' + this.testData_summary.spofinaltest.yield + '</td>',
					'</tr>'
				];

				myMonitorSummary.append(myMonitorInfo.join(''));
				myMonitorSummary.append(myMonitorInfo.join(''));

				// Populate detail table
				myTestInfo = [];
				for(var test=0, testsLength=this.testData_results.length;
						test<testsLength; test++){
					var myTest = this.testData_results[test];
					var functional_status = (myTest.functional_passed===null) ?
						'' : (myTest.functional_passed===true) ?
						'PASS' : '<b>FAIL</b>';
					var incoming_status = (myTest.incoming_passed===null) ?
						'' : (myTest.incoming_passed===true) ?
						'PASS' : '<b>FAIL</b>';
					var final_status = (myTest.final_passed===null) ?
						'' : (myTest.final_passed===true) ?
						'PASS' : '<b>FAIL</b>';
					if (myTest.functional_count > 1){
						functional_status += ' (' + myTest.functional_count + ')';
					}
					if (myTest.incoming_count > 1){
						incoming_status += ' (' + myTest.incoming_count + ')';
					}
					if (myTest.final_count > 1){
						final_status += ' (' + myTest.final_count + ')';
					}

					var functional_status_overall = (myTest.functional_passed_overall===null) ?
						'' : (myTest.functional_passed_overall===true) ?
						'PASS' : '<b>FAIL</b>';
					var incoming_status_overall = (myTest.incoming_passed_overall===null) ?
						'' : (myTest.incoming_passed_overall===true) ?
						'PASS' : '<b>FAIL</b>';
					var final_status_overall = (myTest.final_passed_overall===null) ?
						'' : (myTest.final_passed_overall===true) ?
						'PASS' : '<b>FAIL</b>';

					myTestInfoRow = [
							'<a href="/detail/' + myTest.part_id +
								'?start_date=' +
								this.$element.find('input#min_date').val() +
								'&end_date=' +
								this.$element.find('input#min_date').val() +
								'">' + myTest.part_id + '</a>',
							myTest.mac_id,
							myTest.product_model,
							functional_status,
							functional_status_overall,
							incoming_status,
							incoming_status_overall,
							final_status,
							final_status_overall,
							myTest.start_date,
							myTest.end_date
					];
					myTestInfo.push(myTestInfoRow);
				}
				$('table.sort').dataTable().fnAddData(myTestInfo);
			}else{
				myMonitorSummary.append('<tr><td colspan="12">No summary data found for selected time range</td></tr>');
				myMonitorSummary.append('<tr><td colspan="12">No summary data found for selected time range</td></tr>');
				myTable.append('<tr><td colspan="8">No test data found for selected time range</td></tr>');
			}
		},

		_addListeners : function(){
			var that = this;

			this.$element.find('a.filter').click(function(event){
				event.preventDefault();

				that.$element.find('tbody > tr').remove();

				that._filter();
			});

		},

		options : {
			sort : 'end_date',
			sort_up : false
		}
	}
}

return ss.trackers.tracker;

});//end define
