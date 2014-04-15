define(['taoQtiItem/qtiCreator/widgets/states/factory', 'taoQtiItem/qtiCreator/widgets/states/Active'], function(stateFactory, Active){

    var InteractionStateActive = stateFactory.create(Active, function(){
        
        var _widget = this.widget;
        
        _widget.beforeStateInit(function(e, element, state){
            var serial = element.getSerial();
            if(state.name === 'active' && serial !== _widget.serial && _widget.element.qtiClass === 'modalFeedback'){
                //when it does not click on itself, check if the newly activated element is its own composing element:
                var composingElts = _widget.element.getComposingElements();
                if(!composingElts[serial]){
                    //hide the interaction completely
                    //hide all widgets: toolbar, prompt & choice widgets
                    _widget.changeState('sleep');
                }
            }
        }, 'otherActive');
        
    },function(){
        
        var _widget = this.widget;
        
        _widget.offEvents('otherActive');
    });

    return InteractionStateActive;
});