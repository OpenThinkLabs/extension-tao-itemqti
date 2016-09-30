<?php
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
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *
 *
 */
namespace oat\taoQtiItem\test;

use oat\tao\test\TaoPhpUnitTestRunner;
use oat\taoQtiItem\model\ItemCategoriesService;
use Prophecy\Prophet;

/**
 *
 * @author Antoine Robin, <antoine@taotesting.com>
 * @package taoQtiItem
 */
class ItemCategoriesServiceTest extends TaoPhpUnitTestRunner
{

    /**
     * tests initialization
     * load qti service
     */
    public function setUp(){
        TaoPhpUnitTestRunner::initTest();
    }


    public function testGetCategories(){
        $itemProphecy1 = $this->prophesize('\core_kernel_classes_Resource');
        $itemProphecy2 = $this->prophesize('\core_kernel_classes_Resource');
        $itemProphecy3 = $this->prophesize('\core_kernel_classes_Resource');
        $itemProphecy4 = $this->prophesize('\core_kernel_classes_Resource');
        $itemProphecy5 = $this->prophesize('\core_kernel_classes_Resource');

        $properties = array('subject', 'difficulty');

        $item1Properties = array(
            'subject' => array(
                new \core_kernel_classes_Resource('science'),
                new \core_kernel_classes_Literal('math')
            ),
            'difficulty' => array(
                new \core_kernel_classes_Literal('medium')

            )
        );

        $item2Properties = array(
            'subject' => array(
                new \core_kernel_classes_Resource('ELA'),
            )
        );

        $item3Properties = array(
            'subject' => array(
                new \core_kernel_classes_Literal('math')
            ),
            'difficulty' => array(
                new \core_kernel_classes_Literal('low')

            )
        );

        $item4Properties = array();

        $item5Properties = array(
            'subject' => array(
                new \core_kernel_classes_Resource('ELA'),
            ),
            'difficulty' => array(
                new \core_kernel_classes_Literal('high')

            )
        );

        $itemProphecy1->getPropertiesValues($properties)->willReturn($item1Properties);
        $itemProphecy1->getUri()->willReturn('itemUri1');
        $itemProphecy2->getPropertiesValues($properties)->willReturn($item2Properties);
        $itemProphecy2->getUri()->willReturn('itemUri2');
        $itemProphecy3->getPropertiesValues($properties)->willReturn($item3Properties);
        $itemProphecy3->getUri()->willReturn('itemUri3');
        $itemProphecy4->getPropertiesValues($properties)->willReturn($item4Properties);
        $itemProphecy4->getUri()->willReturn('itemUri4');
        $itemProphecy5->getPropertiesValues($properties)->willReturn($item5Properties);
        $itemProphecy5->getUri()->willReturn('itemUri5');

        $items = array(
            $itemProphecy1->reveal(),
            $itemProphecy5->reveal(),
            $itemProphecy3->reveal(),
            $itemProphecy4->reveal(),
            $itemProphecy2->reveal(),
        );

        $expected = array(
            'itemUri1' => array('science', 'math', 'medium'),
            'itemUri5' => array('ELA', 'high'),
            'itemUri3' => array('math', 'low'),
            'itemUri4' => array(),
            'itemUri2' => array('ELA'),
        );
        /** @var ItemCategoriesService $itemCategoriesService */
        $itemCategoriesService = new ItemCategoriesService(array('properties' => array('subject', 'difficulty')));
        $categories = $itemCategoriesService->getCategories($items);

        $this->assertEquals($expected, $categories);
    }

    public function testGetItems(){



    }

}