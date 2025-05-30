/*

	LAYOUT

*/

define( ['jquery', 'jquery-helpers'], function ($) {

ss.layouts = {
	windowWidth : function(){
		return $(window).width();   
	},  
	windowHeight : function(){
		return $(window).height();  
	},  
	documentHeight : function(){
		return $(document).width(); 
	},  
	documentWidth : function(){
		return $(document).height();
	},

	fullHeight : function(){
		//console.log('full height', this);
		var that = this;

		this.$element.show();

		//var myPosition = this.$element.offset();

		this.$element.css({
			'height' : ss.layouts.windowHeight() - 100
		});

		var childModule = this.$element.children('.content');
		
		if(childModule){
			childModule.show();

			childModule.css({
				'height' : ss.layouts.windowHeight() - 100
			});
		}
	},
	
	columnFixedWidth : 240, //Define width of left fixed column
	padding : 24, //Set padding for in between elements
	
	/* DEPRECATED - CSS Solution has replaced this
	doPositionColumns : function(){
		var columnFluidWidth = Math.max((this.windowWidth() - ss.layout.columnFixedWidth), 720);
		
		$('.column_fluid')
			.css({
				'width' : columnFluidWidth
			});
		
		$(window).smartresize(function(){
			ss.layout.doPositionColumns();
		});
	},
	*/

	layout : {
		init : function(element, options){
			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			this.$element = $(element);
			this.element = element;
			//console.log(this.options);
			this.run();
			this._addListeners();
		},
		run : function(){
			//console.log('layout run');
			for(var layoutType=0, layoutTypesLength=this.options.layoutTypes.length; layoutType<layoutTypesLength; layoutType++){
				var myLayoutType = this.options.layoutTypes[layoutType];
				//console.log(this[myLayoutType]);
				this[myLayoutType]();
			}
		},
		_addListeners: function(){
			var that = this;

			$(window).smartresize(function(){
				that.run();
			});
		},
		options: {
			layoutTypes: []
		}
	},
	
	create : function(element, options){
		var myModule = Object.create(ss.layouts.layout);
		//console.log('create', element, options);
		
		if(options && options.layoutTypes){
			//console.log('has layout options');
			for(var layoutType=0, layoutTypesLength=options.layoutTypes.length; layoutType<layoutTypesLength; layoutType++){
				var myLayoutType = options.layoutTypes[layoutType];
				//console.log('append -', myLayoutType);
				myModule[myLayoutType] = ss.layouts[myLayoutType];
			}
		}
		
		myModule.init(element, options);
		
		$(element).data('myInfo', myModule);
		/* DEPRECATED - CSS Solution has replaced this
		if($('.column_group').length && $('.column_fluid').length){ss.layout.doPositionColumns()}
			*/
		/*if($('.fullHeight').length){
			this.fillVertically()

			
		}*/
	},

	find: function(){
		//console.log('layout find');
		$.each($('.fullHeight'), function(index){
			ss.layouts.create(this, {layoutTypes: ['fullHeight']})
		});
	}
}

return ss.layouts.layout;

});//end define