/* global moment, angular */

function TimePickerCtrl($scope, $mdDialog, time, autoSwitch, $mdMedia) {
    var self = this;
    this.VIEW_HOURS = 1;
    this.VIEW_MINUTES = 2;
    this.currentView = this.VIEW_HOURS;
    this.time = moment(time);
    this.autoSwitch = !!autoSwitch;

    this.clockHours = parseInt(this.time.format("h"));
    this.clockMinutes = parseInt(this.time.minutes());

    $scope.$mdMedia = $mdMedia;

    this.switchView = function () {
        self.currentView = self.currentView == self.VIEW_HOURS ? self.VIEW_MINUTES : self.VIEW_HOURS;
    };

    this.setAM = function () {
        if (self.time.hours() >= 12)
            self.time.hour(self.time.hour() - 12);
    };

    this.setPM = function () {
        if (self.time.hours() < 12)
            self.time.hour(self.time.hour() + 12);
    };

    this.cancel = function () {
        $mdDialog.cancel();
    };

    this.confirm = function () {
        $mdDialog.hide(this.time.toDate());
    };
}

function ClockCtrl($scope) {
    var TYPE_HOURS = "hours";
    var TYPE_MINUTES = "minutes";
    var self = this;

    this.STEP_DEG = 360 / 12;
    this.steps = [];

    this.CLOCK_TYPES = {
        "hours": {
            range: 12,
        },
        "minutes": {
            range: 60,
        }
    }

    this.getPointerStyle = function () {
        var divider = 1;
        switch (self.type) {
            case TYPE_HOURS:
                divider = 12;
                break;
            case TYPE_MINUTES:
                divider = 60;
                break;
        }
        var degrees = Math.round(self.selected * (360 / divider)) - 180;
        return {
            "-webkit-transform": "rotate(" + degrees + "deg)",
            "-ms-transform": "rotate(" + degrees + "deg)",
            "transform": "rotate(" + degrees + "deg)"
        }
    };

    this.setTimeByDeg = function (deg, base) {
        deg = deg >= 360 ? 0 : deg;
        var divider = 0;
        switch (self.type) {
            case TYPE_HOURS:
                divider = 12;
                break;
            case TYPE_MINUTES:
                divider = 60;
                break;
        }
        var time = Math.round(divider / 360 * deg);
        if (time == 0 && time == base) {
            time = 12;
        } else if (time == 0 && base == 12) {
            time = 24;
        }
        else {
            time += base;
        }
        self.setTime(
            time
        );
    };

    this.setTime = function (time, type) {
        this.selected = time;

        switch (self.type) {
            case TYPE_HOURS:
                time %= 24;
                this.time.hours(time);
                break;
            case TYPE_MINUTES:
                if (time > 59) time -= 60;
                this.time.minutes(time);
                break;
        }

    };

    this.init = function () {
        self.type = self.type || "hours";
        switch (self.type) {
            case TYPE_HOURS:
                for (var i = 1; i <= 24; i++)
                    self.steps.push(i);
                self.selected = self.time.hours() || 0;
                if (self.selected > 24) self.selected -= 24;

                break;
            case TYPE_MINUTES:
                for (var i = 5; i <= 55; i += 5)
                    self.steps.push(i);
                self.steps.push(0);
                self.selected = self.time.minutes() || 0;

                break;
        }
    };

    this.init();
}

module.directive("mdpClock", ["$animate", "$timeout", function ($animate, $timeout) {
    return {
        restrict: 'E',
        bindToController: {
            'type': '@?',
            'time': '=',
            'autoSwitch': '=?'
        },
        replace: true,
        template: '<div class="mdp-clock">' +
        '<div class="mdp-clock-container">' +
        '<md-toolbar class="mdp-clock-center md-primary"></md-toolbar>' +
        '<md-toolbar ng-if="clock.selected<=12 || clock.steps.length == 12" ng-style="clock.getPointerStyle()" class="mdp-pointer md-primary">' +
        '<span class="mdp-clock-selected md-button md-raised md-primary"></span>' +
        '</md-toolbar>' +
        '<md-button ng-class="{ \'md-primary\': clock.selected == step }" class="md-icon-button md-raised mdp-clock-deg{{ ::(clock.STEP_DEG * ($index + 1)) }}" ng-repeat="step in clock.steps" ng-if="$index<12" ng-click="clock.setTime(step)">{{ step }}</md-button>' +
        '</div>' +
        '<div class="mdp-clock-container" style="height: 60%;width: 60%;top: -80%;left: 20%;">' +
        '<md-toolbar ng-if="clock.selected>12 && clock.steps.length == 24" ng-style="clock.getPointerStyle()" class="mdp-pointer md-primary">' +
        '<span class="mdp-clock-selected md-button md-raised md-primary"></span>' +
        '</md-toolbar>' +
        '<md-button ng-class="{ \'md-primary\': clock.selected == step }" class="md-icon-button md-raised mdp-clock-deg{{ ::(clock.STEP_DEG * ($index%12 + 1)) }}" ng-repeat="step in clock.steps" ng-if="$index>=12" ng-click="clock.setTime(step)">{{ step==24?"00":step }}</md-button>' +
        '</div>' +
        '</div>',
        controller: ["$scope", ClockCtrl],
        controllerAs: "clock",
        link: function (scope, element, attrs, ctrl) {
            var pointer = angular.element(element[0].querySelector(".mdp-pointer")),
                timepickerCtrl = scope.$parent.timepicker;

            var onEvent = function (event) {
                var containerCoords = event.currentTarget.getClientRects()[0];
                var x = ((event.currentTarget.offsetWidth / 2) - (event.pageX - containerCoords.left)),
                    y = ((event.pageY - containerCoords.top) - (event.currentTarget.offsetHeight / 2));
                var r = Math.sqrt(Math.abs(x) * Math.abs(x) + Math.abs(y) * Math.abs(y));
                var base = 12;
                if (r > (60)) {
                    base = 0;
                }
                var deg = Math.round((Math.atan2(x, y) * (180 / Math.PI)));
                $timeout(function () {
                    ctrl.setTimeByDeg(deg + 180, base);
                    if (ctrl.autoSwitch && ["mouseup", "click"].indexOf(event.type) !== -1 && timepickerCtrl) timepickerCtrl.switchView();
                });
            };

            element.on("mousedown", function () {
                element.on("mousemove", onEvent);
            });

            element.on("mouseup", function (e) {
                element.off("mousemove");
            });

            element.on("click", onEvent);
            scope.$on("$destroy", function () {
                element.off("click", onEvent);
                element.off("mousemove", onEvent);
            });
        }
    }
}]);

