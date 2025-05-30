/**
 * @preserve Copyright 2013 Draker - Pats Pending
 */

/*
 *
 * DATE CONTROLS
 *
 * Author: Justin Winslow
 * Last updated: 08/21/2012 by Justin Winslow
 *
 * Dependencies:
 * datepicker.js
 *
*/
define( ['jquery', 'datepicker'], function ($, DatePicker) {

ss.dates = {
	today : new Date(),

	min : function(format){
		var myDate = ($('input[name=min_date]').length && $('input[name=min_date]').val())?
			$('input[name=min_date]').val().split('-'):
			[this.today.getFullYear(), (this.today.getMonth() + 1), this.today.getDate()];

		if(format === 'UTC' || format === 'utc'){
			return Date.UTC(+myDate[0], (+myDate[1]-1), +myDate[2]);
		}else{
			return myDate[0] + '-' + myDate[1] + '-' + myDate[2];
		}
	},

	max : function(format){
		var myDate = ($('input[name=max_date]').length && $('input[name=max_date]').val())?
			$('input[name=max_date]').val().split('-'):
			[this.today.getFullYear(), (this.today.getMonth() + 1), this.today.getDate()];

		if(format === 'UTC' || format === 'utc'){
			return Date.UTC(+myDate[0], (+myDate[1]-1), +myDate[2]);
		}else{
			return myDate[0] + '-' + myDate[1] + '-' + myDate[2];
		}
	},

	template : function(options){
		if(options.type === 'advanced'){
			return [
				'<div class="dateSelection">',
					'<form id="dateSelection_' + options.id + '" name="dateSelection_' + options.id + '">',
						'<ul class="dateRangeSelection">',
							'<li><a href="#week" class="dateRange">Week</a></li>',
							'<li><a href="#3day" class="dateRange">3 Day</a></li>',
							'<li><a href="#yesterday" class="dateRange">Yesterday</a></li>',
							'<li><a href="#today" class="dateRange">Today</a></li>',
						'</ul>',
						'<a class="btn_selectDate"></a>',
						'<input type="hidden" name="min_date" value="">',
						'<input type="hidden" name="max_date" value="">',
						'<div class="calendar"></div>',
					'</form>',
				'</div>'
			].join('')
		}
	},

	date : {
		_init : function(options, el){
			//Merge options objects
			this.options = $.extend({}, this.options, options);

			//Create and store DOM reference
			this.$element = $(ss.dates.template(this.options));
			this.element = this.$element[0];

			//Add module interface elements to DOM
			if(el){
				$(el).append(this.$element);
			}else{
				$('.container_modules').append(this.$element);
			}

			//Store active state
			this.active = false;

			//Store initial min and max date
			this.dateMin = options.dateMin || ss.dates.min();
			this.dateMax = options.dateMax || ss.dates.max();

			//Set inputs to appropriate dates
			$('input[name$="min_date"]').val(this.dateMin);
			$('input[name$="max_date"]').val(this.dateMax);

			//Set dropdown text to current date
			this.$element.find('.btn_selectDate').text(this.dateMin + ' - ' + this.dateMax);

			var that = this;

			//Initialize datepicker object
			this.$calendar = $('.dateSelection .calendar').DatePicker({
				flat: true,
				date: [this.dateMin, this.dateMax],
				calendars: 3,
				mode: 'range',
				starts: 0,
				onChange: function(formatted, dates){
					that.dateMin = formatted[0];
					that.dateMax = formatted[1];
					that.$element.find('.btn_selectDate').text(formatted[0] + ' - ' + formatted[1]);
				},
				onRender: function(date){
					return {
						disabled: (date.valueOf() > new Date())	//Disable all future dates
					}
				}
			});

			$('.dateSelection .calendar').append('<div class="btnContainer"><button type="submit" class="button secondary submit">Update Time</button></div>');

			$('.dateSelection .calendar').hide()

			this._addListeners();
		},

		toggle : function(){
			if(this.active == false){
				$('.dateSelection .calendar').slideToggle();
				$('.dateSelection .btn_selectDate').addClass('active');
				this.active = true;
			}else{
				$('.dateSelection .calendar').slideToggle();
				$('.dateSelection .btn_selectDate').removeClass('active');
				this.active = false;
				$('.btn_selectDate').text($('input[name$="min_date"]').val() + ' - ' + $('input[name$="max_date"]').val());

				$('.dateSelection .calendar').DatePickerSetDate([$('input[name$="min_date"]').val(),$('input[name$="max_date"]').val()], true);
				//	date: [$('input[name$="min_date"]').val(),$('input[name$="max_date"]').val()]

			}
		},

		setRange : function(range){
			var today = new Date(),
				yesterday = new Date(today - 86400000),
				startDate,
				endDate;

			switch (range) {
				case 'today' :
					startDate = today;
					endDate = today;
					break;
				case 'yesterday' :
					startDate = yesterday;
					endDate = yesterday;
					break;
				case '3day' :
					startDate = new Date(yesterday -(86400000*2));
					endDate = yesterday;
					break;
				case 'week' :
					startDate = new Date(yesterday -(86400000*6));
					endDate = yesterday;
					break;
				default :
					startDate = today;
					endDate = today;
			}

			this.dateMin = startDate.getFullYear() + '-' + ('0'+(startDate.getMonth()+1)).slice(-2) + '-' + ('0'+startDate.getDate()).slice(-2);
			this.dateMax = endDate.getFullYear() + '-' + ('0'+(endDate.getMonth()+1)).slice(-2) + '-' + ('0'+endDate.getDate()).slice(-2);
			this.$element.find('.btn_selectDate').text(this.dateMin + ' - ' + this.dateMax)

			this.submit();
			/*var year = date.getFullYear();
			var month = ('0'+(date.getMonth()+1)).slice(-2);
			var day = ('0'+date.getDate()).slice(-2);*/
		},

		_addListeners : function(){
			var that = this;

			$('.btn_selectDate').click(function(event){
				that.toggle();
			});

			this.$element.find('form').submit(function(event){
				event.preventDefault();
				//console.log('submit my form bro!');
				that.submit($(this));
			});

			$('html').click(function() {//Hide the date picker if you click out
				if(that.active == true){
					that.toggle();
				}
			});

			$('.dateSelection').click(function(event){//Prevent closing if clicking inside date selection widget
				 event.stopPropagation();
			});

			$('.dateRangeSelection li a').click(function(event){
				event.preventDefault();
				$('.dateRangeSelection').find('li.active').removeClass('active');
				$(this).addClass('active');
				that.setRange($(this).attr('href').replace('#', ''));
			});
		},

		submit : function(){
			var that = this,
				form = this.$element.find('form');

			$('input[name$="min_date"]').val(that.dateMin);
			$('input[name$="max_date"]').val(that.dateMax);

			if(that.active == true){
				that.toggle();
			}

			$.post(ss.urls.setDate, form.serialize()).success(function(){
				$('.dateSelection .calendar').DatePickerSetDate([that.dateMin,that.dateMax], true);

				$(document).trigger('setDate', {date: [that.dateMin,that.dateMax]});

				$(document).trigger('updateModules');
				//ss.automation.updateModules();
			});


			//ss.automation.automate();
		},

		options: {
			type: 'advanced',
			dateMin: '',
			dateMax: ''
		}
	}
}

return ss.dates.date;

});//end define

