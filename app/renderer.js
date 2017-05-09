'use strict';

var app = angular.module('app', []);

app.controller('indexController', function ($scope) {
    require('electron').ipcRenderer.on('selection', (event, message) => {
        $scope.selection = message;
        $scope.$apply();
    })

    $scope.$watch('selection', function(newValue, oldValue, scope) {
        if($scope.selection)
            console.log($scope.selection);
    }, true);
});