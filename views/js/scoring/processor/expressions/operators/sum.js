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
 * Copyright (c) 2015 (original work) Open Assessment Technlogies SA (under the project TAO-PRODUCT);
 *
 */

/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define([
    'lodash'
], function(_){

    var sumProcessor = {

        constraints : {
            minOperand : 1,
            maxOperand : -1,
            cardinalities : ['single', 'multiple', 'ordered'],
            baseTypes : ['int', 'float']
        },

        operands   : [],

        //TODO better type checking and casting
        process : function(){

            //if at least one element is null, then break and return null
            if(_.some(this.operands, _.isNull) === true){
                return null;
            }

            return _(this.operands)
                .filter(function(value){
                    return _.isNumber(value) && !_.isNaN(value) && _.isFinite(value);
                })
                .reduce(function(sum, value){
                    return sum + value;
                });
        }
    };

    return sumProcessor;
});
