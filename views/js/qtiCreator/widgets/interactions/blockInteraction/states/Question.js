define([
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/interactions/states/Question',
    'taoQtiItem/qtiCreator/helper/htmlEditor',
    'tpl!taoQtiItem/qtiCreator/tpl/toolbars/htmlEditorTrigger',
    'i18n'
], function(stateFactory, Question, htmlEditor, promptToolbarTpl, __){

    var BlockInteractionStateQuestion = stateFactory.extend(Question, function(){

        this.buildPromptEditor();

    }, function(){

        this.destroyPromptEditor();
    });

    BlockInteractionStateQuestion.prototype.buildPromptEditor = function(){

        var _widget = this.widget,
            $editableContainer = _widget.$container.find('.qti-prompt-container'),
            $editable = $editableContainer.find('.qti-prompt'),
            prompt = _widget.element.prompt;

        //@todo set them in the tpl
        $editableContainer.attr('data-html-editable-container', true);
        $editable.attr('data-html-editable', true);

        if(!htmlEditor.hasEditor($editableContainer)){

            //add toolbar once only:
            $editableContainer.append(promptToolbarTpl({
                serial : _widget.serial,
                state : 'question'
            }));

            htmlEditor.buildEditor($editableContainer, {
                placeholder : __('define prompt'),
                change : function(data){
                    prompt.body(data);
                }
            });
        }
    };

    BlockInteractionStateQuestion.prototype.destroyPromptEditor = function(){

        var $editableContainer = this.widget.$container.find('.qti-prompt-container');
        $editableContainer.find('.mini-tlb').remove();
        htmlEditor.destroyEditor($editableContainer);
    };

    return BlockInteractionStateQuestion;
});