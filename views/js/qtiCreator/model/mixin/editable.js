define([
    'lodash',
    'jquery',
    'taoQtiItem/qtiItem/core/Element',
    'taoQtiItem/qtiCreator/model/helper/event'
], function(_, $, Element, event){

    var _removeChoiceFromResponse = function(response, choice){

        var escapedIdentifier = choice.id().replace(/([.-])/g, '\\$1'),
            regex = new RegExp('([^a-z_\-\d\.]*)(' + escapedIdentifier + ')([^a-z_\-\d\.]*)');

        for(var i in response.correctResponse){
            if(response.correctResponse[i].match(regex)){
                delete response.correctResponse[i];
            }
        }

        var mapEntries = {};
        _.forIn(response.mapEntries, function(value, mapKey){
            if(!mapKey.match(regex)){
                mapEntries[mapKey] = value;
            }
        });
        response.mapEntries = mapEntries;
    };

    var _removeSelf = function(element){

        var removed = false,
            item = element.getRelatedItem();

        if(item){
            var found = item.find(element.getSerial());
            if(found){
                var parent = found.parent;

                if(Element.isA(parent, 'interaction') && Element.isA(element, 'choice')){
                    parent.removeChoice(element);

                    //update the response:
                    _removeChoiceFromResponse(parent.getResponseDeclaration(), element);

                    removed = true;
                }else if(typeof parent.initContainer === 'function' && found.location === 'body'){
                    parent.getBody().removeElement(element);
                    removed = true;
                }

                if(removed){
                    event.deleted(element, parent);
                }
            }
        }

        return removed;
    };

    var _containClass = function(allClassStr, className){
        var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', '');
        return allClassStr && regex.test(allClassStr);
    };

    var methods = {
        init : function(serial, attributes){

            //init call in the format init(attributes)
            if(typeof(serial) === 'object'){
                attributes = serial;
                serial = '';
            }

            var attr = {};

            if(_.isFunction(this.getDefaultAttributes)){
                _.extend(attr, this.getDefaultAttributes());
            }
            _.extend(attr, attributes);

            this._super(serial, attr);
        },
        attr : function(key, value){
            var ret = this._super(key, value);
            if(key !== undefined && value !== undefined){
                $(document).trigger('attributeChange.qti-widget', {'element' : this, 'key' : key, 'value' : value});
            }
            return ret;
        },
        remove : function(){
            if(arguments.length === 0){
                return _removeSelf(this);
            }else if(arguments.length === 2){
                return _removeElement(this, arguments[0], arguments[1]);
            }else{
                throw 'invalid number of argument given';
            }
        },
        addClass : function(className){
            var clazz = this.attr('class') || '';
            if(!_containClass(clazz, className)){
                this.attr('class', clazz + (clazz.length ? ' ' : '') + className);
            }
        },
        hasClass : function(className){
            return _containClass(this.attr('class'), className);
        },
        removeClass : function(className){

            var clazz = this.attr('class') || '';
            if(clazz){
                var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)', '');
                clazz = clazz.replace(regex, '').replace(/^\s+/, '');
                if(clazz){
                    this.attr('class', clazz);
                }else{
                    this.removeAttr('class');
                }
            }
        }
    };

    return methods;
});