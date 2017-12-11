'use strict';

let app = angular.module('app', []);

app.config(['$compileProvider', ($compileProvider) => {
    $compileProvider.debugInfoEnabled(false);
}]);

app.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';
        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;
        value = value.substr(0, max);
        if(wordwise) {
            let lastspace = value.lastIndexOf(' ');
            if(lastspace !== -1) {
                if (value.charAt(lastspace-1) === '.' || value.charAt(lastspace-1) === ',')
                    lastspace = lastspace - 1;
                value = value.substr(0, lastspace);
            }
        }
        return value + (tail || ' …');
    };
});

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

app.controller('indexController', function ($scope, $http) {
    const fs             = require('fs');
    const path           = require('path');
    const shell          = require('electron').shell;
    const electron       = require('electron');
    const ipcRenderer    = electron.ipcRenderer;
    const remote         = electron.remote;
    const BrowserWindow  = remote.BrowserWindow;
    const screenElectron = electron.screen;
    const file_config    = path.join(__dirname, 'js/config.js');
    const file_langua    = path.join(__dirname, 'source/language.json');
    const lang_defaul    = 'en';

    let api_speak = 'https://api.ispeech.org/api/rest?apikey=34b06ef0ba220c09a817fe7924575123&action=convert&voice=usenglishfemale&speed=0&pitch=100&text=';
    let api_trans = (from, to, text) => { return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&dt=bd&dj=1&q=${text}`; }
    let config        = require(file_config);
    $scope.option     = config.get('option');
    $scope.dictionary = config.get('dictionary');
    $scope.language   = require(file_langua);

    ipcRenderer.on('selection', (event, message) => {
        $scope.dictionary = config.get('dictionary');
        $scope.selection = message;
        $scope.active = '';
        $scope.choose_text = false;
        $scope.$apply();
    })

    let checkSelectionAvailable = function() {
        return $scope.selection !== undefined && $scope.selection.trim() !== '';
    };

    $scope.$watch('selection', function(newValue, oldValue, scope) {
        if(checkSelectionAvailable() && !$scope.choose_text) {
            $scope.option.from = 'auto';
            $scope.translation();
        }
    }, true);

    $scope.$watch('option', function(newValue, oldValue, scope) {
        config.set('option', $scope.option);
        if(checkSelectionAvailable())
            $scope.translation();
    }, true);

    $scope.translation = function() {
        $scope.is_translating = true;
        $http.get(api_trans($scope.option.from, $scope.option.to, $scope.selection)).then((res)=>{
            $scope.option.from    = res.data.src;
            $scope.result         = res.data;
            $scope.is_translating = false;
        });
    };

    $scope.lookupOther = function(ele) {
        if(ele.keyCode !== 13 || !$scope.search) return;
        reset();
        $scope.choose_text = false;
        $scope.selection = $scope.search;
    };

    $scope.checkWordExisted = function() {
        let flag = false;
        angular.forEach($scope.dictionary, function(value, key){
            if(value.text === $scope.selection.toLowerCase() &&
                value.from === $scope.option.from &&
                value.to   === $scope.option.to)
                flag = true;
        });
        return flag;
    };

    let save = () => {
        $scope.dictionary = config.get('dictionary');
        let temp = {
            id:    + new Date(),
            text:  $scope.selection.toLowerCase(),
            result:$scope.result,
            from:  $scope.option.from,
            to:    $scope.option.to
        };
        $scope.dictionary.unshift(temp);
        config.set('dictionary', $scope.dictionary);
    };

    $scope.saveWord = function() {
        if(!$scope.selection || $scope.result.length <= 0) return;
        if(!checkSelectionAvailable() || $scope.checkWordExisted()) return;
        save();
    };

    $scope.star = () => {
        if(!$scope.selection || $scope.result.length <= 0) return;
        if(!checkSelectionAvailable()) return;
        if(!$scope.checkWordExisted()) save();
        else angular.forEach($scope.dictionary, function(value, key) {
            if(value.text === $scope.selection.toLowerCase()) {
                $scope.dictionary.splice(key, 1);
                config.set('dictionary', $scope.dictionary);
            }
        });
    };

    $scope.selectWord = function(id) {
        $scope.choose_text = true;
        $scope.active = id;
        angular.forEach($scope.dictionary, function(value, key){
            if(value.id === id) {
                $scope.selection = value.text;
                $scope.result = value.result;
                $scope.option.from = value.from;
                $scope.option.to = value.to;
                return;
            }
        });
    };

    $scope.renderDict = (dict) => {
        let result = '';
        let count = 0;
        angular.forEach(dict, function(value, key){
            if(count <= 5) result += '- ' + value + '\n';
            count++;
        });
        return result;
    };

    $scope.speak = function(lang, text) {
        if(lang !== 'en' || !text.trim()) return;
        let utter = new SpeechSynthesisUtterance();
        utter.text = text;
        utter.onend = function(event) { console.log('Speech complete'); }
        speechSynthesis.speak(utter);
    }

    let reset = function() {
        $scope.result = [];
        $scope.active = '';
        $scope.selection = '';
    };

    $scope.hideWindow = function() {
        reset();
        window.close();
    };

    $scope.openBrowser = (url) => shell.openExternal(url);

    $scope.switchTranslate = () => {
        let keep = $scope.option.from;
        $scope.option.from = $scope.option.to;
        $scope.option.to = keep;
        $scope.translation();
    };

    $scope.is_maximize = false;
    $scope.fullScreen = () => {
        let mainScreen = screenElectron.getPrimaryDisplay().size;
        let win = remote.getCurrentWindow();
        if(!$scope.is_maximize) {
            win.maximize(true);
            $scope.is_maximize = true;
        } else {
            win.unmaximize();
            $scope.is_maximize = false;
        }
    };

    $scope.openHistory = () => {
        const modalPath = path.join(__dirname, 'second.html');
        let win = new BrowserWindow({
            icon: path.join(__dirname, '../build/icon.ico'),
            width: 700, height: 400, minWidth: 700, minHeight: 400,
            toolbar: false,
            title: 'Tunlookup',
            radii: [5,5,5,5],
            webPreferences: { devTools: false }
        });
        win.on('close', function () { win = null });
        win.loadURL(modalPath);
        win.setAlwaysOnTop(true, 'modal-panel');
        win.setMenu(null);
        win.on('blur', () => win.hide() );
        win.show();
    };

    $scope.delete = function(id) {
        angular.forEach($scope.dictionary, function(value, key) {
            if(value.id === id) {
                $scope.dictionary.splice(key, 1);
                config.set('dictionary', $scope.dictionary);
                reset();
            }
        });
    };

    window.onkeydown = (event) => {
        let keyCode = event.which || event.keyCode;
        if(keyCode === 87) $scope.switchTranslate();
        if(keyCode !== 27) return;
        $scope.result = [];
        $scope.active = '';
        $scope.selection = '';
        $scope.$apply();
        window.close();
    };
});