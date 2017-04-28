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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA;
 *
 */
define([
    'lodash',
    'lib/gamp/gamp',
    'taoQtiItem/qtiItem/helper/response',
    'taoQtiItem/qtiCreator/model/variables/OutcomeDeclaration'
], function(_, gamp, responseHelper, OutcomeDeclaration) {
    'use strict';

    /**
     * This variable allow to globally define if the minCHoice needs to be taken into consideration.
     * Standard-wise, it must definitely be considered.
     * However, the item delivery lifecycle currently does not consider the minChoice constraint during delivery.
     * It is thus currently set to true. After the correct behaviour is implemented, we should remove this variables.
     * @type {boolean}
     * @private
     */
    var _ignoreMinChoice = true;

    return {
        /**
         * Set the normal maximum to the item
         * @param {Object} item - the standard qti item model object
         */
        setNormalMaximum : function setNormalMaximum(item) {
            var normalMaximum,
                scoreOutcome = item.getOutcomeDeclaration('SCORE');

            if(!scoreOutcome){
                //invalid QTI item with missing mandatory SCORE outcome
                throw Error('no score outcome found');
            }

            //try setting the computed normal maximum only if the processing type is known, i.e. 'templateDriven'
            if (item.responseProcessing && item.responseProcessing.processingType === 'templateDriven') {
                normalMaximum = _.reduce(item.getInteractions(), function (acc, interaction) {
                    var interactionMaxScore = interaction.getNormalMaximum();
                    if(_.isNumber(interactionMaxScore)){
                        return gamp.add(acc, interactionMaxScore);
                    }else{
                        return false;
                    }
                }, 0);

                if(_.isNumber(normalMaximum)){
                    scoreOutcome.attr('normalMaximum', normalMaximum);
                }else{
                    scoreOutcome.removeAttr('normalMaximum');
                }
            }
        },

        /**
         * Set the maximum score of the item
         * @param {Object} item - the standard qti item model object
         */
        setMaxScore : function setMaxScore(item) {
            var hasInvalidInteraction = false,
                customOutcomes,
                maxScore,
                maxScoreOutcome;

            //try setting the computed normal maximum only if the processing type is known, i.e. 'templateDriven'
            if (item.responseProcessing && item.responseProcessing.processingType === 'templateDriven') {

                maxScore = _.reduce(item.getInteractions(), function (acc, interaction) {
                    var interactionMaxScore = interaction.getNormalMaximum();
                    if(_.isNumber(interactionMaxScore)){
                        return gamp.add(acc, interactionMaxScore);
                    }else{
                        hasInvalidInteraction = true;
                        return acc;
                    }
                }, 0);

                customOutcomes =  _(item.getOutcomes()).filter(function(outcome){
                    return (outcome.id() !== 'SCORE' && outcome.id() !== 'MAXSCORE');
                });

                if(customOutcomes.size()){
                    maxScore = customOutcomes.reduce(function (acc, outcome) {
                        return gamp.add(acc, parseFloat(outcome.attr('normalMaximum')));
                    }, maxScore);
                }

                if(!hasInvalidInteraction || customOutcomes.size()){
                    maxScoreOutcome = item.getOutcomeDeclaration('MAXSCORE');
                    if(!maxScoreOutcome){
                        //add new outcome
                        maxScoreOutcome = new OutcomeDeclaration({
                            cardinality : 'single',
                            baseType : 'float'
                        });

                        //attach the outcome to the item before generating item-level unique id
                        item.addOutcomeDeclaration(maxScoreOutcome);
                        maxScoreOutcome.buildIdentifier('MAXSCORE', false);
                    }
                    maxScoreOutcome.setDefaultValue(maxScore);
                }
            }
        },

        /**
         * Compute the maximum score of a "choice" typed interaction
         * @param {Object} interaction - a standard interaction model object
         * @returns {Number}
         */
        choiceInteractionBased : function choiceInteractionBased(interaction, options){
            var responseDeclaration = interaction.getResponseDeclaration();
            var mapDefault = parseFloat(responseDeclaration.mappingAttributes.defaultValue||0);
            var template = responseHelper.getTemplateNameFromUri(responseDeclaration.template);
            var max, maxChoice, minChoice, scoreMaps, requiredChoiceCount, totalAnswerableResponse, sortedMapEntries, i, missingMapsCount;

            options = _.defaults(options || {}, {maxChoices : 0, minChoices: 0});
            maxChoice = parseInt(interaction.attr('maxChoices')||options.maxChoices);
            minChoice = parseInt(interaction.attr('minChoices')||options.minChoices);
            if(maxChoice && minChoice && maxChoice < minChoice){
                return 0;
            }

            if (template === 'MATCH_CORRECT') {
                if(maxChoice && _.isArray(responseDeclaration.correctResponse) && responseDeclaration.correctResponse.length > maxChoice || responseDeclaration.correctResponse.length < minChoice){
                    //max choice does not enable selecting the correct responses
                    max = 0;
                }else if(!responseDeclaration.correctResponse || (_.isArray(responseDeclaration.correctResponse) && !responseDeclaration.correctResponse.length)){
                    //no correct response defined -> score always zero
                    max = 0;
                }else{
                    max = 1;
                }
            }else if(template === 'MAP_RESPONSE') {

                //prepare constraint params
                requiredChoiceCount = minChoice;
                totalAnswerableResponse = (maxChoice === 0) ? Infinity : maxChoice;

                //sort the score map entries by the score
                scoreMaps = _.values(responseDeclaration.mapEntries);
                sortedMapEntries = _(scoreMaps).map(function (v) {
                    return parseFloat(v);
                }).sortBy().reverse().take(totalAnswerableResponse);

                //if there is not enough map defined, compared to the minChoice constraint, fill in the rest of required choices with the default map
                missingMapsCount = minChoice - sortedMapEntries.size();
                for(i = 0; i < missingMapsCount;i++){
                    sortedMapEntries.push({score:mapDefault});
                }

                //calculate the maximum reachable score by choice map
                max = sortedMapEntries.reduce(function (acc, v) {
                    var score = v;
                    if(score < 0){
                        if(requiredChoiceCount <= 0){
                            //if the score is negative check if we have the choice not to pick it
                            score = 0;
                        }else{
                            //else, always take the best option
                            score = Math.max(mapDefault, score);
                        }
                    }
                    requiredChoiceCount--;
                    return gamp.add(acc, score);
                }, 0);

                //compare the calculated maximum with the mapping upperbound
                if (responseDeclaration.mappingAttributes.upperBound) {
                    max = Math.min(max, parseFloat(responseDeclaration.mappingAttributes.upperBound));
                }
            }else if(template === 'MAP_RESPONSE_POINT'){
                //map point response processing does not work on choice based interaction
                max = 0;
            }
            return max;
        },

        /**
         * Compute the maximum score of a "order" typed interaction
         * @param {Object} interaction - a standard interaction model object
         * @returns {Number}
         */
        orderInteractionBased : function orderInteractionBased(interaction){
            var minChoice = _ignoreMinChoice ? 0 : parseInt(interaction.attr('minChoices')||0);
            var maxChoice = parseInt(interaction.attr('maxChoices')||0);
            var responseDeclaration = interaction.getResponseDeclaration();
            var template = responseHelper.getTemplateNameFromUri(responseDeclaration.template);
            var max;

            if(maxChoice && minChoice && maxChoice < minChoice){
                return 0;
            }

            if (template === 'MATCH_CORRECT') {
                if(_.isArray(responseDeclaration.correctResponse) && (maxChoice && responseDeclaration.correctResponse.length > maxChoice) || (minChoice && responseDeclaration.correctResponse.length < minChoice)){
                    //max choice does not enable selecting the correct responses
                    max = 0;
                }else if(!responseDeclaration.correctResponse || (_.isArray(responseDeclaration.correctResponse) && !responseDeclaration.correctResponse.length)){
                    //no correct response defined -> score always zero
                    max = 0;
                }else{
                    max = 1;
                }
            }else if(template === 'MAP_RESPONSE' || template === 'MAP_RESPONSE_POINT') {
                //map response processing does not work on order based interaction
                max = 0;
            }
            return max;
        },

        /**
         * Compute the maximum score of a "associate" typed interaction
         * @param {Object} interaction - a standard interaction model object
         * @returns {Number}
         */
        associateInteractionBased : function associateInteractionBased(interaction){
            var responseDeclaration = interaction.getResponseDeclaration();
            var template = responseHelper.getTemplateNameFromUri(responseDeclaration.template);
            var max;
            var maxAssoc = parseInt(interaction.attr('maxAssociations')||0);
            var minAssoc = _ignoreMinChoice ? 0 : parseInt(interaction.attr('minAssociations')||0);
            var mapDefault = parseFloat(responseDeclaration.mappingAttributes.defaultValue||0);
            var requiredAssoc, totalAnswerableResponse, usedChoices, choicesIdentifiers, sortedMapEntries, i, missingMapsCount;

            if(maxAssoc && minAssoc && maxAssoc < minAssoc){
                return 0;
            }

            if (template === 'MATCH_CORRECT') {
                if(!responseDeclaration.correctResponse
                    || (_.isArray(responseDeclaration.correctResponse)
                    && (!responseDeclaration.correctResponse.length || maxAssoc && responseDeclaration.correctResponse.length > maxAssoc || minAssoc && responseDeclaration.correctResponse.length < minAssoc) )){
                    //no correct response defined -> score always zero
                    max = 0;
                }else{
                    max = 1;//is possible until proven otherwise

                    //get the list of choices used in map entries
                    choicesIdentifiers = [];
                    _.forEach(responseDeclaration.correctResponse, function(pair){
                        var choices;
                        if(!_.isString(pair)){
                            return;
                        }
                        choices = pair.trim().split(' ');
                        if(_.isArray(choices) && choices.length === 2){
                            choicesIdentifiers.push(choices[0].trim());
                            choicesIdentifiers.push(choices[1].trim());
                        }
                    });

                    //check if the choices usage are possible within the constraint defined in the interaction
                    _.forEach(_.countBy(choicesIdentifiers), function(count, identifier){
                        var matchMax;
                        var choice = interaction.getChoiceByIdentifier(identifier);
                        if(!choice){
                            max = 0;
                            return false;
                        }
                        matchMax = parseInt(choice.attr('matchMax'));
                        if(matchMax && matchMax < count){
                            max = 0;
                            return false;
                        }
                    });
                }
            }else if(template === 'MAP_RESPONSE') {

                requiredAssoc = minAssoc;
                totalAnswerableResponse = (maxAssoc === 0) ? Infinity : maxAssoc;
                usedChoices = {};

                //get the sorted list of mapentries ordered by the score
                sortedMapEntries = _(responseDeclaration.mapEntries).map(function(score, pair){
                    return {
                        score : parseFloat(score),
                        pair : pair
                    };
                }).sortBy('score').reverse().filter(function(mapEntry){
                    var pair = mapEntry.pair;
                    var choices, choiceId, choice;

                    if(!_.isString(pair)){
                        return false;
                    }

                    choices = pair.trim().split(' ');
                    if(_.isArray(choices) && choices.length === 2){
                        for(i = 0; i < 2; i++){
                            choiceId = choices[i];

                            //collect choices usage to check if the pair is possible
                            if(!usedChoices[choiceId]){
                                choice = interaction.getChoiceByIdentifier(choiceId);
                                if(!choice){
                                    //inexisting choice, skip
                                    return false;
                                }
                                usedChoices[choiceId] = {
                                    used : 0,
                                    max: parseInt(choice.attr('matchMax'))
                                };
                            }
                            if(usedChoices[choiceId].max && usedChoices[choiceId].used === usedChoices[choiceId].max){
                                //skip
                                return false;
                            }else{
                                usedChoices[choiceId].used ++;
                            }
                        }

                        return true;
                    }else{
                        //is not a correct response pair
                        return false;
                    }
                }).take(totalAnswerableResponse);

                //if there is not enough map defined, compared to the minChoice constraint, fill in the rest of required choices with the default map
                missingMapsCount = minAssoc - sortedMapEntries.size();
                for(i = 0; i < missingMapsCount;i++){
                    sortedMapEntries.push({score:mapDefault});
                }

                //reduce the ordered list of map entries to calculate the max score
                max = sortedMapEntries.reduce(function (acc, v) {
                    var score = v.score;
                    if(v.score < 0){
                        if(requiredAssoc <= 0){
                            //if the score is negative check if we have the choice not to pick it
                            score = 0;
                        }else{
                            //else, always take the best option
                            score = Math.max(mapDefault, score);
                        }
                    }
                    requiredAssoc--;
                    return gamp.add(acc, score);
                }, 0);

                //compare the calculated maximum with the mapping upperbound
                if (responseDeclaration.mappingAttributes.upperBound) {
                    max = Math.min(max, parseFloat(responseDeclaration.mappingAttributes.upperBound));
                }
            }else if(template === 'MAP_RESPONSE_POINT'){
                max = 0;
            }
            return max;
        },

        /**
         * Compute the maximum score of a "gap match" typed interaction
         * @param {Object} interaction - a standard interaction model object
         * @returns {Number}
         */
        gapMatchInteractionBased : function gapMatchInteractionBased(interaction){
            var responseDeclaration = interaction.getResponseDeclaration();
            var template = responseHelper.getTemplateNameFromUri(responseDeclaration.template);
            var maxAssoc = 0;
            var minAssoc = 0;
            var max, skippableWrongResponse, totalAnswerableResponse, usedChoices, usedGaps, group1, group2;

            if (template === 'MATCH_CORRECT') {
                if(!responseDeclaration.correctResponse || (_.isArray(responseDeclaration.correctResponse) && !responseDeclaration.correctResponse.length)){
                    //no correct response defined -> score always zero
                    max = 0;
                }else{
                    max = 1;//is possible until proven otherwise
                    group1 = [];
                    group2 = [];
                    _.forEach(responseDeclaration.correctResponse, function(pair){
                        var choices;
                        if(!_.isString(pair)){
                            return;
                        }
                        choices = pair.trim().split(' ');
                        if(_.isArray(choices) && choices.length === 2){
                            group1.push(choices[0].trim());
                            group2.push(choices[1].trim());
                        }
                    });

                    _.forEach(_.countBy(group1), function(count, identifier){
                        var choice = interaction.getChoiceByIdentifier(identifier);
                        var matchMax = parseInt(choice.attr('matchMax'));
                        if(matchMax && matchMax < count){
                            max = 0;
                            return false;
                        }
                    });

                    _.forEach(_.countBy(group2), function(count){
                        var matchMax = 1;//match max for a gap is always 1
                        if(matchMax && matchMax < count){
                            max = 0;
                            return false;
                        }
                    });
                }
            }else if(template === 'MAP_RESPONSE') {

                skippableWrongResponse = (minAssoc === 0) ? Infinity : minAssoc;
                totalAnswerableResponse = (maxAssoc === 0) ? Infinity : maxAssoc;
                usedChoices = {};
                usedGaps = {};
                max = _(responseDeclaration.mapEntries).map(function(score, pair){
                    return {
                        score : parseFloat(score),
                        pair : pair
                    };
                }).sortBy('score').reverse().filter(function(mapEntry){
                    var pair = mapEntry.pair;
                    var choices, choiceId, gapId, choice;

                    if(!_.isString(pair)){
                        return false;
                    }

                    choices = pair.trim().split(' ');
                    if(_.isArray(choices) && choices.length === 2){
                        choiceId = choices[0];
                        gapId = choices[1];
                        if(!usedChoices[choiceId]){
                            choice = interaction.getChoiceByIdentifier(choiceId);
                            if(!choice){
                                //inexisting choice, skip
                                return false;
                            }
                            usedChoices[choiceId] = {
                                used : 0,
                                max: parseInt(choice.attr('matchMax'))
                            };
                        }
                        if(usedChoices[choiceId].max && usedChoices[choiceId].used === usedChoices[choiceId].max){
                            //skip
                            return false;
                        }
                        usedChoices[choiceId].used ++;

                        if(!usedGaps[gapId]){
                            usedGaps[gapId] = {
                                used : 0,
                                max: 1
                            };
                        }
                        if(usedGaps[gapId].max && usedGaps[gapId].used === usedGaps[gapId].max){
                            //skip
                            return false;
                        }
                        usedGaps[gapId].used ++;

                        return true;
                    }else{
                        //is not a correct response pair
                        return false;
                    }
                }).take(totalAnswerableResponse).reduce(function (acc, v) {
                    var score = v.score;
                    if (score >= 0) {
                        return acc + score;
                    } else if (skippableWrongResponse > 0) {
                        skippableWrongResponse--;
                        return acc;
                    } else {
                        return acc + score;
                    }
                }, 0);

                //compare the calculated maximum with the mapping upperbound
                if (responseDeclaration.mappingAttributes.upperBound) {
                    max = Math.min(max, parseFloat(responseDeclaration.mappingAttributes.upperBound));
                }
            }else if(template === 'MAP_RESPONSE_POINT'){
                max = false;
            }
            return max;
        },

        /**
         * Compute the maximum score of a "select point" typed interaction
         * @param {Object} interaction - a standard interaction model object
         * @returns {Number}
         */
        selectPointInteractionBased : function selectPointInteractionBased(interaction){
            var maxChoice = parseInt(interaction.attr('maxChoices'));
            var minChoice = _ignoreMinChoice ? 0 : parseInt(interaction.attr('minChoices'));
            var responseDeclaration = interaction.getResponseDeclaration();
            var template = responseHelper.getTemplateNameFromUri(responseDeclaration.template);
            var max, skippableWrongResponse, totalAnswerableResponse;

            if (template === 'MATCH_CORRECT' || template === 'MAP_RESPONSE') {
                //such templates are not allowed
                return 0;
            }else if(template === 'MAP_RESPONSE_POINT'){
                //calculate the maximum reachable score by choice map
                skippableWrongResponse = (minChoice === 0) ? Infinity : minChoice;
                totalAnswerableResponse = (maxChoice === 0) ? Infinity : maxChoice;

                max = _(responseDeclaration.mapEntries).map(function (v) {
                    return parseFloat(v.mappedValue);
                }).sortBy().reverse().take(totalAnswerableResponse).reduce(function (acc, v) {
                    if (v >= 0) {
                        return acc + v;
                    } else if (skippableWrongResponse > 0) {
                        skippableWrongResponse--;
                        return acc;
                    } else {
                        return acc + v;
                    }
                }, 0);
                max = parseFloat(max);

                //compare the calculated maximum with the mapping upperbound
                if (responseDeclaration.mappingAttributes.upperBound) {
                    max = Math.min(max, parseFloat(responseDeclaration.mappingAttributes.upperBound));
                }
            }
            return max;
        },

        /**
         * Compute the maximum score of a "slider" typed interaction
         * @param {Object} interaction - a standard interaction model object
         * @returns {Number}
         */
        sliderInteractionBased : function sliderInteractionBased(interaction){
            var responseDeclaration = interaction.getResponseDeclaration();
            var template = responseHelper.getTemplateNameFromUri(responseDeclaration.template);
            var max, scoreMaps;

            if (template === 'MATCH_CORRECT') {
                if(!responseDeclaration.correctResponse || (_.isArray(responseDeclaration.correctResponse) && !responseDeclaration.correctResponse.length)){
                    //no correct response defined -> score always zero
                    max = 0;
                }else{
                    max = 1;
                }
            }else if(template === 'MAP_RESPONSE') {

                //calculate the maximum reachable score by choice map
                scoreMaps = _.values(responseDeclaration.mapEntries);
                max = _(scoreMaps).map(function (v) {
                    return parseFloat(v);
                }).max();
                max = parseFloat(max);

                //compare the calculated maximum with the mapping upperbound
                if (responseDeclaration.mappingAttributes.upperBound) {
                    max = Math.min(max, parseFloat(responseDeclaration.mappingAttributes.upperBound));
                }
            }else if(template === 'MAP_RESPONSE_POINT'){
                max = 0;
            }
            return max;
        },

        /**
         * Compute the maximum score of a "text entry" typed interaction
         * @param {Object} interaction - a standard interaction model object
         * @returns {Number}
         */
        textEntryInteractionBased : function textEntryInteractionBased(interaction){
            var responseDeclaration = interaction.getResponseDeclaration();
            var template = responseHelper.getTemplateNameFromUri(responseDeclaration.template);
            var max, scoreMaps;

            /**
             * Check that a response is possible or not according to the defined patternmask
             * @param {String} value
             * @returns {Boolean}
             */
            var isPossibleResponse = function isPossibleResponse(value){
                var patternMask = interaction.attr('patternMask');
                if(patternMask){
                    return !!value.match(new RegExp(patternMask));
                }else{
                    //no restriction by pattern so always possible
                    return true;
                }
            };

            if (template === 'MATCH_CORRECT') {
                if(!responseDeclaration.correctResponse || (_.isArray(responseDeclaration.correctResponse) && !responseDeclaration.correctResponse.length)){
                    //no correct response defined -> score always zero
                    max = 0;
                }else{
                    max = isPossibleResponse(responseDeclaration.correctResponse[0]) ? 1 : 0;
                }
            }else if(template === 'MAP_RESPONSE') {

                //calculate the maximum reachable score by choice map
                scoreMaps = _.values(_.filter(responseDeclaration.mapEntries, function(score, key){
                    return isPossibleResponse(key);
                }));
                max = _(scoreMaps).map(function (v) {
                    return parseFloat(v);
                }).max();
                max = parseFloat(max);

                //compare the calculated maximum with the mapping upperbound
                if (responseDeclaration.mappingAttributes.upperBound) {
                    max = Math.min(max, parseFloat(responseDeclaration.mappingAttributes.upperBound));
                }
            }else if(template === 'MAP_RESPONSE_POINT'){
                max = 0;
            }
            return max;
        }
    };
});