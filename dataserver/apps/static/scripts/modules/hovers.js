define( ['jquery'], function ($) {

ss.hovers = {
	//myHovers : [],//Store hover instances for reference

	hover : {
		_init : function(options){
			//console.log('init');

			this.options = $.extend({}, this.options, options);	//Merge paramaters objects

			//ss.hovers.myHovers.push(this);   //Make a reference to this object to be able to access its methods

			this.element = this.options.attachTo;
			this.$element = $(this.options.attachTo);

			this._build();

			this._active = false;

			this._addListeners();
		},
		
		_build : function(content){
			this.myHover = $('<div class="hover"><div class="content"></div></div>');
			this.myHover.children('.content').append(this.options.content);
			
			this.myHover.css({
				display: 'none',
				width: this.options.width,
				height: this.options.height,
				opacity: .8
			});//.appendTo('body');
		},

		update: function(content){
			this.options.content = content;
			this.myHover.find('.content').html(content);
		},

		show : function(){
			$('body').append(this.myHover);
			this._position();
			this.myHover.fadeIn(250);
			this._active = true;
		},

		hide : function(){
			this.myHover.fadeOut(250).queue(function(){
				$(this).remove();
			});
			this._active = false;
		},
		
		_position : function(x, y, hoveredWidth, hoveredHeight, position){
			//console.log('position');

			var hoveredPosition = this.$element.offset(),
				hoveredHeight = this.$element.height(),
				hoveredWidth = this.$element.width(),
				pointerHeight = 6;

			//console.log('w - ' + hoveredWidth);
			//console.log('h - ' + hoveredHeight);

			if(this.options.followMouse){
				this.myHover.css({
					'background' : 'url(' + ss.urls.src + 'images/sprite_hoverArrow.png) center bottom no-repeat',
					'padding-bottom' : pointerHeight,
					'left' : hoveredPosition.left + hoveredWidth/2 - this.myHover.width()/2,
					'top' : hoveredPosition.top - hoveredHeight - (pointerHeight + 1) //1 more than the height of the pointer to prevent incidental hovering
				});
			}else{
				var top = {
					'background' : 'url(' + ss.urls.src + 'images/sprite_hoverArrow.png) center bottom no-repeat',
					'padding-bottom' : 6,
					'left' : hoveredPosition.left + hoveredWidth/2 - this.myHover.width()/2,
					'top' : hoveredPosition.top - hoveredHeight - 6
				}       
				var bottom = {
					'background' : 'url(' + ss.urls.src + 'images/sprite_hoverArrow.png) center 0 no-repeat',
					'padding-top' : 6,
					'left' : hoveredPosition.left + hoveredWidth/2 - this.myHover.width()/2,
					'top' : hoveredPosition.top + hoveredHeight + 6
				}
				var left = {
					'background' : 'url(' + ss.urls.src + 'images/sprite_hoverArrow.png) right center no-repeat',
					'padding-right' : 6,
					'left' : hoveredPosition.left - this.myHover.width() - 6,
					'top' : hoveredPosition.top + hoveredHeight/2 - this.myHover.height()/2
				}
				var right = {
					'background' : 'url(' + ss.urls.src + 'images/sprite_hoverArrow.png) left center no-repeat',
					'padding-left' : 6,
					'left' : hoveredPosition.left + hoveredWidth + 6,
					'top' : hoveredPosition.top + hoveredHeight/2 - this.myHover.height()/2
				}

				//console.log(this.options.position);
				
				if(this.options.position == 'top' || this.options.position == 't'){
					this.myHover.css(top);
				}else if(this.options.position == 'bottom' || this.options.position == 'b'){
					this.myHover.css(bottom);
				}else if(this.options.position == 'left' || this.options.position == 'l'){
					this.myHover.css(left);
				}else if(this.options.position == 'right' || this.options.position == 'r'){
					this.myHover.css(right);
				}//else if(position == '' || position == null || position == 'auto'){
					//Do automatic positioning
				//}
			}
		},
		
		_addListeners : function(){
			var that = this,
				hideTimer,
				hideHover = function(){//Function to fire on timeout
					that.hide();
				};

			if(this.options.followMouse){
				this.$element.mousemove(function(e){
					if(that._active){
						that.myHover.css({
							left: e.pageX - that.myHover.width()/2,
							top: e.pageY - that.myHover.height() - 6
						});
					}
				});
			}

			this.$element.hover(//Build hover content from anchor title attribute
				function(event){
					//console.log('show');
					clearTimeout(hideTimer);
					that.show();
					hideTimer = setTimeout(hideHover, 60000);
				},
				
				function(event){
					//console.log('hide');
					hideTimer = setTimeout(hideHover, 250);//Set timeout

					that.myHover.hover(//If the hover content is hovered over clear the timeout
						function(event){
							$(this).animate({opacity: 1});
							clearTimeout(hideTimer);
						},

						function(event){
							$(this).animate({opacity: .8});
							hideTimer = setTimeout(hideHover, 250);
						}
					);
					
				}
			);

			this.$element.click(function(event){//Build hover content from anchor title attribute
				event.preventDefault();
			});
		},

		options : {
			position : 'bottom',
			content : 'Loading...',
			width : null,
			height : null,
			followMouse: false
		}
	}
}

return ss.hovers.hover;

});//end define