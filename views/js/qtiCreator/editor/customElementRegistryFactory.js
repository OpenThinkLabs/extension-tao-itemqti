define([
    'lodash'
], function(_){
    
    var _defaults = {
        onRegister : _.noop
    };
    
    function create(options){
        
        options = _.defaults(options, _defaults);
        
        var _registeredHooks = {};
        var _requirejs = window.require;

        function isValidHook(hook){

            if(!hook.typeIdentifier){
                throw 'invalid hook : missing typeIdentifier';
            }
            if(!hook.baseUrl){
                throw 'invalid hook : missing baseUrl';
            }
            if(!hook.file){
                throw 'invalid hook : missing file';
            }
            return true;
        }

        /**
         * Load manifest and baseUrl data
         * 
         * @param {Object} hooks
         * @param {Function} callback called after each hook registration
         */
        function register(hooks){

            var paths = {};

            _(hooks).values().each(function(hook){

                if(isValidHook(hook)){

                    var id = hook.typeIdentifier;

                    //register the hook
                    _registeredHooks[id] = hook;

                    //load customInteraction namespace in _requirejs config 
                    paths[id] = hook.baseUrl;
                    
                    //exec callback
                    if(_.isFunction(options.onRegister)){
                        options.onRegister(hook);
                    }
                }
            });

            //register custom interaction paths
            _requirejs.config({
                paths : paths
            });
        }

        /**
         * Load all previously registered creator hooks
         * 
         * @param {Function} callback
         */
        function loadAll(callback){

            var required = [];
            _.each(_registeredHooks, function(hook){
                required.push(hook.file);
            });

            _requirejs(required, function(){
                var creators = {};
                _.each(arguments, function(creator){
                    var id = creator.getTypeIdentifier();
                    creators[id] = creator;
                    _registeredHooks[id].creator = creator;
                });
                callback(creators);
            });
        }

        /**
         * Load one single creator hook  identified by its typeIdentifier
         * 
         * @param {String} typeIdentifier
         * @param {Function} callback
         */
        function loadOne(typeIdentifier, callback){

            var hook = _registeredHooks[typeIdentifier];
            if(hook){
                _requirejs([hook.file], function(creator){
                    hook.creator = creator;
                    callback(creator);
                });
            }else{
                throw 'cannot load the hook because it is not registered '+typeIdentifier;
            }

        }

        function getCreator(typeIdentifier){

            var hook = _registeredHooks[typeIdentifier];
            if(hook){
                if(hook.creator){
                    return hook.creator;
                }else{
                    throw 'the hook is not loaded ' + typeIdentifier;
                }
            }else{
                throw 'the hook is not registered ' + typeIdentifier;
            }
        }

        function isDev(typeIdentifier){
            return _registeredHooks[typeIdentifier] && _registeredHooks[typeIdentifier].dev;
        }

        function get(typeIdentifier){
            return _registeredHooks[typeIdentifier];
        }

        function getBaseUrl(typeIdentifier){
            return get(typeIdentifier).baseUrl;
        }

        /**
         * Get authorign data for a custom interaction
         * 
         * @param {String} typeIdentifier
         * @returns {Object}
         */
        function getAuthoringData(typeIdentifier){

            var manifest = getManifest(typeIdentifier);

            return {
                label : manifest.label, //currently no translation available 
                icon : getBaseUrl(typeIdentifier) + manifest.icon, //use baseUrl from context
                short : manifest.short,
                description : manifest.description,
                qtiClass : 'customInteraction.' + manifest.typeIdentifier, //custom interaction is block type
                tags : _.union(['Custom Interactions'], manifest.tags)
            };
        }

        /**
         * Get complete manifest object for a custom interaction
         * 
         * @param {String} typeIdentifier
         * @returns {Object}
         */
        function getManifest(typeIdentifier){
            return get(typeIdentifier).manifest;
        }

        function isDev(typeIdentifier){
            return _registeredHooks[typeIdentifier] && _registeredHooks[typeIdentifier].dev;
        }

        return {
            register : register,
            loadAll : loadAll,
            loadOne : loadOne,
            getBaseUrl : getBaseUrl,
            getCreator : getCreator,
            isDev : isDev,
            get : get,
            getAuthoringData : getAuthoringData,
            getManifest : getManifest
        };

    };

    return {
        create : create
    };
});