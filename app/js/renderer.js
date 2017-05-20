'use strict';

var app = angular.module('app', ['ngResource', 'ngDialog']);

app.service('Modal', function ($rootScope, ngDialog, $timeout) {
    this.success = function(mes) {
        ngDialog.open({
            template: '<span class="success-status"><i class="glyphicon glyphicon-ok icon-success"></i> '+mes+'</span>',
            plain: true
        });
    };

    this.error = function(mes) {
        ngDialog.open({
            template: '<span class="error-status"><i class="glyphicon glyphicon-remove"></i> '+mes+'</span>',
            plain: true
        });
    };

    this.process = function(promise, callback) {
        let showError = function(mes) {
            ngDialog.open({
                template: '<span><b>ERROR</b> <br>'+mes+'</span>',
                plain: true
            });
        }
        ngDialog.open({
            template: '<span><b>Processing</b> <br> Please waiting...</span>',
            closeByDocument: false,
            closeByEscape: false,
            plain: true
        });
        promise.$promise.then(function (res) {
            callback(res);
            if(res.status) {
                $timeout(function() {
                    ngDialog.close();
                }, 1000);
            } else {
                ngDialog.close();
                if(res.message)
                    showError(res.message);
            }
        }, function (er) {
            ngDialog.close();
            showError(er.message);
        });
    };
});

app.factory('Translator', function ($resource) {
    return $resource('https://translate.googleapis.com/translate_a/single?client=gtx&sl=:from&tl=:to&dt=t&dt=bd&dj=1&q=:text', {from:'@from', to:'@to', text:'@text'}, {
    // return $resource('https://translate.yandex.net/api/v1/tr.json/translate?id=8cdf2f85.59169415.a589bf19-1-0&srv=tr-text&lang=:lang&text=:text', {lang:'@lang', text:'@text'}, {
        language: {
            method: 'GET',
            cache: false,
        },
    });
});

app.controller('indexController', function ($scope, $http, Modal, Translator) {

    const fs       = require('fs');
    const path     = require('path');
    const shell    = require('electron').shell;
    const electron = require('electron');
    const remote   = electron.remote;
    const screenElectron = electron.screen;
    const file_config = path.join(__dirname, 'config.js');
    const file_langua = path.join(__dirname, '../source/language.json');
    const lang_defaul = 'en';

    let config        = require(file_config);
    $scope.option     = config.get('option');
    $scope.dictionary = config.get('dictionary');
    $scope.language   = require(file_langua);

    require('electron').ipcRenderer.on('selection', (event, message) => {
        $scope.selection = message;
        $scope.active = '';
        $scope.choose_text = false;
        $scope.$apply();
    })

    let checkSelectionAvailable = function() {
        if($scope.selection !== undefined && $scope.selection.trim() !== '')
            return true;
        return false;
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
        Translator.language({from:$scope.option.from, to:$scope.option.to, text:$scope.selection}, function(res) {
            $scope.option.from = res.src;
            $scope.result = res;
            $scope.is_translating = false;
        });
    };

    $scope.lookupOther = function(ele) {
        if(ele.keyCode === 13)
            if($scope.search)
                $scope.selection = $scope.search;
    };

    $scope.saveText = function() {
        let checkExistText = function() {
            let flag = false;
            angular.forEach($scope.dictionary, function(value, key){
                if(value.text === $scope.selection && value.result === $scope.result)
                    flag = true;
            });
            return flag;
        };
        if(checkSelectionAvailable() && !checkExistText()) {
            let temp = {
                text:$scope.selection,
                id:+ new Date(),
                result:$scope.result,
                from:$scope.option.from,
                to:$scope.option.to
            };
            $scope.dictionary.unshift(temp);
            config.set('dictionary', $scope.dictionary);
        }
    };

    $scope.selectText = function(id) {
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

    $scope.renderDict = function(dict) {
        let result = '';
        angular.forEach(dict, function(value, key){
            result += '- ' + value + '\n';
        });
        return result;
    };

    $scope.speak = function(lang, text) {
        if(lang === 'en' && text.trim()) {
            let url = 'https://api.ispeech.org/api/rest?apikey=34b06ef0ba220c09a817fe7924575123&action=convert&voice=usenglishfemale&speed=0&pitch=100&text=' + text;
            let audio = document.querySelector('audio');
            audio.setAttribute('src', url);
            audio.play();
        } else
            Modal.error('Speech not support this language');
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

    $scope.is_maximize = false;
    $scope.fullScreen = function() {
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

    $scope.delete = function(id) {
        angular.forEach($scope.dictionary, function(value, key){
            if(value.id === id)
                $scope.dictionary.splice(key, 1);
        });
        config.set('dictionary', $scope.dictionary);
        reset();
    };

    $scope.openBrowser = function(url) {
        shell.openExternal(url);
    };

    window.onkeydown = function(event) {
        let keyCode = event.which || event.keyCode;
        if(keyCode === 27) {
            $scope.result = [];
            $scope.active = '';
            $scope.selection = '';
            $scope.$apply();
            window.close();
        }
    };
});