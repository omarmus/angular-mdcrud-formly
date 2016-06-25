(function() {
    'use strict'

    angular
    .module('angular-mdcrud-formly')
    .factory('Message', ['$mdToast', MessageFactory]);

    /** @ngInject */
    function MessageFactory($mdToast) {

        var factory = {
            success : success,
            error : error
        };

        return factory;

        function success(msg, title) {
            var data = {
                icon : 'check',
                message : msg || 'La operación se realizó correctamente.',
                title : title || 'Correcto',
                type : 'success'
            };

            render(data);
        }

        function error(msg, title) {
            var data = {
                icon : 'report_problem',
                message : msg || 'Ocurrió un error al procesar su operación.',
                title : title || 'Error',
                type : 'danger'
            };

            render(data);
        }

        function render(data) {
            $mdToast.show({
                controller: ToastController,
                template: 
                '<md-toast class="md-toast-{{type}}">' +
                    '<div class="md-toast-title">' +
                        '<md-icon class="md-toast-icon">{{icon}}</md-icon> {{title}}' +
                        '<md-button class="md-toast-close md-icon-button" aria-label="Close">' +
                            '<md-icon class="md-icon">close</md-icon></md-icon>' +
                        '</md-button>' +
                    '</div>' +
                    '<div class="md-toast-message" ng-bind-html="message"></div> ' +
                '</md-toast>',
                parent : angular.element('#toast-container-main'),
                hideDelay: 6000,
                position: 'top right',
                locals: data
            });
        }

        function ToastController($scope, $mdToast, icon, message, title, type) {
            var vm = $scope;

            vm.icon = icon;
            vm.message = message;
            vm.title = title;
            vm.type = type;

            vm.close = function() {
                $mdToast.hide()
            };
        }
    }
})();