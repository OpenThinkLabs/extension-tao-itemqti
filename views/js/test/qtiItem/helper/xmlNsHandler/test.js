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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA;
 */
define([
    'jquery',
    'lodash',
    'taoQtiItem/qtiItem/helper/xmlNsHandler',
    'text!taoQtiItem/test/samples/qtiv2p2/xml_namespaces/with-ns.xml',
    'text!taoQtiItem/test/samples/qtiv2p2/xml_namespaces/without-ns.xml',
    'taoQtiItem/qtiItem/core/Loader',
    'taoQtiItem/qtiItem/core/Container',
    'taoQtiItem/qtiXmlRenderer/renderers/Renderer'
], function($, _, xmlNsHandler, nsXml, noNsXml, Container, XmlRenderer){
    'use strict';


    var getXmlDoc = function getXmlDoc(xmlStr) {
        return (new DOMParser()).parseFromString(xmlStr, 'text/xml');
    };

    QUnit.test('Strip prefixes', function(assert){

        var xml, prefixed, i;

        xml = getXmlDoc(nsXml);
        assert.equal(
            !!xml.documentElement.getAttribute('xmlns:originalPrefix'),
            true,
            'Initially the XML has a namespace for HTML5 elements'
        );

        prefixed = xml.querySelectorAll('ruby, rt, rb');
        i = prefixed.length;
        while(i--) {
            assert.equal(
                prefixed[i].prefix, 'originalPrefix', 'Initially this <' + prefixed[i].localName + '> element has an HTML5 prefix'
            );
        }

        // remove ns and re-initialize
        nsXml = xmlNsHandler.stripNs(nsXml);
        xml = getXmlDoc(nsXml);

        prefixed = xml.querySelectorAll('ruby, rt, rb');
        i = prefixed.length;
        while(i--) {
            assert.equal(
                prefixed[i].prefix, null, 'After stripNs() this <' + prefixed[i].localName + '> element has no longer an HTML5 prefix'
            );
        }
    });

    QUnit.test('Restore prefixes', function(assert){

        var xml, prefixed, i;

        xml = getXmlDoc(nsXml);
        assert.equal(
            !!xml.documentElement.getAttribute('xmlns:originalPrefix'),
            true,
            'Initially the XML uses the prefix "originalPrefix" for the namespace for HTML5 elements'
        );

        // remove, than restore ns and re-initialize
        nsXml = xmlNsHandler.stripNs(nsXml);
        nsXml = xmlNsHandler.restoreNs(nsXml, { originalPrefix: "http://www.imsglobal.org/xsd/imsqtiv2p2_html5_v1p0" });
        xml = getXmlDoc(nsXml);

        prefixed = xml.querySelectorAll('ruby, rt, rb');
        i = prefixed.length;
        while(i--) {
            assert.equal(
                prefixed[i].prefix, 'originalPrefix', '<' + prefixed[i].localName + '> element has the prefix "originalPrefix"'
            );
        }
    });


    QUnit.test('Add required namespace and prefixes', function(assert){

        var xml, prefixed, i;

        xml = getXmlDoc(noNsXml);
        assert.equal(
            !xml.documentElement.getAttribute('xmlns:originalPrefix'),
            true,
            'Initially the XML has no namespace for HTML5 elements'
        );

        // Add some code that requires namespacing. In real life this would for instance come from CK-Editor
        noNsXml = noNsXml.replace('__PLACEHOLDER__', '<ruby><rb>北海道</rb><rt>ほっかいどう</rt></ruby>');
        noNsXml = xmlNsHandler.restoreNs(noNsXml, {});

        // qh5 is the default prefix
        xml = getXmlDoc(noNsXml);
        assert.equal(
            !!xml.documentElement.getAttribute('xmlns:qh5'),
            true,
            'After adding elements that require an HTML5 namespace XML has the attribute "xmlns:qh5"'
        );

        prefixed = xml.querySelectorAll('ruby, rt, rb');
        i = prefixed.length;
        while(i--) {
            assert.equal(
                prefixed[i].prefix, 'qh5', '<' + prefixed[i].localName + '> element has the default prefix "qh5"'
            );
        }
    });
});
