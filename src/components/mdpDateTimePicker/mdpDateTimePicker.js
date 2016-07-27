/* global moment, angular */

function DateTimePickerCtrl($scope, $mdDialog, $mdMedia, $timeout, currentDate, options) {
    var self = this;

    this.date = this.time = moment(currentDate);
    this.minDate = options.minDate && moment(options.minDate).isValid() ? moment(options.minDate) : null;
    this.maxDate = options.maxDate && moment(options.maxDate).isValid() ? moment(options.maxDate) : null;
    this.autoSwitch = options.autoSwitch;
    this.displayFormat = options.displayFormat || "DD,ddd";
    this.dateFilter = angular.isFunction(options.dateFilter) ? options.dateFilter : null;

    // validate min and max date
	if (this.minDate && this.maxDate) {
		if (this.maxDate.isBefore(this.minDate)) {
			this.maxDate = moment(this.minDate).add(1, 'days');
		}
	}

	if (this.date) {
		// check min date
    	if (this.minDate && this.date.isBefore(this.minDate)) {
			this.date = moment(this.minDate);
    	}

    	// check max date
    	if (this.maxDate && this.date.isAfter(this.maxDate)) {
			this.date = moment(this.maxDate);
    	}
	}

    this.yearItems = {
        currentIndex_: 0,
        PAGE_SIZE: 5,
        START: (self.minDate ? self.minDate.year() : 1900),
        END: (self.maxDate ? self.maxDate.year() : 0),
        getItemAtIndex: function(index) {
            if(this.currentIndex_ < index)
                this.currentIndex_ = index;

            return this.START + index;
        },
        getLength: function() {
            return Math.min(
                this.currentIndex_ + Math.floor(this.PAGE_SIZE / 2),
                Math.abs(this.START - this.END) + 1
            );
        }
    };

    this.monthItems = {
        currentIndex_: 0,
        PAGE_SIZE: 6,
        START: 1,
        END: 12,
        getItemAtIndex: function(index) {
            if(this.currentIndex_ < index)
                this.currentIndex_ = index;

            return this.START + index;
        },
        getLength: function() {
            return Math.min(
                this.currentIndex_ + Math.floor(this.PAGE_SIZE / 2),
                Math.abs(this.START - this.END) + 1
            );
        }
    };

    $scope.$mdMedia = $mdMedia;
    $scope.year = this.date.year();
    $scope.month = this.date.month() + 1;

	this.selectYear = function(year) {
        self.date.year(year);
        $scope.year = year;
        self.switchView(self.VIEW_DAYS);
        self.animate();
    };
	this.selectMonth = function(month) {
        self.date.month(month - 1);
        $scope.month = month;
        self.switchView(self.VIEW_DAYS);
        self.animate();
    };

    this.cancel = function() {
        $mdDialog.cancel();
    };

    this.confirm = function() {
    	var date = this.date;

    	if (this.minDate && this.date.isBefore(this.minDate)) {
    		date = moment(this.minDate);
    	}

    	if (this.maxDate && this.date.isAfter(this.maxDate)) {
    		date = moment(this.maxDate);
    	}

        $mdDialog.hide(date.toDate());
    };

    this.animate = function() {
        self.animating = true;
        $timeout(angular.noop).then(function() {
            self.animating = false;
        })
    };

    this.VIEW_HOURS = 1;
    this.VIEW_MINUTES = 2;
    this.VIEW_DAYS = 3;
    this.VIEW_MONTHS = 4;
    this.VIEW_YEARS = 5;
    this.currentView = this.VIEW_DAYS;
    if(this.autoSwitch){
        $scope.$on('clockSetTime',function(event,time,type){
            switch (type){
                case 'days':
                    self.date.date(time.date());
                    self.switchView(self.VIEW_HOURS);
                    break;
                case 'hours':
                    self.date.hours(time.hours());
                    self.switchView(self.VIEW_MINUTES);
                    break;
                case 'minutes':
                    self.date.minutes(time.minutes());
                    self.switchView(self.VIEW_DAYS);
                    break;
            }
            $timeout(function(){
                $scope.$digest();
            });
        })
    }

    this.getMonthName = function(month){
        return moment().month(month-1).format('MMM');
    };

    this.switchView = function (view) {
        switch (view){
            case this.VIEW_YEARS:
                self.yearTopIndex = (self.date.year() - self.yearItems.START) + Math.floor(self.yearItems.PAGE_SIZE / 2);
                self.yearItems.currentIndex_ = (self.date.year() - self.yearItems.START) + 1;
                break;
            case this.VIEW_MONTHS:
                self.monthTopIndex = (self.date.month() - self.monthItems.START) + Math.floor(self.monthItems.PAGE_SIZE / 2);
                self.monthItems.currentIndex_ = (self.date.month() - self.monthItems.START) + 1;
                break;
        }
        self.currentView = view;
    };

    this.cancel = function() {
        $mdDialog.cancel();
    };

    this.confirm = function() {
        $mdDialog.hide(this.date.toDate());
    };
}