module.provider("$mdpTimePicker", function () {
    var LABEL_OK = "OK",
        LABEL_CANCEL = "Cancel";

    this.setOKButtonLabel = function (label) {
        LABEL_OK = label;
    };

    this.setCancelButtonLabel = function (label) {
        LABEL_CANCEL = label;
    };

    this.$get = ["$mdDialog", function ($mdDialog) {
        var timePicker = function (time, options) {
            if (!angular.isDate(time)) time = Date.now();
            if (!angular.isObject(options)) options = {};

            return $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'time', 'autoSwitch', '$mdMedia', TimePickerCtrl],
                controllerAs: 'timepicker',
                clickOutsideToClose: true,
                template: '<md-dialog aria-label="" class="mdp-timepicker" ng-class="{ \'portrait\': !$mdMedia(\'gt-xs\') }">' +
                '<md-dialog-content layout-gt-xs="row" layout-wrap>' +
                '<md-toolbar layout-gt-xs="column" layout-xs="row" layout-align="center center" flex class="mdp-timepicker-time md-hue-1 md-primary">' +
                '<div class="mdp-timepicker-selected-time">' +
                '<span ng-class="{ \'active\': timepicker.currentView == timepicker.VIEW_HOURS }" ng-click="timepicker.currentView = timepicker.VIEW_HOURS">{{ timepicker.time.format("H") }}</span>:' +
                '<span ng-class="{ \'active\': timepicker.currentView == timepicker.VIEW_MINUTES }" ng-click="timepicker.currentView = timepicker.VIEW_MINUTES">{{ timepicker.time.format("mm") }}</span>' +
                '</div>' +
                '</md-toolbar>' +
                '<div>' +
                '<div class="mdp-clock-switch-container" ng-switch="timepicker.currentView" layout layout-align="center center">' +
                '<mdp-clock class="mdp-animation-zoom" auto-switch="timepicker.autoSwitch" time="timepicker.time" type="hours" ng-switch-when="1"></mdp-clock>' +
                '<mdp-clock class="mdp-animation-zoom" auto-switch="timepicker.autoSwitch" time="timepicker.time" type="minutes" ng-switch-when="2"></mdp-clock>' +
                '</div>' +

                '<md-dialog-actions layout="row">' +
                '<span flex></span>' +
                '<md-button ng-click="timepicker.cancel()" aria-label="' + LABEL_CANCEL + '">' + LABEL_CANCEL + '</md-button>' +
                '<md-button ng-click="timepicker.confirm()" class="md-primary" aria-label="' + LABEL_OK + '">' + LABEL_OK + '</md-button>' +
                '</md-dialog-actions>' +
                '</div>' +
                '</md-dialog-content>' +
                '</md-dialog>',
                targetEvent: options.targetEvent,
                locals: {
                    time: time,
                    autoSwitch: options.autoSwitch
                },
                skipHide: true
            });
        };

        return timePicker;
    }];
});

