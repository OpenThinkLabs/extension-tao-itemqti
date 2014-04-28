define([
    'taoQtiItem/qtiCreator/widgets/states/factory',
    'taoQtiItem/qtiCreator/widgets/helpers/deletingState',
    'taoQtiItem/qtiCreator/helper/gridUnits',
    'taoQtiItem/qtiCreator/editor/gridEditor/helper',
    'lodash'
], function(stateFactory, deletingHelper, gridUnits, gridHelper, _){

    var DeletingState = stateFactory.create('deleting', function(){

        //array to store new col untis
        this.refactoredUnits = [];

        //reference to the dom element(s) to be remove on delete
        this.$elementToRemove = this.getElementToRemove();

        this.hideWidget();

        this.showMessage(this.widget.element);

    }, function(){

        this.showWidget();

        $('body').off('.deleting');
    });

    DeletingState.prototype.getElementToRemove = function(){

        var $container = this.widget.$container;

        //if is a choice widget:

        if($container.hasClass('qti-choice')){
            return $container;
        }

        //inline widget:
        if($container.hasClass('widget-inline')){
            return $().add($container).add(this.widget.$original);
        }

        //block widget:
        var $col = $container.parent();
        var $row = $col.parent('.grid-row');
        if($row.length){

            if($row.children().length === 1){
                //if it is the only col in the row, hide the entire row
                return $row;
            }else{
                //else, hide the current one ...
                return $col;
            }
        }else if($container.hasClass('grid-row')){
            //rubric block:
            return $container;
        }
    };

    DeletingState.prototype.hideWidget = function(){

        var $elt = this.$elementToRemove;

        if($elt.length){
            $elt.hide();
            if(_isCol($elt)){
                //it is a column : redistribute the units of the columdn to the others
                this.refactoredUnits = _redistributeUnits($elt);
            }
        }
    };

    var _isCol = function($col){
        var attrClass = $col.attr('class');
        return (attrClass && /col-([\d]+)/.test(attrClass));
    };

    var _redistributeUnits = function($col){

        var usedUnits = $col.data('units');
        var $otherCols = $col.siblings();
        var cols = [];

        $otherCols.each(function(){

            var $col = $(this),
                units = $col.data('units');

            cols.push({
                elt : $col,
                units : units
            });

            usedUnits += units;
        });

        cols = gridUnits.redistribute(cols);

        _.each(cols, function(col){
            col.elt.removeClass('col-' + col.units).addClass('col-' + col.refactoredUnits);
            gridHelper.setUnitsFromClass(col.elt);
        });

        //store results in the element for future ref?
        $col.data('redistributedUnits', cols);

        return cols;
    };

    DeletingState.prototype.showWidget = function(){

        var $elt = this.$elementToRemove;
        if($elt.length){
            $elt.show();
            if(_isCol($elt)){
                //restore the other units:
                _.each(this.refactoredUnits, function(col){
                    col.elt.removeClass('col-' + col.refactoredUnits).addClass('col-' + col.units);
                    gridHelper.setUnitsFromClass(col.elt);
                });
            }
        }
    };

    DeletingState.prototype.showMessage = function(){

        var _this = this,
            _widget = this.widget;

        var $messageBox = deletingHelper.createInfoBox([_widget]);

        $messageBox.on('confirm.deleting', function(){

            _this.deleteElement();

        }).on('undo.deleting', function(){
            
            try{
                _widget.changeState('question');
            }catch(e){
                _widget.changeState('active');
            }
        });

        this.messageBox = $messageBox;
    };
    
    DeletingState.prototype.deleteElement = function(){
        this.widget.element.remove();//remove from model
        this.$elementToRemove.remove();//remove html from the dom
        this.widget.destroy();//remove what remains of the widget (almost nothing)
    };

    return DeletingState;
});