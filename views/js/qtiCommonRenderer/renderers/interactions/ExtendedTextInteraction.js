/*
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2014 (original work) Open Assessment Technlogies SA (under the project TAO-PRODUCT);
 *
 */

/**
 * @author Sam Sipasseuth <sam@taotesting.com>
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'i18n',
    'tpl!taoQtiItem/qtiCommonRenderer/tpl/interactions/extendedTextInteraction',
    'taoQtiItem/qtiCommonRenderer/helpers/container',
    'taoQtiItem/qtiCommonRenderer/helpers/instructions/instructionManager',
    'ckeditor',
    'taoQtiItem/qtiCommonRenderer/helpers/ckConfigurator',
    'polyfill/placeholders'
], function($, _, __, tpl, containerHelper, instructionMgr, ckEditor, ckConfigurator){
    'use strict';

    /**
     * Setting the pattern mask for the input, for browsers which doesn't support this feature
     * @param {jQuery} $element
     * @param {string} pattern
     * @returns {undefined}
     */
    var _setPattern = function($element, pattern){
        var patt = new RegExp('^'+pattern+'$');

        //test when some data is entering in the input field
        //@todo plug the validator + tooltip
        $element.on('keyup.commonRenderer', function(){
            $element.removeClass('field-error');
            if(!patt.test($element.val())){
                $element.addClass('field-error');
            }
        });
    };

    /**
     * Whether or not multiple strings are expected from the candidate to
     * compose a valid response.
     *
     * @param {object} interaction
     * @returns {boolean}
     */
    var _isMultiple = function(interaction) {
        var attributes = interaction.getAttributes();
        var response = interaction.getResponseDeclaration();
        return !!(attributes.maxStrings && (response.attr('cardinality') === 'multiple' || response.attr('cardinality') === 'ordered'));
    };

    /**
     * Init rendering, called after template injected into the DOM
     * All options are listed in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10296
     *
     * @param {object} interaction
     */
    var render = function(interaction){

        var $container = containerHelper.get(interaction);
        var attributes = interaction.getAttributes();

        var response = interaction.getResponseDeclaration();
        var multiple = _isMultiple(interaction);

        var $el, expectedLength, expectedLines, placeholderType;

        // ckEditor config event.
        ckEditor.on('instanceCreated', function(event) {
            var editor = event.editor,
                toolbarType = 'extendedText';

            editor.on('configLoaded', function(e) {
                editor.config = ckConfigurator.getConfig(editor, toolbarType, ckeOptions);
                editor.disableAutoInline = false; // NOT A GOOD IDEA, JUST TRY
            });

            editor.on('change', function(e) {
                containerHelper.triggerResponseChangeEvent(interaction, {});
            });
        });


        // if the input is textarea
        if (!multiple) {
            $el = $container.find('textarea');
            var ckeOptions = {
               extraPlugins: 'confighelper',
               resize_enabled: true
            };
            //setting the placeholder for the textarea
            if (attributes.placeholderText) {
                $el.attr('placeholder', attributes.placeholderText);
            }
            // Enable ckeditor only if text format is 'xhtml'.
            if (_getFormat(interaction) === 'xhtml') {
                // replace the textarea with ckEditor
                var editor = ckEditor.replace($container.find('.text-container')[0], ckeOptions);
                // store the instance inside data on the container
                _setCKEditor(interaction, editor);
            }
            else {
                $el.on('keyup.commonRenderer change.commonRenderer', function(e) {
                    containerHelper.triggerResponseChangeEvent(interaction, {});
                });
            }
            if (attributes.expectedLength || attributes.expectedLines || attributes.patternMask) {
                var $textarea = $('.text-container', $container),
                    $charsCounter = $('.count-chars',$container),
                    $wordsCounter = $('.count-words',$container);

                if (attributes.patternMask !== "") {
                    var maxWords = _parsePattern(attributes.patternMask, 'words'),
                        maxLength = _parsePattern(attributes.patternMask, 'chars');
                    maxWords = (isNaN(maxWords)) ? undefined : maxWords;
                    maxLength = (isNaN(maxLength) ? undefined : maxLength);
                }

                /**
                 * Prevent the user to enter more text (words or char) than the limit allow
                 * @param  {event} evt the event that is trigged and which call this function
                 */
                var limitUserInput = function(evt){
                    /**
                     * store the keycode regardless the format of the interaction
                     * @type {Number}
                     */
                    var keys = [
                        32, // space
                        13, // enter
                        2228237, // shift + enter in ckEditor
                    ];
                    var keyCode = (typeof evt.data !== "undefined") ? evt.data.keyCode : evt.which ;
                    if ((maxWords && getWordsCount() >= maxWords && _.contains(keys,keyCode)) || (maxLength && getCharsCount() >= maxLength)){
                        if (typeof evt.cancel !== "undefined"){
                            evt.cancel();
                        }else {
                            evt.preventDefault();
                        }
                        if(maxLength){
                            var value = _getTextareaValue(interaction, true);
                            setText(interaction,value);
                        }
                    }
                    updateCounter();
                };

                /**
                 * Update the rendering of the counters
                 */
                var updateCounter = function(){
                    $charsCounter.text(getCharsCount());
                    $wordsCounter.text(getWordsCount());
                };

                /**
                 * Get the number of words that are actually written in the response field
                 * @return {Number} number of words
                 */
                var getWordsCount = function(){
                    var value = _getTextareaValue(interaction);
                    return value.replace(/\s+/gi, ' ').split(' ').length;
                };

                /**
                 * Get the number of characters that are actually written in the response field
                 * @return {Number} number of characters
                 */
                var getCharsCount = function(){
                    var value = _getTextareaValue(interaction);
                    return value.length;
                };

                /**
                 * Keycode to ignore
                 * @type {Array}
                 */
                var keycodes = [
                    8, // backspace
                    222832, // Shift + backspace in ckEditor
                    1114120, // Ctrl + backspace in ckEditor
                    1114177, // Ctrl + a in ckEditor
                    1114202, // Ctrl + z in ckEditor
                    1114200, // Ctrl + x in ckEditor
                ];

                if (_getFormat(interaction) === "xhtml") {
                    _getCKEditor(interaction).on('key',function(e){
                        if (_.contains(keycodes,e.data.keyCode)){
                            updateCounter();
                        }else{
                            limitUserInput(e);
                        }
                    });
                }else{
                    $textarea.on('keydown.commonRenderer',function(e){
                       if (_.contains(keycodes,e.which)){
                            updateCounter();
                        }else{
                            limitUserInput(e);
                        }
                    });
                }

            }
        }
        else {
            $el = $container.find('input');

            //setting the checking for minimum number of answers
            if (attributes.minStrings) {

                //get the number of filled inputs
                var _getNumStrings = function($element) {

                    var num = 0;

                    $element.each(function() {
                        if ($(this).val() !== '') {
                            num++;
                        }
                    });

                    return num;
                };

                var minStrings = parseInt(attributes.minStrings);

                if (minStrings > 0) {

                    $el.on('blur.commonRenderer', function() {
                        setTimeout(function() {
                            //checking if the user was clicked outside of the input fields

                            //TODO remove notifications in favor of instructions

                            if (!$el.is(':focus') && _getNumStrings($el) < minStrings) {
                                instructionMgr.appendNotification(interaction, __('The minimum number of answers is ') + ' : ' + minStrings, 'warning');
                            }
                        }, 100);
                    });
                }
            }

            //set the fields width
            if (attributes.expectedLength) {
                expectedLength = parseInt(attributes.expectedLength, 10);

                if (expectedLength > 0) {
                    $el.each(function() {
                        $(this).css('width', expectedLength + 'em');
                    });
                }
            }

            //set the fields pattern mask
            if (attributes.patternMask) {
                $el.each(function() {
                    _setPattern($(this), attributes.patternMask);
                });
            }

            //set the fields placeholder
            if (attributes.placeholderText) {
                /**
                 * The type of the fileds placeholder:
                 * multiple - set placeholder for each field
                 * first - set placeholder only for first field
                 * none - dont set placeholder
                 */
                placeholderType = 'first';

                if (placeholderType === 'multiple') {
                    $el.each(function() {
                        $(this).attr('placeholder', attributes.placeholderText);
                    });
                }
                else if (placeholderType === 'first') {
                    $el.first().attr('placeholder', attributes.placeholderText);
                }
            }
        }
    };

    /**
     * Reset the textarea / ckEditor
     * @param  {object} interaction the interaction
     */
    var resetResponse = function(interaction) {
        if (_getFormat(interaction) === 'xhtml') {
            _getCKEditor(interaction).setData('');
        }else{
            containerHelper.get(interaction).find('input, textarea').val('');
        }
    };

    /**
     * Set the response to the rendered interaction.
     *
     * The response format follows the IMS PCI recommendation :
     * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
     *
     * Available base types are defined in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10296
     *
     * @param {object} interaction
     * @param {object} response
     */
    var setResponse = function(interaction, response) {

        var _setMultipleVal = function(identifier, value) {
            interaction.getContainer().find('#'+identifier).val(value);
        };

        var baseType = interaction.getResponseDeclaration().attr('baseType');

        if (response.base && response.base[baseType] !== undefined) {
            setText(interaction, response.base[baseType]);
        }
        else if (response.list && response.list[baseType]) {

            for (var i in response.list[baseType]) {
                var serial = (response.list.serial === undefined) ? '' : response.list.serial[i];
                _setMultipleVal(serial + '_' + i, response.list[baseType][i]);
            }

        }
        else {
            throw new Error('wrong response format in argument.');
        }
    };

    /**
     * Return the response of the rendered interaction
     *
     * The response format follows the IMS PCI recommendation :
     * http://www.imsglobal.org/assessment/pciv1p0cf/imsPCIv1p0cf.html#_Toc353965343
     *
     * Available base types are defined in the QTI v2.1 information model:
     * http://www.imsglobal.org/question/qtiv2p1/imsqti_infov2p1.html#element10296
     *
     * @param {object} interaction
     * @returns {object}
     */
    var getResponse = function(interaction) {

        var $container = containerHelper.get(interaction);
        var attributes = interaction.getAttributes();
        var responseDeclaration = interaction.getResponseDeclaration();
        var baseType = responseDeclaration.attr('baseType');
        var numericBase = attributes.base || 10;
        var multiple = !!(attributes.maxStrings && (responseDeclaration.attr('cardinality') === 'multiple' || responseDeclaration.attr('cardinality') === 'ordered'));
        var ret = multiple ? {list:{}} : {base:{}};

        if (multiple) {

            var values = [];

            $container.find('input').each(function(i) {

                var $el = $(this);

                if (attributes.placeholderText && $el.val() === attributes.placeholderText) {
                    values[i] = '';
                }
                else {
                    if (baseType === 'integer') {
                        values[i] = parseInt($el.val(), numericBase);
                        values[i] = isNaN(values[i]) ? '' : values[i];
                    }
                    else if(baseType === 'float') {
                        values[i] = parseFloat($el.val());
                        values[i] = isNaN(values[i]) ? '' : values[i];
                    }
                    else if(baseType === 'string') {
                        values[i] = $el.val();
                    }
                }
            });

            ret.list[baseType] = values;
        }
        else {

            var value = '';

            if (attributes.placeholderText && _getTextareaValue(interaction) === attributes.placeholderText) {
                value = '';
            }
            else {

                if (baseType === 'integer') {
                    value = parseInt(_getTextareaValue(interaction), numericBase);
                }
                else if (baseType === 'float') {
                    value = parseFloat(_getTextareaValue(interaction));
                }
                else if (baseType === 'string') {
                    value = _getTextareaValue(interaction, true);
                }
            }

            ret.base[baseType] = isNaN(value) && typeof value === 'number' ? '' : value;
        }

        return ret;
    };

    /**
     * return the value of the textarea or ckeditor data
     * @param  {Object} interaction
     * @param  {Boolean} raw Tells if the returned data does not have to be filtered (i.e. XHTML tags not removed)
     * @return {String}             the value
     */
    var _getTextareaValue = function(interaction, raw) {
        if (_getFormat(interaction) === 'xhtml') {
            return _ckEditorData(interaction, raw);
        }
        else {
            return containerHelper.get(interaction).find('textarea').val();
        }
    };

    /**
     * Sets the CKEditor instance
     * @param  {Object} interaction The interaction
     * @param {Object} [editor] CKEditor instance
     */
    var _setCKEditor = function(interaction, editor) {
        var name = editor && editor.name;
        var $container = containerHelper.get(interaction);

        if (name) {
            $container.data('editor', name);
        } else {
            $container.removeData('editor');
        }
    };

    /**
     * Gets the CKEditor instance
     * @param  {Object} interaction The interaction
     * @return {Object}             CKEditor instance
     */
    var _getCKEditor = function(interaction){
        var $container = containerHelper.get(interaction);
        var name = $container.data('editor');

        return ckEditor.instances[name];
    };

    /**
     * get the text content of the ckEditor ( not the entire html )
     * @param  {object} interaction the interaction
     * @param  {Boolean} raw Tells if the returned data does not have to be filtered (i.e. XHTML tags not removed)
     * @return {string}             text content of the ckEditor
     */
    var _ckEditorData = function(interaction, raw) {
        var editor = _getCKEditor(interaction);
        var data = editor && editor.getData() || '';

        if (!raw) {
            data = _stripTags(data);
        }

        return data;
    };

    /**
     * Remove HTML tags from a string
     * @param {String} str
     * @returns {String}
     * @private
     */
    var _stripTags = function(str) {
        var tempNode = document.createElement('div');
        tempNode.innerHTML = str;
        return tempNode.textContent;
    };

    var _getFormat = function(interaction) {
        var format = interaction.attr('format');

        switch (format) {
            case 'plain':
            case 'xhtml':
            case 'preformatted':
                return format;
            default:
                return 'plain';
        }
    };

    /**
     * parse the pattern (idealy from patternMask) and return the max words / chars from the pattern
     * @param  {String} pattern String from patternMask
     * @param  {String} type    the type of information you want : words / chars
     * @return {Number|null}    the number extracted of the pattern, or null if not found
     */
    var _parsePattern = function(pattern,type){
        if (pattern === undefined){return null;}

        var regexChar = /\^\[\\s\\S\]\{\d+\,(\d+)\}\$/,
        regexWords =  /\^\(\?\:\(\?\:\[\^\\s\\:\\!\\\?\\\;\\\…\\\€\]\+\)\[\\s\\:\\!\\\?\\;\\\…\\\€\]\*\)\{\d+\,(\d+)\}\$/,
        result;

        if (type === "words") {
            result = pattern.match(regexWords);
            if (result !== null && result.length > 1) {
                return parseInt(result[1],10);
            }else{
                return null;
            }
        }else if (type === "chars"){
            result = pattern.match(regexChar);

            if (result !== null && result.length > 1) {
                return parseInt(result[1],10);
            }else{
                return null;
            }
        }else{
            return null;
        }
    };

    var updateFormat = function(interaction, from) {
        var ckeOptions = {};
        var $container = containerHelper.get(interaction);

        if ( _getFormat(interaction) === 'xhtml') {
            var editor = ckEditor.replace($container.find('.text-container')[0], ckeOptions);
            _setCKEditor(interaction, editor);
        }
        else {
            // preFormatted or plain
            if (from === 'xhtml') {
                _getCKEditor(interaction).destroy();
            }
            if ( _getFormat(interaction) === 'preformatted'){
                $container.find('textarea').addClass('text-preformatted');
            } else{
                $container.find('textarea').removeClass('text-preformatted');
            }
        }
    };

    var enable = function(interaction) {
        var $container = containerHelper.get(interaction);
        var editor;

        $container.find('input, textarea').removeAttr('disabled');

        if (_getFormat(interaction) === 'xhtml') {
            editor = _getCKEditor(interaction);
            if (editor) {
                if (editor.status === 'ready') {
                    editor.setReadOnly(false);
                } else {
                    editor.readOnly = false;
                }
            }
        }
    };

    var disable = function(interaction) {
        var $container = containerHelper.get(interaction);
        var editor;

        $container.find('input, textarea').attr('disabled', 'disabled');

        if (_getFormat(interaction) === 'xhtml') {
            editor = _getCKEditor(interaction);
            if (editor) {
                if (editor.status === 'ready') {
                    editor.setReadOnly(true);
                } else {
                    editor.readOnly = true;
                }
            }
        }
    };

    var clearText = function(interaction) {
        setText(interaction, '');
    };

    var setText = function(interaction, text) {
        if ( _getFormat(interaction) === 'xhtml') {
            _getCKEditor(interaction).setData(text);
        }
        else {
            containerHelper.get(interaction).find('textarea').val(text);
        }
    };

     /**
     * Clean interaction destroy
     * @param {Object} interaction
     */
    var destroy = function(interaction){

        var $container = containerHelper.get(interaction);
        var $el = $container.find('input, textarea');

        _setCKEditor(interaction);

        //remove event
        $el.off('.commonRenderer');
        $(document).off('.commonRenderer');

        //remove instructions
        instructionMgr.removeInstructions(interaction);

        //remove all references to a cache container
        containerHelper.reset(interaction);
    };

    /**
     * Set the interaction state. It could be done anytime with any state.
     *
     * @param {Object} interaction - the interaction instance
     * @param {Object} state - the interaction state
     */
    var setState  = function setState(interaction, state){
        if(_.isObject(state)){
            if(state.response){
                try {
                    interaction.setResponse(state.response);
                } catch(e) {
                    interaction.resetResponse();
                    throw e;
                }
            }
        }
    };

    /**
     * Get the interaction state.
     *
     * @param {Object} interaction - the interaction instance
     * @returns {Object} the interaction current state
     */
    var getState = function getState(interaction){
        var state =  {};
        var response =  interaction.getResponse();

        if(response){
            state.response = response;
        }
        return state;
    };

    var getCustomData = function(interaction, data){
        var pattern = interaction.attr('patternMask'),
            maxWords = parseInt(_parsePattern(pattern,'words')),
            maxLength = parseInt(_parsePattern(pattern, 'chars')),
            expectedLength = parseInt(interaction.attr('expectedLines'),10);
        return _.merge(data || {}, {
            maxWords : (! isNaN(maxWords)) ? maxWords : undefined,
            maxLength : (! isNaN(maxLength)) ? maxLength : undefined,
            attributes : (! isNaN(expectedLength)) ? { expectedLength :  expectedLength * 72} : undefined
        });

    };

    /**
     * Expose the common renderer for the extended text interaction
     * @exports qtiCommonRenderer/renderers/interactions/ExtendedTextInteraction
     */
    return {
        qtiClass : 'extendedTextInteraction',
        template : tpl,
        render : render,
        getContainer : containerHelper.get,
        setResponse : setResponse,
        getResponse : getResponse,
        getData : getCustomData,
        resetResponse : resetResponse,
        destroy : destroy,
        getState : getState,
        setState : setState,

        updateFormat : updateFormat,
        enable : enable,
        disable : disable,
        clearText : clearText,
        setText : setText
    };
});
