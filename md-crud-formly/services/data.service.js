(function() {
    'use strict';

    angular
    .module('angular-mdcrud-formly')
    .service('DataService', ['$http', 'Message', 'Util', '$sce', DataService])
    .factory('DataServiceConfig', function () {
        return {
            filterResponse: null
        }
    });

    /** @ngInject */
    function DataService($http, Message, Util, DataServiceConfig, $sce) {

        var formly = null;
        var errorConnection = 'No se pudo establecer conexión con el servidor.';
        var error500 = 'Se produjo un error en el servidor, inténtelo más tarde.';
        var error404 = 'No existe el recurso solicitado.';
        var error403 = 'No tiene los permisos necesarios.';

        var service = {
            list: list,
            all: list,
            delete: remove,
            save: save,
            get: get,
            put: put,
            patch: patch,
            post: post,
            fields: fields,
            option: fields,
            pdf: pdf,
            file: pdf,
            setFormly: setFormly
        };

        return service;

        function list(url, query) {
            return $http.get(url + (query ? '?' + Util.serialize(query) : ''))
            .then(function (response) {
                return filterResponse(response.data);
            }).catch(function (error) {
                msgError(error);
            });
        }

        function save(url, data) {
            return $http[data.id ? 'put' : 'post'](url + (data.id ? data.id + '/': ''), data)
            .then(function (response) {
                return filterResponse(response.data);
            }).catch(function (error) {
                msgError(error);
            }); 
        }

        function put(url, data) {
            return $http.put(url + (data.id ? data.id + '/': ''), data)
            .then(function (response) {
                return filterResponse(response.data);
            }).catch(function (error) {
                msgError(error);
            }); 
        }

        function patch(url, data) {
            return $http.patch(url + (data.id ? data.id + '/': ''), data)
            .then(function (response) {
                return filterResponse(response.data);
            }).catch(function (error) {
                msgError(error);
            }); 
        }

        function post(url, data) {
            return $http.post(url, data)
            .then(function (response) {
                return filterResponse(response.data);
            }).catch(function (error) {
                msgError(error);
            });
        }

        function remove(url, id) {
            return $http.delete(url + id + '/')
            .then(function (response) {             
                return filterResponse(response.data);
            }).catch(function (error) {
                msgError(error);
            });
        }

        function get(url, id) {
            return $http.get(url + (id ? id + '/' : ''))
            .then(function (response) {                                 
                return filterResponse(response.data);
            }).catch(function (error) {
                msgError(error);
            });
        }

        function fields(url) {
            return $http({method: 'OPTIONS', url: url})
            .then(function (response) {
                return response.data;
            }).catch(function (error) {
                msgError(error);
            });
        }

        function pdf(url, data) {
            return $http.get(url, data || {}, {responseType:'arraybuffer'})
            .then(function (response) {
                if (response.data) {
                    var file = new Blob([response.data], {type: 'application/pdf'});
                    var fileURL = URL.createObjectURL(file);
                    return $sce.trustAsResourceUrl(fileURL);
                }
                return null;
            }).catch(function (error) {
                msgError(error);
            });
        }

        function setFormly(data) {
            formly = data;
        }

        function parseError(error) {
            var message = [];
            if (error) {
                if (error.detail || error.error) {
                    return error.detail || error.error;
                }
                for (var i in error) {
                    var label = i;
                    if (formly) {
                        formly.filter(function (el) {
                            if (el.key == i) {
                                label = el.templateOptions.label;
                            }
                        });
                    }
                    message.push('<strong>' + label + ':</strong> ' + (Util.toType(error[i]) == 'array' ? error[i].join(', ') : error[i]));
                }
                return message.join('<br>');
            }
            return null;
        }

        function msgError(error) {
            if (error.status === 500) {
                Message.error(error500);
            } else if (error.status === 404) {
                Message.error(error404);
            } else if (error.status === 403) {
                Message.error(error403);
            } else {
                Message.error(parseError(error.data) || errorConnection);
            }
        }

        function filterResponse(response) {
            if (typeof DataServiceConfig.filterResponse == 'function') {
                return DataServiceConfig.filterResponse(response);
            }
            return response;
        }

    }

})();