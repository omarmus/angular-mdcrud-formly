(function() {
  'use strict';

  angular
    // .module('myApp', ['ngAnimate', 'ngCookies', 'ngTouch', 'ngSanitize', 'ngMessages', 'ngAria', 'ngResource', 'ui.router', 'ngMaterial', 'toastr', 'md.data.table', 'formlyMaterial', 'satellizer']);
    .module('myApp', ['ngMaterial', 'md.data.table', 'formlyMaterial', 'md-crud-formly'])
    .controller('MainController', function () {
    	var vm = this;

    	vm.url = 'http://192.168.20.219:5000/api/v1/biometricos/';
    	vm.title = 'List';

    });

})();
