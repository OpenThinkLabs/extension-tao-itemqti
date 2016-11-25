/**
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
 * Copyright (c) 2014 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */

define([
    'lodash',
    'taoQtiItem/qtiCommonRenderer/renderers/Math',
    'taoQtiItem/qtiCreator/widgets/static/math/Widget',
    'taoQtiItem/qtiItem/core/Element'
], function(_, Renderer, Widget, Element){
    'use strict';

    var CreatorMath = _.clone(Renderer);

    CreatorMath.render = function(math, options){

        //initial rendering:
        var parent = math.parent();
        if (! Element.isA(parent, 'hottext')) { // todo: improve this and make it work for Gapmatch?
            Renderer.render(math);

            Widget.build(
                math,
                Renderer.getContainer(math),
                this.getOption('bodyElementOptionForm'),
                options
            );
        }

    };

    return CreatorMath;
});