module.provider("$mdpDateTimePicker", function() {
    var LABEL_OK = "OK",
        LABEL_CANCEL = "Cancel",
        DISPLAY_FORMAT = "DD,ddd";

    this.setDisplayFormat = function(format) {
        DISPLAY_FORMAT = format;
    };

    this.setOKButtonLabel = function(label) {
        LABEL_OK = label;
    };

    this.setCancelButtonLabel = function(label) {
        LABEL_CANCEL = label;
    };

    this.$get = ["$mdDialog", function($mdDialog) {
        var datePicker = function(currentDate, options) {
            if (!angular.isDate(currentDate)) currentDate = Date.now();
            if (!angular.isObject(options)) options = {};

            options.displayFormat = DISPLAY_FORMAT;

            return $mdDialog.show({
                controller:  ['$scope', '$mdDialog', '$mdMedia', '$timeout', 'currentDate', 'options', DateTimePickerCtrl],
                controllerAs: 'datepicker',
                clickOutsideToClose: true,
                parent: options.parent,
                template: '<md-dialog aria-label="" class="mdp-datepicker" ng-class="{ \'portrait\': !$mdMedia(\'gt-xs\') }">' +
                            '<md-dialog-content layout="row" layout-wrap>' +
                                '<div layout="column" layout-align="start center">' +
                                    '<md-toolbar layout-align="start start" flex class="mdp-datepicker-date-wrapper md-hue-1 md-primary" layout="column">' +
                                        '<span class="mdp-datepicker-year"  ng-click="datepicker.switchView(datepicker.VIEW_YEARS)" ng-class="{ \'active\': datepicker.currentView == datepicker.VIEW_YEARS }">{{ datepicker.date.format(\'YYYY\') }}</span>' +
                                        '<span class="mdp-datepicker-month"  ng-click="datepicker.switchView(datepicker.VIEW_MONTHS)" ng-class="{ \'active\': datepicker.currentView == datepicker.VIEW_MONTHS }">{{ datepicker.date.format(\'MMM\') }}</span>' +
                                        '<span class="mdp-datepicker-date"  ng-click="datepicker.switchView(datepicker.VIEW_DAYS)" ng-class="{ \'active\': datepicker.currentView == datepicker.VIEW_DAYS }">{{ datepicker.date.format(datepicker.displayFormat) }}</span> ' +
                                        '<div class="mdp-timepicker-selected-time">' +
                                            '<span ng-class="{ \'active\': datepicker.currentView == datepicker.VIEW_HOURS }" ng-click="datepicker.switchView(datepicker.VIEW_HOURS)">{{ datepicker.date.format("H") }}</span>:' +
                                            '<span ng-class="{ \'active\': datepicker.currentView == datepicker.VIEW_MINUTES }" ng-click="datepicker.switchView(datepicker.VIEW_MINUTES)">{{ datepicker.date.format("mm") }}</span>' +
                                        '</div>' +
                                    '</md-toolbar>' +
                                '</div>' +
                                '<div>' +
                                    '<div class="mdp-datepicker-select-year mdp-animation-zoom" layout="column" layout-align="center start"  ng-if="datepicker.currentView == datepicker.VIEW_YEARS">' +
                                        '<md-virtual-repeat-container md-auto-shrink md-top-index="datepicker.yearTopIndex">' +
                                            '<div flex md-virtual-repeat="item in datepicker.yearItems" md-on-demand class="repeated-year">' +
                                                '<span class="md-button" ng-click="datepicker.selectYear(item)" md-ink-ripple ng-class="{ \'md-primary current\': item == year }">{{ item }}</span>' +
                                            '</div>' +
                                        '</md-virtual-repeat-container>' +
                                    '</div>' +
                                    '<div class="mdp-datepicker-select-year mdp-animation-zoom" layout="column" layout-align="center start"  ng-if="datepicker.currentView == datepicker.VIEW_MONTHS">' +
                                        '<md-virtual-repeat-container md-auto-shrink md-top-index="datepicker.monthTopIndex">' +
                                            '<div flex md-virtual-repeat="item in datepicker.monthItems" md-on-demand class="repeated-year">' +
                                                '<span class="md-button" ng-click="datepicker.selectMonth(item)" md-ink-ripple ng-class="{ \'md-primary current\': item == month }">{{ datepicker.getMonthName(item) }}</span>' +
                                            '</div>' +
                                        '</md-virtual-repeat-container>' +
                                    '</div>' +
                                    '<mdp-calendar ng-if="datepicker.currentView == datepicker.VIEW_DAYS" class="mdp-animation-zoom" date="datepicker.date" min-date="datepicker.minDate" date-filter="datepicker.dateFilter" max-date="datepicker.maxDate"></mdp-calendar>' +
                                    '<div class="mdp-clock-switch-container" ng-switch="datepicker.currentView" layout layout-align="center center">' +
                                        '<mdp-clock class="mdp-animation-zoom" auto-switch="datepicker.autoSwitch" time="datepicker.time" type="hours" ng-switch-when="1"></mdp-clock>' +
                                        '<mdp-clock class="mdp-animation-zoom" auto-switch="datepicker.autoSwitch" time="datepicker.time" type="minutes" ng-switch-when="2"></mdp-clock>' +
                                    '</div>' +
                                    '<md-dialog-actions layout="row">' +
                                    	'<span flex></span>' +
                                        '<md-button ng-click="datepicker.cancel()" aria-label="' + LABEL_CANCEL + '">' + LABEL_CANCEL + '</md-button>' +
                                        '<md-button ng-click="datepicker.confirm()" class="md-primary" aria-label="' + LABEL_OK + '">' + LABEL_OK + '</md-button>' +
                                    '</md-dialog-actions>' +
                                '</div>' +
                            '</md-dialog-content>' +
                        '</md-dialog>',
                targetEvent: options.targetEvent,
                locals: {
                    currentDate: currentDate,
                    options: options
                },
                skipHide: true
            });
        };

        return datePicker;
    }];
});

