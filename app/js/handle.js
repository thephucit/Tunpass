'use strict';

let app = angular.module('app', ['ui.materialize']);

app.config(['$compileProvider', ($compileProvider) => {
    $compileProvider.debugInfoEnabled(true);
}]);

app.controller('indexController', function ($scope, $http) {
    const path       = require('path');
    const config     = require(path.join(__dirname, 'js/config.js'));
    const hash       = require(path.join(__dirname, 'js/hash.js'));
    $scope.tunpassDB = getDB();
    $scope.currPass  = config.get('password');
    $scope.state     = 'login';

    function getDB() {
        let db = config.get('tunpassDB');
        angular.forEach(db, (value, key) => {
            if (db[key].isHashed) {
                db[key].isHashed = false;
                db[key].password = hash.decrypt(db[key].password);
            }
        });

        return db;
    }

    $scope.actionLogin = () => {
        if (config.get('password') != hash.encrypt($scope.password)) {
            $scope.login_failed = true;
        } else {
            $scope.login_failed = false;
            $scope.state   = 'list';
        }
    }

    $scope.actionAdd   = () => {
        $scope.tunpassDB.push({
            title:    '',
            url:      '',
            username: '',
            password: '',
            isHashed: false,
            state:    'edit',
        });
    }

    $scope.actionDelete = (key) => {
        $scope.tunpassDB.splice(key, 1);
        $scope.actionSave();
    }

    $scope.showpass = (ele, attr) => {
        let input = document.querySelector('input[ng-model="'+attr+'"]');
        if (input.getAttribute('type') == 'password') {
            input.setAttribute('type', 'text');
            ele.target.innerText = 'visibility_off';
        } else {
            input.setAttribute('type', 'password');
            ele.target.innerText = 'visibility';
        }
    }

    $scope.actionChangePass = () => {
        let pass        = hash.encrypt($scope.newpass);
        $scope.currPass = pass;
        config.set('password', pass);
    }

    $scope.actionInitPass = () => {
        let pass        = hash.encrypt($scope.initPass);
        $scope.currPass = pass;
        config.set('password', pass);
    }

    $scope.actionSave = () => {
        let db = [];
        angular.forEach($scope.tunpassDB, (value, key) => {
            let temp = value;
            if (! temp.isHashed) {
                temp.isHashed = true;
                temp.password = hash.encrypt(temp.password);
            }
            db.push(temp);
        });
        config.set('tunpassDB', db);
        $scope.tunpassDB = getDB();
    }
});
