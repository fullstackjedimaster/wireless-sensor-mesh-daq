/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*

DEVICES OBJECT

Author: Justin Winslow
Last updated: 06/26/2012 by Justin Winslow

*/

define( ['jquery', 'static/scripts/modules/urls'], function ($, urls) {

ss.devices = {}

ss.devices.device = {
	isChildOf: function(deviceId){
		//console.log(this, deviceId);
		var isChild = false;

		if(this.parentNodes){
			for(var parent in this.parentNodes){
				if(this.parentNodes[parent][0] === deviceId){
					isChild = true;
					break;
				}
			}
		}

		return isChild;
	},
	isParentOf: function(deviceId){
		//console.log(this, deviceId);
		var isParent = false,
			parentNodes = ss.devices.allNodesById[deviceId].parentNodes;

		if(parentNodes){
			for(var parent in parentNodes){
				if(parentNodes[parent][0] === this.id){
					isParent = true;
					break;
				}
			}
		}

		return isParent;
	}
}

ss.devices.dataDefer = $.ajax({
	url: ss.urls.getDevices,
	cache: false,
	success: function(data){
		ss.devices.allData = data;//Store the entire site data object

		//ss.myDevices = {}//Create an object for quickly finding nodes

		/* Add array of DC device types */
		ss.devices.nodeTypes = data.sitearray.devtypes.split(',');
		ss.devices.nodeTypes[0].replace(' ', '');//Remove space from 'Site Array'

		/* Build device dictionaries */
		if(data.sitearray && data.sitearray.inputs){
			//ss.myDevices.allNodes = [];//This ought to be deprecated now
			ss.devices.allNodesById = {};//Create a dictionary of all nodes using their ID
			ss.devices.allNodesByType = {};//Create a dictionary of all nodes using their Type

			var mySiteArray = Object.create(ss.devices.device);
			$.extend(mySiteArray, {//Add Site Array node manually
				id : data.sitearray.id,
				label : data.sitearray.label,
				inputs : data.sitearray.inputs,
				devtype : 'SiteArray',
				shapes : data.sitearray.shapes,
				childNodeCount : {}
			});

			for(var nodeType=0, nodeTypesLength=ss.devices.nodeTypes.length; nodeType<nodeTypesLength; nodeType++){
				var myNodeType = ss.devices.nodeTypes[nodeType].toLowerCase();

				if(myNodeType !== 'site array'){
					mySiteArray.childNodeCount[myNodeType] = +ss.devices.allData.sitearray[myNodeType + 's'];
				}
			}

			ss.devices.allNodesByType.SiteArray = mySiteArray;
			ss.devices.allNodesById[data.sitearray.id] = mySiteArray;

			//ss.myDevices.allNodes.push(ss.myDevices.SiteArray);

			/* Start arbitrary discovery of deice hierarchy */
			var inputs = data.sitearray.inputs;

			for(var a=0, inputsLength=inputs.length; a<inputsLength; a++){
				var device_a = Object.create(ss.devices.device);
				$.extend(device_a, inputs[a]);

				/* Check if dev type is available and if not create a new array */
				if(!ss.devices.allNodesByType[inputs[a].devtype.replace(/\//g,'')]){
					ss.devices.allNodesByType[inputs[a].devtype.replace(/\//g,'')] = [];
				}

				//Add parent hierarchy
				device_a.parentNodes = {}
				device_a.parentNodes['SiteArray'] = [data.sitearray.id, data.sitearray.label];

				var aInputs = inputs[a].inputs;

				if(aInputs && aInputs.length>0){
					//Add child node counts
					device_a.childNodeCount = {};
					device_a.childNodeCount[aInputs[0].devtype] = aInputs.length;

					for(var b=0, aInputsLength=aInputs.length; b<aInputsLength; b++){
						var device_b = Object.create(ss.devices.device);
						$.extend(device_b, aInputs[b]);

						if(!ss.devices.allNodesByType[aInputs[b].devtype.replace(/\//g,'')]){
							ss.devices.allNodesByType[aInputs[b].devtype.replace(/\//g,'')] = [];
						}

						//Add parent hierarchy
						device_b.parentNodes = {}
						device_b.parentNodes['SiteArray'] = [data.sitearray.id, data.sitearray.label];
						device_b.parentNodes[inputs[a].devtype.replace(/\//g,'')] = [inputs[a].id, inputs[a].label];

						var bInputs = aInputs[b].inputs;

						if(bInputs && bInputs.length>0){
							//Add child node counts
							if(!device_a.childNodeCount[bInputs[0].devtype]){
								device_a.childNodeCount[bInputs[0].devtype] = bInputs.length
							}else{
								device_a.childNodeCount[bInputs[0].devtype] = device_a.childNodeCount[bInputs[0].devtype] + bInputs.length;
							}

							device_b.childNodeCount = {};
							device_b.childNodeCount[bInputs[0].devtype] = bInputs.length;

							for(var c=0, bInputsLength=bInputs.length; c<bInputsLength; c++){
								var device_c = Object.create(ss.devices.device);
								$.extend(device_c, bInputs[c]);

								if(!ss.devices.allNodesByType[bInputs[c].devtype.replace(/\//g,'')]){
									ss.devices.allNodesByType[bInputs[c].devtype.replace(/\//g,'')] = [];
								}

								device_c.parentNodes = {}
								device_c.parentNodes['SiteArray'] = [data.sitearray.id, data.sitearray.label];
								device_c.parentNodes[inputs[a].devtype.replace(/\//g,'')] = [inputs[a].id, inputs[a].label];
								device_c.parentNodes[aInputs[b].devtype.replace(/\//g,'')] = [aInputs[b].id, aInputs[b].label];

								var cInputs = bInputs[c].inputs;

								if(cInputs && cInputs.length>0){
									//Add child node counts
									if(!device_a.childNodeCount[cInputs[0].devtype]){
										device_a.childNodeCount[cInputs[0].devtype] = cInputs.length
									}else{
										device_a.childNodeCount[cInputs[0].devtype] = device_a.childNodeCount[cInputs[0].devtype] + cInputs.length;
									}

									if(!device_b.childNodeCount[cInputs[0].devtype]){
										device_b.childNodeCount[cInputs[0].devtype] = cInputs.length
									}else{
										device_b.childNodeCount[cInputs[0].devtype] = device_b.childNodeCount[cInputs[0].devtype] + cInputs.length;
									}

									device_c.childNodeCount = {};
									device_c.childNodeCount[cInputs[0].devtype] = cInputs.length;

									for(var d=0, cInputsLength=cInputs.length; d<cInputsLength; d++){
										var device_d = Object.create(ss.devices.device);
										$.extend(device_d, cInputs[d]);

										if(!ss.devices.allNodesByType[cInputs[d].devtype.replace(/\//g,'')]){
											ss.devices.allNodesByType[cInputs[d].devtype.replace(/\//g,'')] = [];
										}

										device_d.parentNodes = {}
										device_d.parentNodes['SiteArray'] = [data.sitearray.id, data.sitearray.label];
										device_d.parentNodes[inputs[a].devtype.replace(/\//g,'')] = [inputs[a].id, inputs[a].label];
										device_d.parentNodes[aInputs[b].devtype.replace(/\//g,'')] = [aInputs[b].id, aInputs[b].label];
										device_d.parentNodes[bInputs[c].devtype.replace(/\//g,'')] = [bInputs[c].id, bInputs[c].label];

										//ss.devices.allNodesByType.allNodes.push(device_d);


										var dInputs = cInputs[d].inputs;

										if(dInputs && dInputs.length>0){
											//Add child node counts
											if(!device_a.childNodeCount[dInputs[0].devtype]){
												device_a.childNodeCount[dInputs[0].devtype] = dInputs.length
											}else{
												device_a.childNodeCount[dInputs[0].devtype] = device_a.childNodeCount[dInputs[0].devtype] + dInputs.length;
											}

											if(!device_b.childNodeCount[dInputs[0].devtype]){
												device_b.childNodeCount[dInputs[0].devtype] = dInputs.length
											}else{
												device_b.childNodeCount[dInputs[0].devtype] = device_b.childNodeCount[dInputs[0].devtype] + dInputs.length;
											}

											if(!device_c.childNodeCount[dInputs[0].devtype]){
												device_c.childNodeCount[dInputs[0].devtype] = dInputs.length
											}else{
												device_c.childNodeCount[dInputs[0].devtype] = device_c.childNodeCount[dInputs[0].devtype] + dInputs.length;
											}

											device_d.childNodeCount = {};
											device_d.childNodeCount[dInputs[0].devtype] = dInputs.length;

											for(var e=0, dInputsLength=dInputs.length; e<dInputsLength; e++){
												var device_e = Object.create(ss.devices.device);
												$.extend(device_e, dInputs[e]);

												if(!ss.devices.allNodesByType[dInputs[e].devtype.replace(/\//g,'')]){
													ss.devices.allNodesByType[dInputs[e].devtype.replace(/\//g,'')] = [];
												}

												device_e.parentNodes = {}
												device_e.parentNodes['SiteArray'] = [data.sitearray.id, data.sitearray.label];
												device_e.parentNodes[inputs[a].devtype.replace(/\//g,'')] = [inputs[a].id, inputs[a].label];
												device_e.parentNodes[aInputs[b].devtype.replace(/\//g,'')] = [aInputs[b].id, aInputs[b].label];
												device_e.parentNodes[bInputs[c].devtype.replace(/\//g,'')] = [bInputs[c].id, bInputs[c].label];
												device_e.parentNodes[cInputs[d].devtype.replace(/\//g,'')] = [cInputs[d].id, cInputs[d].label];

												//ss.devices.allNodesByType.allNodes.push(device_e);
												ss.devices.allNodesById[device_e.id] = device_e;
												ss.devices.allNodesByType[device_e.devtype.replace(/\//g,'')].push(device_e)
											}
										}

										ss.devices.allNodesById[device_d.id] = device_d;
										ss.devices.allNodesByType[device_d.devtype.replace(/\//g,'')].push(device_d);
									}
								}

								ss.devices.allNodesById[device_c.id] = device_c;
								ss.devices.allNodesByType[device_c.devtype.replace(/\//g,'')].push(device_c);
							}
						}

						ss.devices.allNodesById[device_b.id] = device_b;
						ss.devices.allNodesByType[aInputs[b].devtype.replace(/\//g,'')].push(device_b);
					}
				}

				ss.devices.allNodesById[device_a.id] = device_a;
				ss.devices.allNodesByType[device_a.devtype.replace(/\//g,'')].push(device_a);
			}
		}
	},
	error: function(){
		throw 'Device data failed to load';
	}
});

return ss.devices;

});//end define