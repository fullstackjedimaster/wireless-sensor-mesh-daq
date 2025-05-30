/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

ARRAY STATUS

Author: Justin Winslow
Last updated: 08/09/2012 by Justin Winslow

*/

define( ['jquery', 'static/scripts/modules/urls', 'hovers', 'utils'], function ($, urls, hovers) {

ss.statusWidgets = {
	//myStatusWidgets : [],

	template : function(options){
		return [
			//'<div class="container ' + options.size + 'Width">',
				'<div class="module statusWidget">',
					'<div class="content">',
						'<div class="energyHistory">',
							'<table class="basic">',
								'<thead>',
									'<tr>',
										'<th>Energy</th>',
										'<th>Today</th>',
										'<th>Week to Date</th>',
										'<th>Month to Date</th>',
										'<th>Year to Date</th>',
									'</tr>',
								'</thead>',
								'<tbody>',
									'<tr class="ac">',
										'<td class="label"><span>AC</span></td>',
										'<td><span class="value_ac today">0</span> <span class="unit">kWh</span></td>',
										'<td><span class="value_ac week">0</span> <span class="unit">kWh</span></td>',
										'<td><span class="value_ac month">0</span> <span class="unit">MWh</span></td>',
										'<td><span class="value_ac year">0</span> <span class="unit">MWh</span></td>',
									'</tr>',
									'<tr class="dc">',
										'<td class="label"><span>DC</span></td>',
										'<td><span class="value today">0</span> <span class="unit">kWh</span></td>',
										'<td><span class="value week">0</span> <span class="unit">kWh</span></td>',
										'<td><span class="value month">0</span> <span class="unit">MWh</span></td>',
										'<td><span class="value year">0</span> <span class="unit">MWh</span></td>',
									'</tr>',
								'</tbody>',
							'</table>',
						'</div>',

						'<h3>Performance Ratio <span>(<a href="#description?position=right&width=300" class="link_hover" title="<p>The performance ratio is a measure of the quality of a PV plant based on actual AC energy generation compared to its theoretical potential.</p><p>AC data is <strong>required</strong> for this calculation.</p>">What\'s this?</a>)</span>',
						'</h3>',
						'<div class="status performanceRatio">',
							'<div class="floatWrapper">',
								'<div class="indicatorWrapper">',
									'<div class="indicatorContainer">',
										'<div class="indicator"></div>',
									'</div>',
									/*
									'<div class="legend">',
										'<div class="warning"><span>Warning</span></div>',
										'<div class="alert"><span>Alert</span></div>',
									'</div>',
									*/
								'</div>',
							'</div>',
							'<div class="number"><span>0%</span></div>',
						'</div>',

						'<h3>Soiling <span>(<a href="#description?position=right&width=300" class="link_hover" title="<p>Soiling measurements represent the likely impact of contaminants and other debris based on what we know about your array\'s efficiency</p>">What\'s this?</a>)</span>',
						'</h3>',
						'<div class="status efficiency">',
							'<div class="floatWrapper">',
								'<div class="indicatorWrapper">',
									'<div class="indicatorContainer">',
										'<div class="indicator"></div>',
									'</div>',
									'<div class="legend">',
										'<div class="warning"><span>Warning</span></div>',
										'<div class="alert"><span>Alert</span></div>',
									'</div>',
								'</div>',
							'</div>',
							'<div class="number"><span>0%</span> Power Loss</div>',
						'</div>',

						'<h3>Health <span>(<a href="#description?position=right&width=300" class="link_hover" title="<p>Health describes the combined impact of known array hardware issues</p>">What\'s this?</a>)</span>',
						'</h3>',
						'<div class="status health">',
							'<div class="floatWrapper">',
								'<div class="indicatorWrapper">',
									'<div class="indicatorContainer">',
										'<div class="indicator"></div>',
									'</div>',
									'<div class="legend">',
										'<div class="warning"><span>Warning</span></div>',
										'<div class="alert"><span>Alert</span></div>',
									'</div>',
								'</div>',
							'</div>',
							'<div class="number"><span>0%</span> Power Loss</div>',
						'</div>',
					'</div>',
				'</div>'//,
			//'</div>'
		]
	},

	statusWidget : {
		_init : function(options, appendToElement){
			//console.log('init status widgets');
			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			//ss.statusWidgets.myStatusWidgets.push(this);	//Make a reference to this object to be able to access its methods

			this.$element = $(ss.statusWidgets.template(options).join(''));
			this.element = this.$element[0];

			this.$element.data('module', this);

			if(appendToElement){
				$(appendToElement).append(this.$element);
			}else{
				$('.container_modules').append(this.$element);
			}

			//Create hovers
			$.each(this.$element.find('.link_hover'), function(index){
				ss.modules.create('hovers', {
					position: 'right',
					width: 300,
					content: $(this).attr('title'),
					attachTo: this
				});

				$(this).removeAttr('title');
			});

			this._energyHistory();
			this._run();
			this._addListeners();
		},

		_energyHistory : function(){
			var that = this;

			var myData = $.ajax({
				url: ss.urls.energyHistory,
				cache: false,
				async: true,
				success: function(data){
				//console.log(data)
					var myEl = $('.energyHistory');

					/* Set whether or not ac/dc data is available to test against */
					that.hasDCData = (data.commissioned_to_date === null)?false:true;
					that.hasACData = (data.ac_commissioned_to_date === null)?false:true;

					/* Store snapshot energy history data */
					that.myToday = data.today / 1000,
					that.myWeek = data.week_to_date / 1000,
					that.myMonth = data.month_to_date / 1000000,
					that.myYear = data.year_to_date / 1000000;

					that.myToday_ac = data.ac_today / 1000,
					that.myWeek_ac = data.ac_week_to_date / 1000,
					that.myMonth_ac = data.ac_month_to_date / 1000000,
					that.myYear_ac = data.ac_year_to_date / 1000000;

					//console.log(roundNumber(that.myWeek, 1))

					/* Display dc energy history values */
					myEl.find('span.value.today').text(roundNumber(that.myToday, 1));
					myEl.find('span.value.week').text(roundNumber(that.myWeek, 1));
					myEl.find('span.value.month').text(roundNumber(that.myMonth, 2));
					myEl.find('span.value.year').text(roundNumber(that.myYear, 2));

					/* If ac data is available populate the table, else add disabled class to table row */
					if(that.hasACData){
						myEl.find('span.value_ac.today').text(roundNumber(that.myToday_ac, 1));
						myEl.find('span.value_ac.week').text(roundNumber(that.myWeek_ac, 1));
						myEl.find('span.value_ac.month').text(roundNumber(that.myMonth_ac, 2));
						myEl.find('span.value_ac.year').text(roundNumber(that.myYear_ac, 2));
					}else{
						myEl.find('tr.ac').addClass('disabled');
					}


					/*
					$('.energyHistory').find('li.week span.value').text(roundNumber(that.myWeek, 1));
					$('.energyHistory').find('li.month span.value').text(roundNumber(that.myMonth, 2));
					$('.energyHistory').find('li.year span.value').text(roundNumber(that.myYear, 2));
					*/


					if($('.module.resources').length){
						that.resources();
					}
				}
			});
		},

		resources : function(){
			//console.log('resources');
			var that = this,
				resources = ['oil', 'trees', 'water'],
				unitLabels = ['Gallons of oil', 'Trees', 'Gallons of H20'],
				amount = [roundNumber((that.myYear*27.3), 0), roundNumber((that.myYear*3.75), 0), roundNumber((that.myYear*230), 0)],
				current = 0;

			var changeResource = function(which){
				//console.log('change resource');
				$('.module.resources').find('.icon').removeClass(resources[current]);

				if(current === (resources.length - 1)){
					current = 0;
				}else{
					current++;
				}
				//console.log(amount[current] > 999)
				var ornamentalAmountValue = (amount[current] > 999)?roundNumber((amount[current]/1000), 1) + 'K': amount[current];

				$('.module.resources').find('.icon').addClass(resources[current]);
				$('.module.resources').find('.number').text(ornamentalAmountValue);
				$('.module.resources').find('.resource').text(unitLabels[current]);
			}

			changeResource();

			var changeResourceInterval = setInterval(changeResource, 15000);
		},

		_run : function(){
		//console.log('array status');
			var that = this;

			var myDay, myWeek, myMonth, myYear;

			$.ajax({
				url: ss.urls.status,
				cache: false,
				success: function(data){
					var performance = (data.perf_ratio === null || data.perf_ratio === 'null')? 100 : Math.round(data.perf_ratio),
					    //performanceWarning = data.cleanlinessWarning,
					    //performanceAlert = data.cleanlinessProblem,

					    soiling = (data.cleanliness === null || data.cleanliness === 'null')? 100 : Math.round(data.cleanliness),
					    soilingWarning = data.cleanlinessWarning,
					    soilingAlert = data.cleanlinessProblem,

					    health = (data.health === null || data.health === 'null')? 100 : Math.round(data.health),
					    healthWarning = data.healthWarning,
					    healthAlert = data.healthProblem,

					    myEl_perf = $('.status.performanceRatio'),
					    myEl_eff = $('.status.efficiency'),
					    myEl_health = $('.status.health');

					/* Draw performance indicator */
					if(data.perf_ratio){
						myEl_perf.find('.indicator').animate({
							width : (performance > 100)?'100%':performance + '%'
						});

						myEl_perf.find('.number span').text((performance) + '%');
					}else{
						myEl_perf.addClass('disabled');
						myEl_perf.find('.number span').text('n/a');
					}

					/* Draw efficiency indicator */
					if(data.cleanliness){
						myEl_eff.find('.indicator').animate({
							width : (soiling > 100)?'100%':soiling + '%'
						});

						myEl_eff.find('.number span').text((100 - soiling) + '%');

						if(soilingWarning > 0){
							if((100 - data.cleanliness) > soilingAlert){
								myEl_eff.find('.indicator').addClass('alert');
							}else if((100 - data.cleanliness) > soilingWarning){
								myEl_eff.find('.indicator').addClass('warning');
							}

							//$('.status.efficiency').find('.legend .warning').width(soilingWarning + '%');
							myEl_eff.find('.legend .warning').css({
								width : (soilingAlert - soilingWarning) + '%',
								'margin-right' : soilingWarning + '%'
							});
						}else{
							myEl_eff.find('.legend div').hide();
						}
					}

					//if(soilingAlert){
					//	$('.status.efficiency').find('.legend .alert').width(soilingAlert + '%');
					//}

					/* Draw health indicator */
					if(data.health){
						myEl_health.find('.indicator').animate({
							width : (health > 100)?'100%':health + '%'
						});

						myEl_health.find('.number span').text((100 - health) + '%');

						if(healthWarning > 0){
							if((100 - data.health) > healthAlert){
								myEl_health.find('.indicator').addClass('alert');
							}else if((100 - data.health) > healthWarning){
								myEl_health.find('.indicator').addClass('warning');
							}

							myEl_health.find('.legend .warning').css({
								width : (healthAlert - healthWarning) + '%',
								'margin-right' : healthWarning + '%'
							});
						}else{
							myEl_health.find('.legend div').hide();
						}
					}

					//if(healthAlert){
					//	$('.status.health').find('.legend .alert').width(healthAlert + '%');
					//}

				}
			});
		},

		update : function(){
			//console.log('update');
			this._energyHistory();
		},

		_addListeners : function(){
			var that = this;

			$(document).bind('updateModules.statusWidgets', function(){
				that.update();
			});
		}
	}
}

return ss.statusWidgets.statusWidget;

});//end define