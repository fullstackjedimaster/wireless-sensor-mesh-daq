define( ['jquery', 'datepicker'], function ($, DatePicker) {

ss.dateBasic = {
    init : function(){
        var today = new Date(),
            todayFormatted = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

        if(!$('#min_date').val().length){
            $('#min_date').val(todayFormatted);
        }

        if(!$('#max_date').val().length){
            $('#max_date').val(todayFormatted);
        }

        $('#min_date').DatePicker({
            format:'Y-m-d',
            date: $('#min_date').val(),
            current: $('#min_date').val(),
            starts: 7,
            position: 'right',
            onBeforeShow: function(){
                $('#min_date').DatePickerSetDate($('#min_date').val(), true);
            },
            onChange: function(formated, dates){
                $('#min_date').val(formated);

                $('#min_date').DatePickerHide();

                if(formated.replace(/\-/g, '') > $('#max_date').val().replace(/\-/g, '')){
                    $('#max_date').val(formated)
                }
            },
            onRender: function(date){
                /*var disabledDate = new Date($('input[name$="date_disableAfter"]').val().split('-'))*/

                return {
                    disabled: (date.valueOf() > new Date()) //Disable all future dates
                }
            }
        });
        $('#max_date').DatePicker({
            format:'Y-m-d',
            date: $('#max_date').val(),
            current: $('#max_date').val(),
            starts: 7,
            position: 'right',
            onBeforeShow: function(){
                $('#max_date').DatePickerSetDate($('#max_date').val(), true);
            },
            onChange: function(formated, dates){
                $('#max_date').val(formated);

                $('#max_date').DatePickerHide();

                if(formated.replace(/\-/g, '') < $('#min_date').val().replace(/\-/g, '')){
                    $('#min_date').val(formated)
                }
            },
            onRender: function(date){
                /*var disabledDate = new Date($('input[name$="date_disableAfter"]').val().split('-'))*/

                return {
                    disabled: (date.valueOf() > new Date()) //Disable all future dates
                }
            }
        });
    }
}

return ss.dateBasic;

});//end define

