define([
    'lodash',
    'taoQtiItem/qtiCreator/model/mixin/editable',
    'taoQtiItem/qtiCreator/model/mixin/editableInteraction',
    'taoQtiItem/qtiItem/core/interactions/GapMatchInteraction',
    'taoQtiItem/qtiCreator/model/choices/GapText',
    'taoQtiItem/qtiCreator/model/helper/event'
], function(_, editable, editableInteraction, Interaction, Choice, event){
    var methods = {};
    _.extend(methods, editable);
    _.extend(methods, editableInteraction);
    _.extend(methods, {
        getDefaultAttributes : function(){
            return {
                shuffle : false
            };
        },
        afterCreate : function(){
            this.body('Lorem ipsum dolor sit amet, consectetur adipisicing ...');
            this.createResponse({
                baseType : 'directedPair',
                cardinality : 'multiple'
            });
        },
        createChoice : function(text){
        
            var choice = new Choice();

            this.addChoice(choice);

            choice
                .val(text || 'choice #' + _.size(this.getChoices()))
                .buildIdentifier('choice');

            if(this.getRenderer()){
                choice.setRenderer(this.getRenderer());
            }
            
            event.choiceCreated(choice, this);

            return choice;
        },
        createGap : function(attr, body){

            var choice = new Choice('', attr);

            this.addChoice(choice);
            choice.buildIdentifier('gap');
            choice.body(body);

            if(this.getRenderer()){
                choice.setRenderer(this.getRenderer());
            }

            event.choiceCreated(choice, this);

            return choice;
        }
    });
    return Interaction.extend(methods);
});