module.directive("mdpDateTimePicker", ["$mdpDateTimePicker", function($mdpDateTimePicker) {
    return  {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            "minDate": "@min",
            "maxDate": "@max",
            "autoSwitch": '@autoSwitch',
            "dateFilter": "=mdpDateFilter",
            "dateFormat": "@mdpFormat",
            "parent": "@mdpParent"
        },
        link: function(scope, element, attrs, ngModel) {
            scope.dateFormat = scope.dateFormat || "YYYY-MM-DD HH:mm";
            ngModel.$parsers.push(function (value) {
                var viewValue = null;
                if (moment(value).isValid()) {
                    viewValue = moment(value).format(scope.dateFormat);
                }
                ngModel.$setViewValue(viewValue);
                return viewValue;
            });
            ngModel.$formatters.push(function (value) {
                if (moment(value).isValid()) {
                    return moment(value).format(scope.dateFormat);
                }
                return null;
            });

            function showPicker(ev) {
                $mdpDateTimePicker(ngModel.$modelValue, {
                    minDate: scope.minDate,
                    maxDate: scope.maxDate,
                    autoSwitch:scope.autoSwitch,
                    dateFilter: scope.dateFilter,
                    parent: scope.parent,
                    targetEvent: ev
                }).then(function(time) {
                    ngModel.$setViewValue(moment(time).format(scope.dateFormat));
                    ngModel.$render();
                });
            };

            element.on("click", showPicker);

            scope.$on("$destroy", function() {
                element.off("click", showPicker);
            });
        }
    }
}]);