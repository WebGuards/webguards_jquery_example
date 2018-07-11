/**
 * The plugin is written for the Ukrainian Center of Steel Construction.
 *
 * The plugin was developed by WebGuards [https://webguards.tech/].
 */

(function($) {
    var methods = {

        /**
         * Initialization method.
         * @method
         * @instance
        */
        onInit: function(option) {
            var self = this;

            /** Cache API points for working with Backend. */
            self.INIT_DATA_URL = self.data('initial-url');
            self.TABLE_DATA_URL = self.data('table-data');

            /** Init google charts. */
            google.charts.load('current', {'packages': ['corechart', 'line'], 'language': 'ru'});
            var drawChart = methods.refreshCharts;
            google.charts.setOnLoadCallback(drawChart);

            /** Get initial data from server. */
            methods.getInitialData.apply(self, arguments);

            /** Draw the table. */
            methods.drawTable.apply(self, arguments);

            /** Init datepicker. */
            methods.initDatepicker.apply(self, arguments);

            /**************/
            /*** Events ***/
            /**************/

            /** Change graph types. */
            self.find('.js-graph-types').on('change', 'input', function() {
                methods.refreshCharts.apply(self, arguments);
            });

            /** Change currency. */
            self.find('.js-currencies').on('change', 'select', function() {
                methods.refreshCharts.apply(self, arguments);
            });

            /** Change dates. */
            self.find('.js-dates').on('change', 'input', function() {
                methods.refreshCharts.apply(self, arguments);
            });

            /** Handles actions mobile view for table. */
            self.find('.js-mobile-table').on('click', '.head', function() {
                methods.openTitle.apply(self, $(this));
            });

            /** Counting the sum of all the numbers entered in the input and output of the result. */
            self.find('#js-popup-default-data').on('keyup', 'input[type="text"]', function() {
                methods.calculationModalInput.apply(this, arguments);
            });

            /** Event Handling - open the window(popup). */
            self.find('.js-open-popup').on('click', function() {
                methods.openPopup.apply(self, arguments);
            });

            /** Event Handling - close the window(popup). */
            self.find('.js-close-popup').on('click', function() {
                methods.closePopup.apply(self, arguments);
            });

            /** Logic displays a google chart container. */
            self.find('.js-chart-display').on('click', function() {
                methods.chartDisplay.apply(self, arguments);
            });

            /** Logic displays a pdf container. */
            self.find('.js-pdf-display').on('click', function() {
                methods.pdfDisplay.apply(self, arguments);
            });

            /** Returning pdf and chart to its original state. */
            self.find('.js-return-back').on('click', function() {
                methods.changingReturn.apply(self, arguments);
            });
        },

        /**
         * Gets initial data for plugin from server.
         * @method
         * @instance
         */
        getInitialData: function () {
            var self = this;

            /** It's ajax request to server. */
            $.get(self.INIT_DATA_URL, function(data, status) {
                methods.drawCurrencies.apply(self, arguments);
                methods.drawGraphicTypes.apply(self, arguments);
                methods.customDateInPopup.apply(self, arguments);
            }); /** Query end */
        },

        /**
         * Initialization datepicker.
         * @method
         * @instance
         */
        initDatepicker: function() {
            var maxEndDate = new Date();
            var datePickerSettings = {
                format: 'yyyy-mm-dd',
                language: 'ru',
                locale: 'ru',
                endDate: maxEndDate,
            };

            this.find('.datepicker')
                .datepicker(datePickerSettings)
                .on('changeDate', function(event) {
                    var datePickerID = event.currentTarget.id,
                        checkedDate = event.date;
                    if (datePickerID === 'date_from' || datePickerID === 'popup_date_from') {
                        $('#date_to, #popup_date_to').datepicker('setStartDate', checkedDate);
                    }

                    $(this).datepicker('hide');
                    $(this).change();
            });

        },

        /**
         * Drawing currencies on the page.
         * @method
         * @instance
         */
        drawCurrencies: function(data) {
            var currencies = '';
            for (var i=0; i<data.currencies.length; i++) {
                currencies += '\
                                <option value=DATA_VALUE>\
                                    DATA_NAME\
                                </option>'.replace("DATA_VALUE", data.currencies[i].code)
                                          .replace("SELECTED", i === 0 ? 'selected' : '')
                                          .replace("DATA_NAME", data.currencies[i].title);
            }
            this.find('.js-currencies select').html(currencies);
        },

        /**
         * Drawing list of graphics on the page.
         * @method
         * @instance
         */
        drawGraphicTypes: function(data) {
            var graphTypes = '';
            for (var i=0; i<data.graphic_types.length; i++) {
                graphTypes += '\
                                <div class="custom-checkbox">\
                                    <input id="graphics_DATA_ID"\
                                           type="checkbox"\
                                           name="graphics"\
                                           value="DATA_VALUE"\
                                           CHECKED />\
                                    <label for="graphics_DATA_LABEL"\
                                           class="title size15">\
                                           <span class="ellipse colorCOLOR_ID"></span>\
                                           DATA_NAME\
                                    </label>\
                                </div>'.replace("DATA_ID", data.graphic_types[i].code)
                                       .replace("DATA_VALUE", data.graphic_types[i].code)
                                       .replace("CHECKED", i === 0 ? 'checked' : '')
                                       .replace("DATA_LABEL", data.graphic_types[i].code)
                                       .replace("COLOR_ID", data.graphic_types[i].code)
                                       .replace("DATA_NAME", data.graphic_types[i].title);
            }
            this.find('.js-graph-types').html(graphTypes);
        },

        /**
         * Making the request to server and refreshing the charts by given data.
         * @method
         * @instance
         */
        refreshCharts: function() {
            var checkboxLoading = $('.js-white-loading');
            checkboxLoading.fadeIn(200);

            var formData = $('.js-graph-filters').serializeArray();
            var preparedData = {};

            for (var i = 0; i < formData.length; i++) {
                if (formData[i].name in preparedData) {
                    preparedData[formData[i].name] += ',' + formData[i].value;
                } else {
                    preparedData[formData[i].name] = formData[i].value;
                }
            }

            var graphData = new google.visualization.DataTable();
                graphData.addColumn('date', 'dates');

            var GRAPH_DATA_URL = $(".js-webguards-graphics").data('graphics-data');

            var labelColors = {
                'Composite index': '#8ea9cf',
                'Sheet of plasterboard': '#3cb878',
                'Beam': '#fbaf5d',
                'Channel': '#dd494e',
                'Corner': '#a67c52',
                'Profile pipe': '#a864a8',
                'Round pipe': '#acacac'
            };
            var colorsForCharts = {};

            $.post(GRAPH_DATA_URL, preparedData, function(data, status) {
                checkboxLoading.fadeOut(200);

                /** Add labels. */
                for (var i = 0; i < data.labels.length; i++) {
                    graphData.addColumn('number', data.labels[i]);
                    colorsForCharts[i] = {color:labelColors[data.labels[i]]};
                }
                var rowData = [];

                for (var i = 0; i < data.dates.length; i++) {
                    var dataForDay = [];

                    /** Add day at first. */
                    dataForDay.push(new Date(data.dates[i]));

                    /** Add data for this day for each graph type. */
                    for (var line = 0; line < data.data.length; line++) {
                        dataForDay.push(data.data[line][i]);
                    }
                    rowData.push(dataForDay);
                }

                var arrayList = data.data;
                var arrayListNumber = [];

                /** Search array[i][n] in array[i]  */
                for (var index = 0; index < arrayList.length; index++) {
                    for (var number=0; number < arrayList[index].length; number++) {
                        /** We use to search min max value. */
                        arrayListNumber.push(arrayList[index][number]);
                    }
                }

                /**
                 * Min max for the google chart for vAxis and rounding values
                 */
                var minNubmer = Math.min.apply(null, arrayListNumber),
                    maxNubmer = Math.max.apply(null, arrayListNumber);

                graphData.addRows(rowData);

                /** Settings using for google chart */
                var options = {
                    legend: {
                        position: 'none'
                    },
                    hAxis: {
                        format: 'd MMM'
                    },
                    vAxis: {
                        viewWindow: {
                            min: minNubmer,
                            max: maxNubmer
                        }
                    },
                    chartArea:{
                        width:"86%"
                    },
                    series: colorsForCharts
                };

                var chart = new google.visualization.LineChart(document.getElementById('charts_container'));
                    chart.draw(graphData, options);
            });
        },

        /**
         * Making the request to server and drawing the table.
         * @method
         * @instance
         */
        drawTable: function() {
            var self = this;

            $.get(self.TABLE_DATA_URL, function(data, status) {
                /** Desktop table. */
                var $tableBody = self.find('.js-table tbody');
                /** Mobile table. */
                var $tableBodyMobile = self.find('.js-mobile-table');
                var tableData = data.table_data;

                var rowData = '';
                var rowDataMobile = '';
                for (var i=0; i<tableData.length; i++) {
                    rowData += '<tr>\
                                    <td class="aling-left">TITLE</td>\
                                    <td>CURRENT_DATA</td>\
                                    <td>MONTH_AGO_DATA</td>\
                                    <td>START_YEAR_DATA</td>\
                                    <td>YEAR_AGO_DATA</td>\
                                </tr>'.replace('TITLE', tableData[i].title)
                                      .replace('CURRENT_DATA', tableData[i].current)
                                      .replace('MONTH_AGO_DATA', tableData[i].month_ago)
                                      .replace('START_YEAR_DATA', tableData[i].start_year)
                                      .replace('YEAR_AGO_DATA', tableData[i].year_ago);

                    rowDataMobile += '\
                    <div class="mobile-table margin bot15">\
                        <div class="head title size15">TITLE</div>\
                        <div class="body">\
                            <div class="colums title size15">\
                            The current quote, UAH: <span>CURRENT_DATA</span>\
                            </div>\
                            <div class="colums title size15">\
                                % per month: <span>MONTH_AGO_DATA</span>\
                            </div>\
                            <div class="colums title size15">\
                                % by the beginning of the year: <span>START_YEAR_DATA</span>\
                            </div>\
                            <div class="colums title size15">\
                                % to a similar, previous year period: <span>YEAR_AGO_DATA</span>\
                            </div>\
                        </div>\
                    </div>'.replace('TITLE', tableData[i].title)
                           .replace('CURRENT_DATA', tableData[i].current)
                           .replace('MONTH_AGO_DATA', tableData[i].month_ago)
                           .replace('START_YEAR_DATA', tableData[i].start_year)
                           .replace('YEAR_AGO_DATA', tableData[i].year_ago);
                }
                $tableBody.html(rowData);
                $tableBodyMobile.html(rowDataMobile);
            })
        },

        /**
         * Opens details in mobile table when click on title.
         * @method
         * @instance
        */
        openTitle: function(title) {
            $(title).next().toggle(200);
            $(title).toggleClass('active');
        },

        /**
         * Render and customize popup labels.
         * @method
         * @instance
         */
        customDateInPopup: function(data) {
            var popupDefaultData = '';
            for (var id in data.default_specification) {
                popupDefaultData += '\
                                    <div class="col-my">\
                                        <div class="title size15">\
                                            SPECIFICATION_NAME\
                                        </div>\
                                        <input data-pk="ID"\
                                               type="text"\
                                               name="UNIQUE_NAME"\
                                               placeholder="%"\
                                               maxlength="4"\
                                               value="SPECIFICATION_VALUE"\
                                        />\
                                    </div>'.replace("SPECIFICATION_NAME", data.default_specification[id].title)
                                           .replace("SPECIFICATION_VALUE", data.default_specification[id].value)
                                           .replace("Profile", "Pr.")
                                           .replace("Round", "R.")
                                           .replace("UNIQUE_NAME", id)
                                           .replace("ID", id);
            }
            $('#js-popup-default-data').html(popupDefaultData);
        },

        /**
         * Event Handling - opens popup and calculate popup's data.
         * @method
         * @instance
         */
        openPopup: function() {
            $('.js-modal-mask').css({ 'display': 'table' });
            methods.calculationModalInput.apply(this, arguments);
        },

        /**
         * Event Handling - close the popup.
         * @method
         * @instance
         */
        closePopup: function() {
            $('.js-modal-mask').css({ 'display': 'none' });
        },

        /**
         * Calculates and renders summary result.
         * @method
         * @instance
         */
        calculationModalInput: function() {
            var enabled = $('.js-enabled-if100'),
                popover = $('.js-popover'),
                resultSumm = 0;

            /** Convert values to number. */
            $('#js-popup-default-data input[type="text"]').each(function( index ) {
                resultSumm += Number($(this).val());
            });

            if (resultSumm == 100) {
                popover.css({'display': 'none'});
                enabled.removeClass('disabled');
            } else {
                popover.css({'display': 'block'});
                enabled.addClass('disabled');
            }

            $('.js-summ-all-input').html('= ' + resultSumm + '%');
        },

        /**
         * Making the request to server and drawing the table for the popup.
         * @method
         * @instance
         */
        popupSending: function() {
            var SPECIFICATION_DATA_URL = $(".js-webguards-graphics").data('specification-data');

            var spinLoading = $('#js-modal-spin');
            spinLoading.css({ 'display': 'block' });

            var formData = $('.js-popup-filters').serializeArray(),
                popupData = {};

            for (var key in formData) {
                popupData[formData[key].name] = formData[key].value;
            }

            var modalData = new google.visualization.DataTable();
                modalData.addColumn('date', 'dates');
                modalData.addColumn('number', 'test');

            $.post(SPECIFICATION_DATA_URL, popupData, function (data, status) {
                spinLoading.css({ 'display': 'none' });

                var modalDataForDay = [];

                for (var index = 0; index < data.dates.length; index++) {
                    /** Add day at first, add data for this day for each graph type. */
                    modalDataForDay.push([new Date(data.dates[index]), Math.ceil(data.data[index])]);
                }

                var modalArrayList = data.data;
                /**
                 * Min max for the google chart for vAxis and rounding values
                 */
                var modalMinNubmer = Math.min.apply(null, modalArrayList),
                    modalMaxNubmer = Math.max.apply(null, modalArrayList);
                var cailMinNumber = Math.ceil(modalMinNubmer),
                    cailMaxNumber = Math.ceil(modalMaxNubmer);

                modalData.addRows(modalDataForDay);

                /** Settings using for google chart */
                var modalOptions = {
                    legend: {
                        position: 'none'
                    },
                    hAxis: {
                        format: 'd MMM'
                    },
                    vAxis: {
                        viewWindow: {
                            min: cailMinNumber,
                            max: cailMaxNumber
                        }
                    },
                    chartArea:{
                        width:"85%"
                    }
                };

                var chart = new google.visualization.LineChart(document.getElementById('modal_charts_container'));
                    chart.draw(modalData, modalOptions);

                /** Generate the PDF document. */
                var doc = new jsPDF();
                    doc.addImage(chart.getImageURI(), 0, 0);
                $('.js-modal-preview-pdf').attr('src', doc.output('bloburl'));
                $('.js-button-save').on('click', () => doc.save('chart.pdf'));
            });
        },

        /**
         * Renders the chart in popup.
         * @method
         * @instance
         */
        chartDisplay: function() {
            methods.popupSending.apply(self, arguments);

            $('.js-changing-display, .js-modal-head-title').css({ 'display': 'none' });
            $('.js-changing-returm').css({ 'display': 'block' });
            $('.js-modal-preview-chart').addClass('default');
        },

        /**
         * Renders the PDF file.
         * @method
         * @instance
         */
        pdfDisplay: function() {
            methods.popupSending.apply(self, arguments);

            $('.js-changing-display, .js-modal-head-title').css({ 'display': 'none' });
            $('.js-changing-pdf').css({ 'display': 'block' });
            $('.js-modal-preview-pdf').css({'display': 'block'});
        },

        /**
         * Returning pdf and chart to its original state.
         * @method
         * @instance
         */
        changingReturn: function() {
            /** Refresh the position chart and pdf (fixed position). */
            $('.js-modal-preview-chart').removeClass('default');
            $('.js-modal-preview-pdf').css({'display': 'none'});

            $('.js-changing-returm, .js-changing-pdf').css({ 'display': 'none' });
            $('.js-changing-display, .js-modal-head-title').css({ 'display': 'block' });
        },
    };
    $.fn.webGuardsCharts = function(method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || ! method) {
            return methods.onInit.apply(this, arguments);
        } else {
            $.error('No method');
        }
    }
}(jQuery));

/** Init plugin on the landing page. */
$(".js-webguards-graphics").webGuardsCharts();