module.directive("mdpTimePicker", ["$mdpTimePicker", "$timeout", function ($mdpTimePicker, $timeout) {
    return {
        restrict: 'E',
        require: 'ngModel',
        transclude: true,
        template: function (element, attrs) {
            var noFloat = angular.isDefined(attrs.mdpNoFloat),
                placeholder = angular.isDefined(attrs.mdpPlaceholder) ? attrs.mdpPlaceholder : "",
                openOnClick = angular.isDefined(attrs.mdpOpenOnClick) ? true : false;

            return '<div layout layout-align="start start">' +
                '<md-button class="md-icon-button" ng-click="showPicker($event)"' + (angular.isDefined(attrs.mdpDisabled) ? ' ng-disabled="disabled"' : '') + '>' +
                '<md-icon md-svg-icon="mdp-access-time"></md-icon>' +
                '</md-button>' +
                '<md-input-container' + (noFloat ? ' md-no-float' : '') + ' md-is-error="isError()">' +
                '<input type="{{ ::type }}"' + (angular.isDefined(attrs.mdpDisabled) ? ' ng-disabled="disabled"' : '') + ' aria-label="' + placeholder + '" placeholder="' + placeholder + '"' + (openOnClick ? ' ng-click="showPicker($event)" ' : '') + ' />' +
                '</md-input-container>' +
                '</div>';
        },
        scope: {
            "timeFormat": "@mdpFormat",
            "placeholder": "@mdpPlaceholder",
            "autoSwitch": "=?mdpAutoSwitch",
            "disabled": "=?mdpDisabled"
        },
        link: function (scope, element, attrs, ngModel, $transclude) {
            var inputElement = angular.element(element[0].querySelector('input')),
                inputContainer = angular.element(element[0].querySelector('md-input-container')),
                inputContainerCtrl = inputContainer.controller("mdInputContainer");

            $transclude(function (clone) {
                inputContainer.append(clone);
            });

            var messages = angular.element(inputContainer[0].querySelector("[ng-messages]"));

            scope.type = scope.timeFormat ? "text" : "time"
            scope.timeFormat = scope.timeFormat || "HH:mm";
            scope.autoSwitch = scope.autoSwitch || false;

            scope.$watch(function () {
                return ngModel.$error
            }, function (newValue, oldValue) {
                inputContainerCtrl.setInvalid(!ngModel.$pristine && !!Object.keys(ngModel.$error).length);
            }, true);

            // update input element if model has changed
            ngModel.$formatters.unshift(function (value) {
                var time = angular.isDate(value) && moment(value);
                if (time && time.isValid())
                    updateInputElement(time.format(scope.timeFormat));
                else
                    updateInputElement(null);
            });

            ngModel.$validators.format = function (modelValue, viewValue) {
                return !viewValue || angular.isDate(viewValue) || moment(viewValue, scope.timeFormat, true).isValid();
            };

            ngModel.$validators.required = function (modelValue, viewValue) {
                return angular.isUndefined(attrs.required) || !ngModel.$isEmpty(modelValue) || !ngModel.$isEmpty(viewValue);
            };

            ngModel.$parsers.unshift(function (value) {
                var parsed = moment(value, scope.timeFormat, true);
                if (parsed.isValid()) {
                    if (angular.isDate(ngModel.$modelValue)) {
                        var originalModel = moment(ngModel.$modelValue);
                        originalModel.minutes(parsed.minutes());
                        originalModel.hours(parsed.hours());
                        originalModel.seconds(parsed.seconds());

                        parsed = originalModel;
                    }
                    return parsed.toDate();
                } else
                    return null;
            });

            // update input element value
            function updateInputElement(value) {
                inputElement[0].value = value;
                inputContainerCtrl.setHasValue(!ngModel.$isEmpty(value));
            }

            function updateTime(time) {
                var value = moment(time, angular.isDate(time) ? null : scope.timeFormat, true),
                    strValue = value.format(scope.timeFormat);

                if (value.isValid()) {
                    updateInputElement(strValue);
                    ngModel.$setViewValue(strValue);
                } else {
                    updateInputElement(time);
                    ngModel.$setViewValue(time);
                }

                if (!ngModel.$pristine &&
                    messages.hasClass("md-auto-hide") &&
                    inputContainer.hasClass("md-input-invalid")) messages.removeClass("md-auto-hide");

                ngModel.$render();
            }

            scope.showPicker = function (ev) {
                $mdpTimePicker(ngModel.$modelValue, {
                    targetEvent: ev,
                    autoSwitch: scope.autoSwitch
                }).then(function (time) {
                    updateTime(time, true);
                });
            };

            function onInputElementEvents(event) {
                if (event.target.value !== ngModel.$viewVaue)
                    updateTime(event.target.value);
            }

            inputElement.on("reset input blur", onInputElementEvents);

            scope.$on("$destroy", function () {
                inputElement.off("reset input blur", onInputElementEvents);
            })
        }
    };
}]);

module.directive("mdpTimePicker", ["$mdpTimePicker", "$timeout", function ($mdpTimePicker, $timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            "timeFormat": "@mdpFormat",
            "autoSwitch": "=?mdpAutoSwitch",
        },
        link: function (scope, element, attrs, ngModel, $transclude) {
            scope.format = scope.format || "HH:mm";
            function showPicker(ev) {
                $mdpTimePicker(ngModel.$modelValue, {
                    targetEvent: ev,
                    autoSwitch: scope.autoSwitch
                }).then(function (time) {
                    ngModel.$setViewValue(moment(time).format(scope.format));
                    ngModel.$render();
                });
            };

            element.on("click", showPicker);

            scope.$on("$destroy", function () {
                element.off("click", showPicker);
            });
        }
    }
}]);
