/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery', 'lodash', 'i18n',
    'taoQtiItem/qtiCreator/widgets/interactions/Widget',
    'taoQtiItem/qtiCreator/widgets/interactions/graphicGapMatchInteraction/states/states',
    'taoQtiItem/qtiCommonRenderer/helpers/Graphic',
    'taoQtiItem/qtiCreator/helper/dummyElement',
    'tpl!taoQtiItem/qtiCommonRenderer/tpl/choices/gapImg'
], function($, _, __, Widget, states, graphic, dummyElement, gapImgTpl){

    /**
     * The Widget that provides components used by the QTI Creator for the GraphicGapMatch Interaction
     * @extends taoQtiItem/qtiCreator/widgets/interactions/Widget
     * @exports taoQtiItem/qtiCreator/widgets/interactions/graphicGapMatchInteraction/Widget
     */      
    var GraphicGapMatchInteractionWidget = _.extend(Widget.clone(), {

        /**
         * Initialize the widget
         * @see {taoQtiItem/qtiCreator/widgets/interactions/Widget#initCreator}
         * @param {Object} options - extra options 
         * @param {String} options.baseUrl - the resource base url
         * @param {jQueryElement} options.choiceForm = a reference to the form of the choices
         */
        initCreator : function(options){
            this.baseUrl = options.baseUrl;
            this.choiceForm = options.choiceForm;
            
            this.registerStates(states);
            
            //call parent initCreator
            Widget.initCreator.call(this);
          
            this.createPaper(); 
        },

        /**
         * Gracefull destroy the widget
         * @see {taoQtiItem/qtiCreator/widgets/Widget#destroy}
         */
        destroy : function(){

            var $container = this.$original;
            var $itemBody   = $container.parents('.qti-itemBody');

            //stop listening the resize
            $itemBody.off('resizestop.gridEdit.' + this.element.serial);
            $(window).off('resize.qti-widget');

            //call parent destroy
            Widget.destroy.call(this);
        },

        /**
         * Create a basic Raphael paper with the interaction choices 
         */ 
        createPaper : function(){

            var $container = this.$original;
            var $itemBody  = $container.parents('.qti-itemBody');
            var $gapList   = $('ul.source', $container);
            var $imageBox  = $('.main-image-box', $container);
            var background = this.element.object.attributes;
            var diff;
            if(!background.data){
                this._createPlaceholder();
            } else {
                diff = $('.image-editor', $container).outerWidth(true) - $imageBox.innerWidth();
                this.element.paper = graphic.responsivePaper( 'graphic-paper-' + this.element.serial, {
                    width       : background.width, 
                    height      : background.height,
                    img         : this.baseUrl + background.data,
                    imgId       : 'bg-image-' + this.element.serial,
                    diff        : diff,
                    container   : $container,
                    resize      : function(newWidth){
                        var boxWidth = $imageBox.innerWidth() - diff;
                        if(background.width < boxWidth){
                            boxWidth = background.width;
                        }
                        $gapList.width( (newWidth < boxWidth ?  newWidth : boxWidth)  + 'px');
                    } 
                });

                //listen for internal size change
                $itemBody.on('resizestop.gridEdit.' + this.element.serial, function(){
                    $container.trigger('resize.qti-widget');
                });

                //call render choice for each interaction's choices
                _.forEach(this.element.getChoices(), this._currentChoices, this);

                //create the gap images list
                this._createGapImgs();
            }
        },

        /**
         * Creates a dummy placeholder if there is no image set
         */
        _createPlaceholder : function(){

            var $container = this.$original;
            var $imageBox  = $container.find('.main-image-box');
            dummyElement.get({
                icon: 'image',
                css: {
                    width  : $container.innerWidth() - 35,
                    height : 200
                },
                title : __('Select an image first.')
            }).appendTo($imageBox);
        },

        /**
         * Add shape to the Raphel paper for a QTI choice
         * @private
         * @param {Object} choice - the QTI choice 
         */ 
        _currentChoices : function(choice){
            graphic.createElement(this.element.paper, choice.attr('shape'), choice.attr('coords'), {
                id          : choice.serial,
                touchEffect : false
            });
        },

        /**
         * Create the gap images
         */
        _createGapImgs : function(){
            var interaction = this.element;
            var $container  = this.$original;
            var $gapList    = $('ul.source', $container);
    
            $gapList.empty();
            _.forEach(interaction.gapImgs, function(gapImg){
                $gapList.append(gapImg.render());            
            });
        }
   });

    return GraphicGapMatchInteractionWidget;
});
