(function() {
    'use strict'

    angular
    .module('angular-mdcrud-formly')
    .component('mdCrudFormly', {
        templateUrl : 'md-crud-formly/md-crud-formly.html',
        controller : ['$scope', 'DataService', 'Message', 'Modal', 'Util', '$timeout', MdCrudFormlyController],
        controllerAs: 'vm',
        bindings: {
            url: '=',
            fields: '=',
            fks: '=',
            titleTable: '=',
            template: '=',
            permission: '=',
            column: '=',
            formly: '=',
            editable: '=',
            eventSave: '=',
            dialogController: '=',
            order: '='
        }
    });

    function MdCrudFormlyController($scope, DataService, Message, Modal, Util, $timeout) {
        var vm = this; 
        var bookmark;

        vm.headers = [];
        vm.items = [];
        vm.item = null;
        vm.print = print;
        vm.save = save;
        vm.saveAll = saveAll;
        vm.removeFilter = removeFilter;
        vm.showFilter = showFilter;
        vm.getItems = getItems;
        vm.dataGrid = {};

        vm.permissions = {
            create: true,
            read: true,
            update: true,
            delete: true,
            print: false
        }

        vm.limitOptions = [10, 20, 50];

        vm.options = {
            rowSelection: false,
            multiSelect: false,
            autoSelect: true,
            decapitate: false,
            largeEditDialog: true,
            boundaryLinks: true,
            limitSelect: true,
            pageSelect: false
        }

        vm.query = {
            order: '',
            limit: vm.limitOptions[0] || 10,
            page: 1,
            filter: ''
        }

        vm.filter = {
            options: {
                debounce: 500
            }
        };

        activate();

        function activate() {
            getFields();
        } 

        function getItems () {
            if (vm.fieldsData) {
                vm.promise = getData();                
            }
        }

        function add (event, id) {
            var add = typeof id == 'undefined';
            if (!add) {
                getItem(event, add, id);
            } else {
                openDialog(event, add, {});
            }
        }

        function save (data) {

            var obj = {};

            for (var i in data) {
                obj[i] = vm.dataGrid[data[i]]
            }

            DataService.save(vm.url, Util.parseSave(obj))
            .then(function(data) {
                if (data) {
                    Message.success('Registro actualizado');
                }
            });
        }

        function saveAll () {
            var data = vm.dataGrid,
                c = 0,
                length = vm.headers.length,
                dataSave = [],
                obj = {},
                promises = [];

            for (var i in data) {
                var key = i.split('_');
                key.shift();
                key = key.join('_');
                obj[key] = data[i];
                c++;
                if (c % length == 0) {
                    dataSave.push(obj);
                    promises.push(savePromise(obj));
                    obj = {};
                }
            }
            Promise.all(promises)
            .then(function (response) {
                for (var i in response) {
                    if (response[i] === false) {
                        Message.error('Se produjo un error al grabar todos los datos.');
                        throw new Error('Error al grabar todos los datos');
                    }
                }
                Message.success('Se guardaron todos los datos');
            });
        }

        function savePromise(data) {
            return new Promise(function (resolve, reject) {
                DataService.save(vm.url, Util.parseSave(data))
                .then(function(data) {
                    if (data) {
                        resolve(true);
                    } else {
                        reject(false);
                    }
                }).catch(function () {
                    reject(false);
                });
            });
        }

        function edit (event, item) {
            vm.add(event, item)
        }

        function deleteItem (event, id) {
            Modal.confirm('Se eliminará el registro de forma permanente, ¿Está seguro?.', function () {
                DataService.delete(vm.url, id)
                .then(function() {
                    Message.success('El registro se eliminó correctamente.');
                    vm.getItems();
                })
                .catch(function () {
                    Message.error();
                });
            }, null, event);
        }

        function getItem(event, add, id) {
            DataService.get(vm.url, id)
            .then(function(data) {
                if (data && data.id) {
                    openDialog(event, add, filterItem(data));
                }
            });
        }

        function openDialog(event, add, item) {
            var config = {
                event: event,
                data: item,
                title: add ? 'Agregar' : 'Editar',
                add: add,
                fields: vm.fieldsData,
                column: vm.column || 1,
                templateUrl : vm.template || 'md-crud-formly/dialog.md-crud-formly.html',
                done : function (answer, $mdDialog) {
                    if (answer == 'save') {
                        DataService.save(vm.url, Util.parseSave(item))
                        .then(function(data) {
                            if (data) {
                                Message.success();
                                $mdDialog.hide();
                                vm.getItems();
                                if (vm.eventSave) {
                                    vm.eventSave(data);
                                }
                            }
                        });
                    }
                }
            };
            if (vm.dialogController) {
                config.controller = vm.dialogController;
            }
            Modal.show(config);
        }

        function getData() {
            return DataService.list(vm.url, vm.query)
            .then(function(data) {
                if (data) {                    
                    var items = data;
                    items.data = filterItems(data.results);
                    vm.items = items;          
                }
            });
        }

        function getFields() {
            DataService.fields(vm.url)
            .then(function(data) {
                if (data) {
                    vm.fieldsData = Util.filterFields(data, vm.fields);
                    vm.fieldsData = Util.addPropertiesFormly(vm.fieldsData, vm.formly);
                    DataService.setFormly(vm.fieldsData);

                    setHeaders(vm.fieldsData);
                    if (vm.editable) {
                        vm.types = getTypes(vm.fieldsData);
                    }
                    if (vm.permission) {
                        vm.permissions = angular.merge(vm.permissions, vm.permission);
                    }
                    vm.getItems();
                }
            });
        }

        function getTypes(data) {
            var types = {};

            data.map(function(el) {
                types[el.key] = el;
            });

            return types;
        }

        function filterItems(data) {
            var fields = typeof vm.fields != 'undefined';
            var fks = typeof vm.fks != 'undefined';
            var array = [];
            for (var i in data) {
                for (var j in data[i]) {
                    if (fields && vm.fields.indexOf(j) == -1) {
                        delete data[i][j];
                    } else {
                        if (typeof vm.editable == 'undefined') {
                            if (typeof data[i][j] == 'boolean') {
                                data[i][j] = data[i][j] ? 'check_circle_success' : 'check_circle_gray';
                            } else if (fks && vm.fks.indexOf(j) != -1) {
                                data[i][j] = Util.getFkData(vm.fieldsData ,j, data[i][j]);
                            } else if (typeof data[i][j] == 'string' && !/[a-zA-Z]+/g.test(data[i][j]) && /^-?[0-9.]+\-?[0-9]+\-?[0-9]*$/g.test(data[i][j])) {
                                data[i][j] = formatDate(data[i][j]);
                            } else if (Util.toType(data[i][j]) == 'array') {
                                data[i][j] = data[i][j][0];   
                            }                           
                            // if (typeof data[i][j] == 'string' && data[i][j].split(':').length == 3) {
                            //   data[i][j] = formatTime(data[i][j])
                            // }
                        }
                    }
                }
                array.push(orderItem(data[i], vm.fieldsData, i));
            }
            return array;
        }        

        function orderItem(data, fields, pos) {

            if (typeof fields == 'undefined' || fields.length == 0) {
                return data;
            }

            var item = {};

            for (var i in fields) {
                var field = fields[i].key
                if (typeof data[field] != 'undefined') {
                    if (vm.editable) {
                        if (typeof data[field] == 'string' && !/[a-zA-Z]+/g.test(data[field]) && /^-?[0-9.]+\-?[0-9]+\-?[0-9]*$/g.test(data[field])) {
                            var date = data[field].split('-');
                            vm.dataGrid[pos + '_' + field] = new Date(date[0], date[1]-1, date[2]);
                        } else {
                            vm.dataGrid[pos + '_' + field] = data[field];                            
                        }
                        item[field] = pos + '_' + field;
                    } else {
                        item[field] = data[field];
                    }
                }
            }

            return item;
        }

        function filterItem(data) {
            for (var i in data) {
                if (typeof data[i] == 'string') {
                    if (!/[a-zA-Z]+/g.test(data[i]) && /^-?[0-9.]+\-?[0-9]+\-?[0-9]*$/g.test(data[i])) {
                        var date = data[i].split('-');
                        data[i] = new Date(date[0],date[1]-1,date[2]);
                    }
                } else if (Util.toType(data[i]) == 'array') {
                    data[i] = data[i][0];
                }
            }
            return data;
        }

        function formatDate(date) {
            date = date.split('-')
            return [date[2], date[1], date[0]].join('/');
        }

        // function formatTime(time) {
        //   time = time.split(':')
        //   return [time[0], time[1]].join(':')
        // }        

        function setHeaders(data) {
            var headers = [];
            var order = typeof vm.order == 'undefined';
            for (var i in data) {
                headers.push({
                    name: data[i].key, 
                    title: data[i].templateOptions.label,
                    order: order || (vm.order && vm.order.indexOf(data[i].key) != -1)
                });
            }
            vm.headers = headers;
        }

        function print(event, id) {
            DataService.pdf(vm.url + 'print/' + id + '/')
            .then(function (data) {
                Modal.show({
                    event: event,
                    data: data,
                    title: 'Impresión',
                    templateUrl : 'md-crud-formly/dialog.pdf.html'
                });
            });
        }

        function showFilter() {
            vm.filter.show = true;
            $timeout(function () {
                angular.element('#crud-table-input').focus();    
            }, 300);            
        }
        
        function removeFilter () {
            vm.filter.show = false;
            vm.query.filter = '';

            if(vm.filter.form.$dirty) {
                vm.filter.form.$setPristine();
            }
        }
        
        $scope.$watch('vm.query.filter', function (newValue, oldValue) {
            if(!oldValue) {
                bookmark = vm.query.page;
            }

            if(newValue !== oldValue) {
                vm.query.page = 1;
            }

            if(!newValue) {
                vm.query.page = bookmark;
            }

            vm.getItems();
        });

    }

})();