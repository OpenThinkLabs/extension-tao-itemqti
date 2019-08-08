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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

define([
    'jquery',
    'taoQtiItem/qtiCreator/component/itemAuthoring',
    'json!taoQtiItem/test/samples/json/gapmatch-text-sam.json',
    'lib/jquery.mockjax/jquery.mockjax'
], function ($, itemAuthoringFactory, gapMatchJson) {
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
        response: function() {
            this.responseText = {
                success: true,
                itemIdentifier: 'item-1',
                itemData: gapMatchJson
            };
        }
    });

    QUnit.module('API');

    QUnit.test('module', function(assert) {
        var fixture = '#fixture-api';
        assert.expect(3);
        assert.equal(typeof itemAuthoringFactory, 'function', 'The module exposes a function');
        assert.equal(typeof getInstance(fixture), 'object', 'The factory produces an object');
        assert.notStrictEqual(getInstance(fixture), getInstance(fixture), 'The factory provides a different object on each call');
    });

    QUnit.cases.init([
        {title: 'getItemCreator'},
        {title: 'getAreaBroker'}
    ])
    .test('component API ', function(data, assert) {
        var instance = getInstance('#fixture-api');
        assert.expect(1);
        assert.equal(typeof instance[data.title], 'function', `The instance exposes a "${data.title}" function`);
    });

    QUnit.module('interact');

    QUnit.test('create a choice (using button)', function(assert) {
        var done = assert.async();
        var $container = $('#fixture-render');
        var config = {
            properties: {
                uri: 'http://item#rdf-123',
                label: 'Item',
                baseUrl: 'http://foo/bar',
                itemDataUrl: '//mockItemEndpoint'
            }
        };
        var instance;

        assert.expect(8);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = itemAuthoringFactory($container, config)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function() {
                var $interaction = $('.qti-interaction[data-qti-class="gapMatchInteraction"]', $container);
                var $choiceArea = $('.choice-area', $interaction);
                var $addChoiceBtn;

                assert.equal($interaction.length, 1, 'The interaction element is rendered');

                // make interaction active
                $interaction.click();

                $addChoiceBtn = $('[data-role="add-option"]', $choiceArea);
                assert.equal($addChoiceBtn.length, 1, 'The interaction contains 1 add choice button');

                assert.equal($('.qti-choice', $choiceArea).length, 10, 'There are 10 choices in the item initially');
                $addChoiceBtn.click();
                assert.equal($('.qti-choice', $choiceArea).length, 11, 'There are 11 choices in the item');
                $addChoiceBtn.click();
                assert.equal($('.qti-choice', $choiceArea).length, 12, 'There are 12 choices in the item');

                assert.equal($('.qti-choice', $choiceArea).last().children('div').text(), 'choice #2', 'The last added item got the right generated label');

                instance.destroy();
            })
            .after('destroy', function() {
                done();
            });
    });

    QUnit.test('visual', function(assert) {
        var ready = assert.async();
        var $container = $('#visual-test');
        var config = {
            properties: {
                uri: 'http://item#rdf-123',
                label: 'Item',
                baseUrl: 'http://foo/bar',
                itemDataUrl: '//mockItemEndpoint'
            }
        };
        var instance;

        assert.expect(2);

        assert.equal($container.children().length, 0, 'The container is empty');

        instance = itemAuthoringFactory($container, config)
            .on('init', function () {
                assert.equal(this, instance, 'The instance has been initialized');
            })
            .on('ready', function() {
                ready();
            });
    });
});
