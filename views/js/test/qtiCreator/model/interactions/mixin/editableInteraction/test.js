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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
define([
    'jquery',
    'taoQtiItem/qtiCreator/component/itemAuthoring',
    'json!taoQtiItem/test/samples/json/choice-editableinteraction.json',
    'lib/jquery.mockjax/jquery.mockjax'
], function ($, itemAuthoringFactory, itemJson) {
    'use strict';

    function getInstance(fixture, config = {}) {
        return itemAuthoringFactory(fixture, config)
            .on('error ready', function () {
                this.destroy();
            });
    }

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Mock the item data query
    $.mockjax({
        url: /mockItemEndpoint/,
        response: function () {
            this.responseText = {
                success: true,
                itemIdentifier: 'item-1',
                itemData: itemJson
            };
        }
    });

    QUnit.module('editableInteraction mixin');

    QUnit.test('createResponse', function (assert) {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const config = {
            properties: {
                uri: 'http://item#rdf-123',
                label: 'Item',
                baseUrl: 'http://foo/bar',
                itemDataUrl: '//mockItemEndpoint'
            }
        };

        const instance = itemAuthoringFactory($container, config)
            .on('ready', function () {
                const item = instance.getItemCreator().getItem();
                const interaction = item.getInteractions()[0];

                // enable per interaction response processing
                item.metaData.widget.options.perInteractionRp = true;

                interaction.createResponse();
                const outcomeIdentifier = `SCORE_${interaction.attributes.responseIdentifier}`;

                let outcome = item.outcomes[
                    Object.keys(item.outcomes)
                        .find(outcomeSerial => item.outcomes[outcomeSerial].attributes.identifier === outcomeIdentifier)
                ];

                assert.equal(
                    typeof outcome,
                    'object',
                    'creates interaction response outcome declaration'
                );

                interaction.beforeRemove();

                outcome = item.outcomes[
                    Object.keys(item.outcomes)
                        .find(outcomeSerial => item.outcomes[outcomeSerial].attributes.identifier === outcomeIdentifier)
                ];

                assert.equal(
                    typeof outcome,
                    'undefined',
                    'removes interaction response outcome declaration'
                );

                instance.destroy();
            })
            .after('destroy', function () {
                ready();
            });
    });

    QUnit.test('beforeRemove', function (assert) {
        const ready = assert.async();
        const $container = $('#fixture-render');
        const config = {
            properties: {
                uri: 'http://item#rdf-123',
                label: 'Item',
                baseUrl: 'http://foo/bar',
                itemDataUrl: '//mockItemEndpoint'
            }
        };

        const instance = itemAuthoringFactory($container, config)
            .on('ready', function () {
                const item = instance.getItemCreator().getItem();
                const [firstInteraction, secondInteraction] = item.getInteractions();

                // enable per interaction response processing
                item.metaData.widget.options.perInteractionRp = true;

                firstInteraction.createResponse();
                secondInteraction.createResponse();
                const outcomeIdentifier = `SCORE_RESPONSE`;

                firstInteraction.beforeRemove();

                const outcome = item.outcomes[
                    Object.keys(item.outcomes)
                        .find(outcomeSerial => item.outcomes[outcomeSerial].attributes.identifier === outcomeIdentifier)
                ];

                assert.equal(
                    secondInteraction.attributes.responseIdentifier,
                    'RESPONSE',
                    'if there is only one interaction left changes its identifier to RESPONSE'
                )

                assert.equal(
                    outcome.attributes.identifier,
                    'SCORE_RESPONSE',
                    'if there is only one interaction left changes its response outcome identifier to SCORE_RESPOSE'
                );

                instance.destroy();
            })
            .after('destroy', function () {
                ready();
            });
    });
});
