app.directive("directive", function() {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            function read() {
                var html = element.html();
                html = html.replace(/&nbsp;/g, "\u00a0");
                ngModel.$setViewValue(html);
            }
            ngModel.$render = function() {
                element.html(ngModel.$viewValue || "");
            };
            element.bind("blur", function() {
                scope.$apply(read);
            });
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    this.blur();
                    event.preventDefault();
                }
            });
        }
    };
});

app.directive('jjSwitchWhen', function() {
    return {
        priority: 1200,
        transclude: 'element',
        require: '^ngSwitch',
        link: function(scope, element, attrs, ctrl, $transclude) {
            var caseStms = scope.$eval(attrs.jjSwitchWhen);
            caseStms = angular.isArray(caseStms) ? caseStms : [caseStms];

            angular.forEach(caseStms, function(caseStm) {
                caseStm = '!' + caseStm;
                ctrl.cases[caseStm] = ctrl.cases[caseStm] || [];
                ctrl.cases[caseStm].push({ transclude: $transclude, element: element });
            });
        }
    };
});

const electron    = require('electron');
const {clipboard} = require('electron');
const shell       = require('electron').shell;
const robot       = require('robotjs');

app.directive('card', function() {
    return {
        restrict: "EA",
        require: "ngModel",
        scope: {
            ngModel:  '=',
            key:      '=',
            cardSave: '&',
            cardDele: '&',
        },
        templateUrl: './template/directive/card.html',
        link: function(scope, element, attrs, ctrl) {
            scope.state = 'show' + scope.key;

            scope.save = () => {
                scope.state         = 'show' + scope.key;
                scope.ngModel.state = 'show';
                ctrl.$setViewValue(scope.ngModel);
                ctrl.$render();
                if (scope.cardSave) {
                    return scope.cardSave();
                }
            }

            scope.copy = (str) => {
                clipboard.writeText(str)
            }

            scope.delete = () => {
                if (scope.cardDele) {
                    return scope.cardDele();
                }
            }

            scope.showpass = (ele) => {
                let input = document.querySelector('input[ng-model="ngModel.password"]');
                if (input.getAttribute('type') == 'password') {
                    input.setAttribute('type', 'text');
                    ele.target.innerText = 'visibility_off';
                } else {
                    input.setAttribute('type', 'password');
                    ele.target.innerText = 'visibility';
                }
            }

            scope.autoTyping = async () => {
                await robot.keyTap('tab', ['command']);
                await robot.keyTap('tab');
                await robot.typeString(scope.ngModel.username);
                await robot.keyTap('tab');
                await robot.typeString(scope.ngModel.password);
                await robot.keyTap('enter');
            }

            scope.openBrowser = (url) => shell.openExternal(url);

            scope.$watch('ngModel', function() {
                scope.state = ctrl.$modelValue.state + scope.key;
            });
        },
    };
});