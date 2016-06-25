(function() {
    'use strict'

    angular
    .module('angular-mdcrud-formly')
    .factory('Util', ['$document', '$window', UtilFactory]);

    /** @ngInject */
    function UtilFactory($document, $window) {

        var tmpl_print = ''

        var factory = {
            toType: toType, 
            isJson: isJson, 
            getParams: getParams, 
            print: print, 
            fullscreen: fullscreen,
            nano: nano,
            popup: popup,
            filterFields: filterFields,
            addPropertiesFormly: addPropertiesFormly,
            size: size,
            getFkData: getFkData,
            serialize: serialize,
            getMenuOption: getMenuOption,
            parseSave: parseSave
        }

        return factory

        function nano (template, data) {
            return template.replace(/\{([\w\.]*)\}/g, function (str, key) {
                var keys = key.split("."), v = data[keys.shift()];
                for (var i = 0, l = keys.length;i < l;i++)
                    v = v[keys[i]];
                return (typeof v !== "undefined" && v !== null) ? v : "";
            });
        }

        function toType (obj) {
            return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        }

        function isJson (text) {
            return /^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
                replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
                replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
        }

        function getParams (p, args) {
            var first = p.first.defaultValue,
            second = p.second.defaultValue;

            p.first.position = p.first.position || 0;
            p.second.position = p.second.position || 1;

            var type = toType(args[p.first.position]);
            if (type != 'undefined') {          
                if (type == p.first.type) {
                    first = args[p.first.position];
                    second = toType(args[p.second.position]) == p.second.type ? args[p.second.position] : p.second.defaultValue;
                } else {
                    if (type == p.second.type) {
                        first = toType(args[p.second.position]) == p.first.type ? args[p.second.position] : p.first.defaultValue;
                        second = args[p.first.position];
                    }
                }
            }
            return {
                first : first,
                second : second
            };
        }

        function print (html, css) {
            if (typeof css == 'string') {
                angular.element.get(css, function (response) {
                    var popup = $window.open('', 'print');
                    popup.document.write(nano(tmpl_print, {body : html, css : response}));
                    popup.document.close();
                    popup.focus();
                    popup.print();
                    popup.close();
                });
            } else {
                var popup = $window.open('', 'print');
                popup.document.write(nano(tmpl_print, {body : html, css : css}));
                popup.document.close();
                popup.focus();
                popup.print();
                popup.close();
            }

            return true;
        }

        function popup(url) {
            $window.open(url, 'print');
        }

        function fullscreen () {
            if (!$document.fullscreenElement &&    // alternative standard method
                !$document.mozFullScreenElement && !$document.webkitFullscreenElement && !$document.msFullscreenElement ) {  // current working methods
                if ($document.documentElement.requestFullscreen) {
                    $document.documentElement.requestFullscreen();
                } else if ($document.documentElement.msRequestFullscreen) {
                    $document.documentElement.msRequestFullscreen();
                } else if ($document.documentElement.mozRequestFullScreen) {
                    $document.documentElement.mozRequestFullScreen();
                } else if ($document.documentElement.webkitRequestFullscreen) {
                    $document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            } else {
                if ($document.exitFullscreen) {
                    $document.exitFullscreen();
                } else if ($document.msExitFullscreen) {
                    $document.msExitFullscreen();
                } else if ($document.mozCancelFullScreen) {
                    $document.mozCancelFullScreen();
                } else if ($document.webkitExitFullscreen) {
                    $document.webkitExitFullscreen();
                }
            }
        }

        function filterFields(data, fields) {
            if (typeof fields == 'undefined' || fields.length == 0) {
                return data;
            }
            var filter = [];
            for (var i in fields) {
                var field = searchField(data, fields[i]);
                if (field) {
                    filter.push(field);
                }
            }
            return filter;
        }

        function searchField(fields, field) {
            for (var i in fields) {
                if (fields[i].key == field) {
                    return fields[i];
                }
            }   
            return null;
        }

        function addPropertiesFormly(data, formly) {
            if (typeof formly == 'undefined' || formly.length == 0) {
                return data;
            }
            for (var i in data) {
                var field = searchField(formly, data[i].key);
                if (field) {
                    data[i] = angular.element.extend({}, data[i], field);
                }
            }
            return data;
        }

        function size(obj) {
            return Object.keys(obj).length;
        }

        // Only Django
        function parseSave(data) {
            var item = {};
            for (var i in data) {
                if (toType(data[i]) == 'date') {
                    item[i] = parseDate(data[i]);
                } else {
                    if (typeof data[i] == 'string' && (data[i] == 'true' || data[i] == 'false')) {
                        item[i] = item[i] == 'true'; 
                    } else {
                        item[i] = data[i];
                    }
                }
            }
            return item;
        }

        function getFkData(fieldsData, key, value) {
            fieldsData.filter(function (e) {
                if (e.key == key && e.templateOptions.options) {
                    e.templateOptions.options.filter(function(elem) {
                        if (elem.value == value) {
                            value = elem.name;
                        }
                    })
                }
            });
            return value;
        }

        function parseDate(date) {
            return [date.getFullYear(),date.getMonth()+1,date.getDate()].join('-');
        }

        function serialize(json) {
            var string = [];
            for (var i in json) {
                string.push(i + '=' + json[i]);
            }
            return string.join('&');
        }

        function getMenuOption(menu, url) {
            for (var i in menu) {
                if (typeof menu[i].submenu != 'undefined') {
                    var pages = menu[i].submenu;
                    for (var j in pages) {
                        if (pages[j].url == url) {
                            return [menu[i].label, pages[j].label];
                        }
                    }
                }
            }
            for (var k in menu) {
                if (menu[k].url == url) {
                    return [menu[k].label, false];
                }
            }
            return [false,false];
        }
    }
  })();