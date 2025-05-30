define( [], function () {
	var urls = {};
	
	ss.cubeServerURL = (window.Sentalis)?'/projects/' + Sentalis.currentProject.id + '/spti':'';

	//Build URLs dictionary at run time
	urls = {//API URLs
		issues: ss.cubeServerURL + '/ss/issue.json/', // GET
		faults: ss.cubeServerURL + '/ss/fault.json/', // GET
		alerts: ss.cubeServerURL + '/ss/alert.json/', // GET
		heatMap: ss.cubeServerURL + '/ss/panel_power_heat_map/',  // GET A (absolute power), N (relative power), R (reports)

		status: ss.cubeServerURL + '/ss/last_known_array_efficiency/', //Array status for summary page
		energyHistory: ss.cubeServerURL + '/ss/energy_history/', //Multi step energy history info

		getDevices: ss.cubeServerURL + '/ss/devices.json/',   // GET

		setDate: ss.cubeServerURL + '/ss/date_range/', //POST ?min_date=2012-XX-XX&max_date=2012-XX-XX

		portfolioData: ss.cubeServerURL + '/update_home/', //POST ?portfolio_data=CALLSIGN,CALLSIGN

		arrayLosses: ss.cubeServerURL + '/ss/array_perf_baseline/', //GET
		arrayPowerHistory: ss.cubeServerURL + '/ss/array_power_history/', //GET
		timelineDataEnv: ss.cubeServerURL + '/ss/env_timeline/', // GET
		timelineDataArray: ss.cubeServerURL + '/ss/arrayavg_timeline/', // GET
		timelineDataDevice: ss.cubeServerURL + '/ss/device_timeline/' // GET
	}

	urls.src = (window.Sentalis)?'/assets/spti/':document.getElementsByTagName('script')[0].src.replace('scripts/require.js', '');

	ss.urls = urls;

	return urls;
});