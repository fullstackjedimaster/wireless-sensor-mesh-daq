/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

SITE OVERVIEW PORTFOLIOS

Author: Justin Winslow
Last updated: 08/10/2012 by Justin Winslow

*/

define( ['jquery', 'static/scripts/modules/urls', 'dataTables', 'utils'], function ($) {

ss.portfolios = {
	//myPortfolios : [],

	template : function(options){
		return [
			'<table class="basic portfolio sort">',
				'<thead>',
					'<tr>',
						'<th>Site</th>',
						'<th>Status</th>',
						'<th>Energy YTD (in MWh)</th>',
						'<th>Soiling Loss (%)</th>',
						'<th>Health Loss (%)</th>',
						'<th>Perf Ratio (%)</th>',
						'<th>DC Nameplate (in kWp)</th>',
						'<th>Actions</th>',
					'</tr>',
				'<thead>',
				'<tbody></tbody>',
			'</table>'
		]
	},

	portfolio : {
		_init : function(options, appendToElement){
			//console.log('portfolio init', options, $appendToElement, this);

			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			this.$element = $(ss.portfolios.template(options).join(''));
			this.element = this.$element[0];

			if(appendToElement){
				$(appendToElement).append(this.$element);
			}else{
				$('.container_modules').append(this.$element);
			}

			this._getData();

			var that = this;

			this.$dfr.done(function(){
				that.$element.dataTable({
				    "bPaginate": false,
				    "bInfo": false
				});
			});

			var update = function(){
				that._getData();
			}

			this._updateInterval = setInterval(update, 300000)
		},

		_getData : function(){
			//console.log('get data');
			var that = this,
				sites = '';

			for(var site=0, sitesLength=this.options.sites.length; site<sitesLength; site++){
				var mySite = this.options.sites[site];

				sites = (sites.length === 0)?mySite.callsign : sites + ',' + mySite.callsign;
			}

			this.$dfr = $.ajax({
				url: ss.urls.portfolioData + sites,
				type: 'GET',
				cache: false,
				async: true,
				success: function(data){
					//console.log('success', data);
					//Store data
					that.siteData = data.portfolio_data;
					//Populate dom element

					that._populateTable();
				},
				error: function(data){
					//console.log('error', data);
					that.$element.find('tbody').append('<tr><td colspan="6"><span class="message error">Data failed to load</span></td></tr>')
				}
			});
		},

		_populateTable : function(){
			//console.log('populate table');
			var myEl = this.$element.find('tbody');

			for(site in this.options.sites){
				//console.log(site, this.options.sites[site]);
				var mySite = this.options.sites[site],
				mySiteData = this.siteData[mySite.callsign],
				siteName = mySite.name,
				noData = '<span class="noData">No data</span>',

				energyYTD = (!mySiteData.energy_YTD)?noData:(mySiteData.energy_YTD === 'TBD')?'TBD' : roundNumber((mySiteData.energy_YTD/1000000), 1),
				soiling = (!mySiteData.cleanliness)?noData : roundNumber(mySiteData.cleanliness, 1),
				health = (!mySiteData.health)?noData : roundNumber(mySiteData.health, 1),
				perfRatio = (!mySiteData.performance_ratio)?noData : (mySiteData.performance_ratio === 'N/A')?'<span class="disabled">n/a</span>':roundNumber(mySiteData.performance_ratio, 0),
				DCNameplate = (!mySiteData.DC_nameplate)?noData : (mySiteData.DC_nameplate === 'TBD')?'TBD':mySiteData.DC_nameplate,
				siteInfo = (ss.user.role === 'S')?'<a href="' + mySite.detailsURL + '" class="button secondary">Superuser Site Info</a>' : '',
				liveSite = (ss.user.role === 'K')?
					(mySite.url.length)?'<a href="' + mySite.url + '/ss/kiosk/' + mySite.callsign + '" class="button secondary">View Kiosk</a>':'<a href="#" class="button secondary disabled">View Kiosk</a>':
					(mySite.url.length)?'<a href="' + mySite.url + '/ss/setarray/' + mySite.callsign + '" class="button primary">View Live Site</a>':'<a href="#" class="button primary disabled">View Live Site</a>';
				//console.log(mySite.url, mySite.url.length)
				//console.log(mySite, this.siteData, mySiteData);

				var issueLevel = function(){
					switch(mySiteData.issue_level){
						case 'Data Collection Down':
							return '<span class="value alert">5 ' + mySiteData.issue_level + '</span>';
							break;
						case 'Emergency':
							return '<span class="value alert">6 ' + mySiteData.issue_level + '</span>';
							break;
						case 'Serious':
							return '<span class="value warning">3 ' + mySiteData.issue_level + '</span>';
							break;
						case 'Problem':
							return '<span class="value ss">4 ' + mySiteData.issue_level + '</span>';
							break;
						case 'Warning':
							return '<span class="value warning">2 ' + mySiteData.issue_level + '</span>';
							break;
						case 'Notice':
							return '<span class="value info">1 ' + mySiteData.issue_level + '</span>';
							break;
						default: return '<span class="value">0 OK</span>';
					}
				}();

				if(!$('tr#site_' + site).length){
					myEl.append([
						'<tr id="site_' + site + '">',
							'<td class="siteName"><a href="' + mySite.url + '/ss/setarray/' + mySite.callsign + '">' + siteName + '</a></td>',
							'<td class="issueLevel">' + issueLevel + '</td>',
							'<td class="energyYTD">' + energyYTD + '</td>',
							'<td class="soiling">' + soiling + '</td>',
							'<td class="health">' + health + '</td>',
							'<td class="perfRatio">' + perfRatio + '</td>',
							'<td class="DCNameplate">' + DCNameplate + '</td>',
							'<td class="actions">' + liveSite + siteInfo + '</td>',
						'</tr>'
					].join(''));
				}else{
					myTR = $('tr#site_' + site);

					myTR.find('td.issueLevel').html(issueLevel);
					myTR.find('td.energyYTD').html(energyYTD);
					myTR.find('td.perfRatio').html(perfRatio);
				}
			}
		},

		_update : function(){

		},

		options : {
			sites : ''
		}
	}
}

return ss.portfolios.portfolio;

});//end define