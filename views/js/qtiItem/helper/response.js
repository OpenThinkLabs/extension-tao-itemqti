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
 * Copyright (c) 2014-2017 (original work) Open Assessment Technlogies SA (under the project TAO-PRODUCT);
 *
 */
define(['lodash'], function(_) {
    'use strict';

    var _templateNames = {
        'MATCH_CORRECT': 'http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct',
        'MAP_RESPONSE': 'http://www.imsglobal.org/question/qti_v2p1/rptemplates/map_response',
        'MAP_RESPONSE_POINT': 'http://www.imsglobal.org/question/qti_v2p1/rptemplates/map_response_point'
    };

    return {
        isUsingTemplate: function isUsingTemplate(response, tpl) {
            if (_.isString(tpl)) {
                if (tpl === response.template || _templateNames[tpl] === response.template) {
                    return true;
                }
            }
            return false;
        },
        isValidTemplateName: function isValidTemplateName(tplName) {
            return !!this.getTemplateUriFromName(tplName);
        },
        getTemplateUriFromName: function getTemplateUriFromName(tplName) {
            if (_templateNames[tplName]) {
                return _templateNames[tplName];
            }
            return '';
        },
        getTemplateNameFromUri: function getTemplateNameFromUri(tplUri) {
            var tplName = '';
            _.forIn(_templateNames, function (uri, name) {
                if (uri === tplUri) {
                    tplName = name;
                    return false;
                }
            });
            return tplName;
        },
        setNormalMaximum: function setNormalMaximum(item) {
            var self = this;
            var normalMaximum;

            if (item.responseProcessing && item.responseProcessing.processingType === 'templateDriven') {
                normalMaximum = _.reduce(item.getInteractions(), function (acc, interaction) {
                    var maxChoice;
                    var responseDeclaration = interaction.getResponseDeclaration();
                    var template = self.getTemplateNameFromUri(responseDeclaration.template);
                    var max;
                    if (template === 'MATCH_CORRECT') {
                        maxChoice = parseInt(interaction.attr('maxChoices'));
                        if(maxChoice && _.isArray(responseDeclaration.correctResponses) && responseDeclaration.correctResponses.length > maxChoice){
                            max = 0;
                        }else{
                            max = 1;
                        }
                    }
                    return acc + max;
                }, 0);
            }

            item.getOutcomeDeclaration('SCORE').attr('normalMaximum', normalMaximum);
        }
    };
});