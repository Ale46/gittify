/**
 * Options module to manage the options
 * @returns {{init: init}}
 * @constructor
 */
function Options() {

    //var fields = ["token", "path", "committer_name", "committer_email", "repo", "owner", "save_data", "type", "readability_token"];
    var txtFields = ["token", "path", "committer_name", "committer_email", "repo", "owner", "readability_token"];
    var quote_item = ".quote-item";
    var cmbFields = ["type"];
    var chkFields = ["save_data"];
    var fields = {
        text : txtFields,
        combo : cmbFields,
        checkbox : chkFields
        };

    /**
     * Performs the UI bindings
     */
    var bindUI = function () {

        // set value of fields
        $.each(fields, function (option_key, option_field) {
            $.each(option_field, function(key, value){
                console.log("get: " + option_key +"->"+value);
                if (get(value) !== null) {
                    switch(option_key){
                        case "text":
                            $('#' + value).val(get(value));
                            break;
                        case "combo":
                            $('#' + value).prop('selectedIndex', parseInt(get(value)));
                            break;
                        case "checkbox":
                            $('#' + value).prop('checked', get(value) == "true");
                            break;
                    }
                }
            });
        });
        // show special div
        if (get('save_data')){
            $('#save').show();
            if (get('type') == 0)
                $('#readability').show();
        }

        $(document).on('click', '.btn-save', function (e) {
            e.preventDefault();
            $.each(fields, function (option_key, option_field) {
                $.each(option_field, function (key, item) {
                    var value = null;//$('#' + item).val().trim();

                    switch(option_key){
                        case "text":
                            value = $('#' + item).val().trim();
                            break;
                        case "combo":

                            value = $('select#' + item).prop('selectedIndex');
                            break;
                        case "checkbox":
                            value = $('#' + item).prop('checked') ;
                            break;
                    }

                    if (value !== null) {
                        save(item, value);
                    }
                });
            });

            $(quote_item).html('Woohoo! Setting saved.');
            window.scrollTo(0, 0);
        });

        $("select#type").change(function () {
            var selected_option = $('select#type').prop('selectedIndex');

            if (selected_option == 0) { //markdown
                $('#readability').show();
            }else{
                $('#readability').hide();
            }
        });

        $("#save_data").change(function () {
            var checked = $('#save_data').prop('checked');

            if (checked) { //markdown
                $('#save').show();
                if ($('select#type').prop('selectedIndex')== 0) $('#readability').show();
            }else{
                $('#save').hide();
                if ($('select#type').prop('selectedIndex')== 0) $('#readability').hide();
            }
        });
    };

    /**
     * Save value in user local storage
     *
     * @param name
     * @param val
     */
    var save = function (name, val) {
        localStorage.setItem(name, val);
    };

    /**
     * Get value from storage
     *
     * @param val
     * @returns {boolean}
     */
    var get = function (val) {
        if (localStorage.getItem(val)) {
            return localStorage.getItem(val);
        }
        return null;
    };

    return {

        /**
         * Initializes the options page
         */
        init: function () {
            bindUI();
        }
    };
}

$(function () {
    var options = new Options();
    options.init();
});
