define(['utils'], function(){

ss.modules = {//Modules for dependency management
	create: function(){
		//console.log('create module', arguments);
		var that = this,
			args = arguments, 
			module, options, element, callback;

		//Loop through arguments and assign each to it's proper variable
		for(var arg=0, argsLength=args.length; arg<argsLength; arg++){
			var myArg = args[arg];

			if(typeof(myArg) === 'string'){
				module = myArg;
			}else if(typeof(myArg) === 'function'){
				callback = myArg;
			}else if(myArg && myArg.nodeName){
				element = myArg;
			}else if(typeof(myArg) === 'object'){	
				options = myArg
			}else{
				throw 'argument is not valid - ' + typeof myArg; 
			}
		}

		//Make sure a module was included in the arguments
		if(module){
			//Run require
			require([module], function(theModule){
				//If a properly formed module is returned, run init stuff
				if(theModule){
					var myOptions, myModule;
				
					myOptions = options || {};

					//If id is not supplied with the object, create a unique id for the element
					if(!myOptions.id){
						var uniqueId = Math.floor(
			                Math.random() * 0x10000 /* 65536 */
			            ).toString(16);
						
						myOptions.id = module + '_' + uniqueId;
					}

					//Instantiate the module
					myModule = Object.create(theModule);

					//Run module init
					myModule._init(myOptions, element);

					//Fire callback function if supplied
					if(callback){
						callback(myModule);
					}
				}else{
					throw 'No module returned';
				}
			});
		}else{
			throw "No module type provided";
		}
	}
}

return ss.modules;

});