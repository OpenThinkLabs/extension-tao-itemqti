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
 * Copyright (c) 2015 (original work) Open Assessment Technologies SA ;
 *
 */
define([
    'lodash',
    'taoQtiItem/apipCreator/api/authoringObject',
    'taoQtiItem/apipCreator/api/accessElementInfo/registry'
], function (_, authoringObject, registry) {
    'use strict';

    function AccessElementInfo(apipItem, node, accessElementInfoType) {
        if (!node) {
            node = this.createXMLNode(apipItem, accessElementInfoType);
        }
        authoringObject.init(this, apipItem, node);
    }

    /**
     * Create xml node of appropriate type.
     * @param {object} apipItem apipItem creator api instance 
     * @see {@link package-tao\taoQtiItem\views\js\apipCreator\api\apipItem.js}
     * @returns {Object} created XML node
     */
    AccessElementInfo.prototype.createXMLNode = function createXMLNode(apipItem, accessElementInfoType) {
        if (!registry[accessElementInfoType]) {
            throw new TypeError(accessElementInfoType + ' type is not supported.');
        }
        return registry[accessElementInfoType].createXMLNode(apipItem);
    };

    AccessElementInfo.prototype.remove = function remove() {
        //access elementInfos may require some serial to make it easier to find
    };

    /**
     * Get the attribute value for the access element info
     * 
     * @param {String} name
     * @returns {Mixed}
     */
    AccessElementInfo.prototype.getAttribute = function getAttribute(name) {
        return;
    };

    /**
     * Set the attribute value for the access element info
     * 
     * @param {String} name
     * @param {Mixed} value
     * @returns {Object} the accessElementInfo itself for chaining
     */
    AccessElementInfo.prototype.setAttribute = function setAttribute(name, value) {
        return this;
    };

    /**
     * Get the "parent" access element
     * 
     * @returns {accessElement}
     */
    AccessElementInfo.prototype.getAssociatedAccessElement = function getAssociatedAccessElement() {
        return {};
    };

    return AccessElementInfo;
});