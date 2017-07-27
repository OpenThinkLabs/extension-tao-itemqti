<?php
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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA
 *
 */
namespace oat\taoQtiItem\model\qti;

use \DOMElement;

/**
 * Trait EventManagerAwareTrait
 * @package taoQtiItem
 */
trait PortableElementTrait
{
    /**
     * Serialize an associative array of pci properties into a pci xml
     *
     * @param array $properties
     * @param string $ns
     * @return string
     */
    private function serializePortableProperties($properties, $ns = '', $nsUri = '', $name = null, $element = null){
        $document = null;
        $result = '';

        if ($element === null) {
            $document = new \DomDocument();
            $element = $ns ?
                $document->createElementNS($nsUri, $ns . ':properties') :
                $document->createElement('properties');

            $document->appendChild($element);
        } else {
            $newElement = $ns ?
                $element->ownerDocument->createElementNS($nsUri, $ns . ':properties') :
                $element->ownerDocument->createElement('properties');

            $element->appendChild($newElement);
            $element = $newElement;
        }

        if ($name !== null) {
            $element->setAttribute('key', $name);
        }

        foreach ($properties as $name => $value) {
            if(is_array($value)){
                $this->serializePortableProperties($value, $ns, $nsUri, $name, $element);
            } else {
                $entryElement = $ns ?
                    $element->ownerDocument->createElementNS($nsUri, $ns . ':entry') :
                    $element->ownerDocument->createElementNS('entry');

                $entryElement->setAttribute('key', $name);
                $entryElement->appendChild(new \DOMText($value));
                $element->appendChild($entryElement);
            }
        }

        if ($document !== null) {
            foreach ($document->childNodes as $node) {
                $result .= $document->saveXML($node);
            }
        }

        return $result;
    }

    /**
     * Parse a pci properties dom node into an associative array
     *
     * @param DOMElement $propertiesNode
     * @param string $ns
     * @return array
     */
    private function extractProperties(DOMElement $propertiesNode, $ns = ''){

        $properties = array();
        $ns = $ns ? trim( $ns, ':' ) . ':' : '';

        foreach($propertiesNode->childNodes as $prop){

            if($prop instanceof DOMElement){
                switch($prop->tagName){
                    case $ns.'entry':
                    case $ns.'property':
                        $key = $prop->getAttribute('key');
                        $properties[$key] = $prop->nodeValue;
                        break;
                    case $ns.'properties':
                        $key = $prop->getAttribute('key');
                        $properties[$key] = $this->extractProperties($prop, $ns);
                        break;
                }
            }
        }

        return $properties;
    }
}