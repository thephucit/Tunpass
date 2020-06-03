'use strict';

let app = angular.module('app', ['ui.materialize']);

app.config(['$compileProvider', ($compileProvider) => {
    $compileProvider.debugInfoEnabled(false);
}]);

app.controller('indexController', function ($scope, $http) {
    const path        = require('path');
    const { uuid }    = require('uuidv4');
    const config      = require(path.join(__dirname, 'js/config.js'));
    const hash        = require(path.join(__dirname, 'js/hash.js'));
    $scope.tunpassDB  = getDB();
    $scope.currPass   = config.get('password');
    $scope.recovery   = config.get('recovery');
    $scope.state      = 'login';
    $scope.geRecovery = uuid();

    // ================================== //
    //          DEVELOPER AREA            //
    // ================================== //
    function resetAll() {
        config.set('password', null)
        config.set('recovery', null)
        config.set('tunpassDB', null)
    }
    // resetAll()
    // ================================== //

    function getDB() {
        let db = config.get('tunpassDB') ? config.get('tunpassDB') : [];
        angular.forEach(db, (value, key) => {
            if (db[key].isHashed) {
                db[key].isHashed = false;
                db[key].password = hash.decrypt(db[key].password);
            }
        });

        return db;
    }

    /**
     * Đăng nhập
     */
    $scope.actionLogin = () => {
        if (config.get('password') != hash.encrypt($scope.password)) {
            $scope.login_failed = true;
        } else {
            $scope.login_failed = false;
            $scope.state = 'list';
        }
    }

    /**
     * Thêm một dữ liệu
     */
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

    /**
     * Xoá dữ liệu
     */
    $scope.actionDelete = (key) => {
        $scope.tunpassDB.splice(key, 1);
        $scope.actionSave();
    }

    /**
     * Ẩn/Hiện mật khẩu
     */
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

    /**
     * Đổi mật khẩu
     */
    $scope.actionChangePass = () => {
        if (! $scope.newpass) {
            Materialize.toast('Input your new password.', 4000);
        } else {
            let pass        = hash.encrypt($scope.newpass);
            $scope.currPass = pass;
            $scope.newpass  = null;
            config.set('password', pass);
            Materialize.toast('Your password was updated', 4000);
        }
    }

    /**
     * Khởi tạo mật khẩu lúc mới mở ứng dụng
     */
    $scope.actionInitPass = () => {
        if (! $scope.initPass) {
            Materialize.toast('Input your password.', 4000);
        } else {
            let pass        = hash.encrypt($scope.initPass);
            $scope.currPass = pass;
            $scope.initPass = null;
            $scope.recovery = $scope.geRecovery;
            config.set('password', pass);
            config.set('recovery', $scope.geRecovery);
        }
    }

    /**
     * Tạo lại mật khẩu sử dụng mã khôi phục
     */
    $scope.actionResetPass = () => {
        if ($scope.checkrecovery !== $scope.recovery) {
            Materialize.toast('Invalid recovery code.', 4000);
        } else if (! $scope.newpass) {
            Materialize.toast('Input your new password.', 4000);
        } else {
            let pass        = hash.encrypt($scope.newpass);
            $scope.currPass = pass;
            config.set('password', pass);
            $scope.newpass       = null;
            $scope.checkrecovery = null;
            Materialize.toast('Your password was updated', 4000);
        }
    }

    /**
     * Lưu dữ liệu
     */
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
