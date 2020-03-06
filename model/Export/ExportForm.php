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
 * Copyright (c) 2008-2010 (original work) Deutsche Institut für Internationale Pädagogische Forschung (under the project TAO-TRANSFER);
 *               2009-2012 (update and modification) Public Research Centre Henri Tudor (under the project TAO-SUSTAIN & TAO-DEV);
 *
 */

namespace oat\taoQtiItem\model\Export;

use common_Exception;
use common_exception_UserReadableException;
use core_kernel_classes_Class;
use core_kernel_classes_Resource;
use League\Flysystem\FileNotFoundException;
use oat\tao\model\export\ExportElementException;
use oat\taoQtiItem\model\ItemModel;
use oat\taoQtiItem\model\qti\Service;
use tao_helpers_Display;
use tao_helpers_form_FormContainer;
use tao_helpers_form_FormFactory;
use tao_helpers_form_xhtml_Form;
use tao_helpers_form_xhtml_TagWrapper;
use tao_helpers_Uri;
use taoItems_models_classes_ItemsService;

/**
 * Export form for QTI packages
 *
 * @access  public
 * @author  Joel Bout, <joel.bout@tudor.lu>
 * @package taoItems
 */
abstract class ExportForm extends tao_helpers_form_FormContainer
{
    // --- ASSOCIATIONS ---


    // --- ATTRIBUTES ---

    // --- OPERATIONS ---
    /**
     * Short description of method initForm
     *
     * @access public
     * @return mixed
     * @author Joel Bout, <joel.bout@tudor.lu>
     */
    public function initForm()
    {
        $this->form = new tao_helpers_form_xhtml_Form('export');

        $this->form->setDecorators(
            [
                'element' => new tao_helpers_form_xhtml_TagWrapper(['tag' => 'div']),
                'group' => new tao_helpers_form_xhtml_TagWrapper(['tag' => 'div', 'cssClass' => 'form-group']),
                'error' => new tao_helpers_form_xhtml_TagWrapper(
                    ['tag' => 'div', 'cssClass' => 'form-error ui-state-error ui-corner-all']
                ),
                'actions-bottom' => new tao_helpers_form_xhtml_TagWrapper(
                    ['tag' => 'div', 'cssClass' => 'form-toolbar']
                ),
                'actions-top' => new tao_helpers_form_xhtml_TagWrapper(
                    ['tag' => 'div', 'cssClass' => 'form-toolbar']
                )
            ]
        );

        $exportElt = tao_helpers_form_FormFactory::getElement('export', 'Free');
        $exportElt->setValue(
            '<a href="#" class="form-submitter btn-success small"><span class="icon-export"></span> ' . __(
                'Export'
            ) . '</a>'
        );

        $this->form->setActions([$exportElt], 'bottom');
    }

    /**
     * overriden
     *
     * @access public
     * @return mixed
     * @throws common_Exception
     * @author Joel Bout, <joel.bout@tudor.lu>
     */
    public function initElements()
    {
        $itemService = taoItems_models_classes_ItemsService::singleton();

        $fileName = '';
        $options = [];
        $disabledOptions = [];
        if (isset($this->data['items'])) {
            $fileName = strtolower(tao_helpers_Display::textCleaner($this->data['file_name']));
            foreach ($this->data['items'] as $instance) {
                if ($itemService->hasItemModel($instance, [ItemModel::MODEL_URI])) {
                    try {
                        $this->isInstanceValid($instance);
                    } catch (common_exception_UserReadableException $e) {
                        $disabledOptions[$instance->getUri()] = $e->getUserMessage();
                    }
                    $options[$instance->getUri()] = $instance->getLabel();
                }
            }
        } elseif (isset($this->data['instance'])) {
            $item = $this->data['instance'];
            if (
                $item instanceof core_kernel_classes_Resource
                && $itemService->hasItemModel($item, [ItemModel::MODEL_URI])
            ) {
                $fileName = strtolower(tao_helpers_Display::textCleaner($item->getLabel()));
                try {
                    $this->isInstanceValid($item);
                } catch (common_exception_UserReadableException $e) {
                    $disabledOptions[$item->getUri()] = $e->getUserMessage();
                }
                $options[$item->getUri()] = $item->getLabel();
            }
        } else {
            $class = $this->data['class'] ?? $itemService->getRootClass();

            if ($class instanceof core_kernel_classes_Class) {
                $fileName = strtolower(tao_helpers_Display::textCleaner($class->getLabel(), '*'));
                foreach ($class->getInstances(true) as $instance) {
                    if ($itemService->hasItemModel($instance, [ItemModel::MODEL_URI])) {
                        try {
                            $this->isInstanceValid($instance);
                        } catch (common_exception_UserReadableException $e) {
                            $disabledOptions[$instance->getUri()] = $e->getUserMessage();
                        }
                        $options[$instance->getUri()] = $instance->getLabel();
                    }
                }
            }
        }

        $nameElt = tao_helpers_form_FormFactory::getElement('filename', 'Textbox');
        $nameElt->setDescription(__('File name'));
        $nameElt->setValue($fileName);
        $nameElt->setUnit(".zip");
        $nameElt->addValidator(tao_helpers_form_FormFactory::getValidator('NotEmpty'));
        $this->form->addElement($nameElt);

        $instanceElt = tao_helpers_form_FormFactory::getElement('instances', 'Checkbox');
        $instanceElt->setDescription(__('Items'));

        if (count($options) > 1) {
            $instanceElt->setAttribute('checkAll', true);
        }

        $instanceElt->setOptions(tao_helpers_Uri::encodeArray($options, tao_helpers_Uri::ENCODE_ARRAY_KEYS));
        $instanceElt->setReadOnly(tao_helpers_Uri::encodeArray($disabledOptions, tao_helpers_Uri::ENCODE_ARRAY_KEYS));
        foreach (array_keys($options) as $value) {
            if (!isset($disabledOptions[$value])) {
                $instanceElt->setValue($value);
            }
        }
        $this->form->addElement($instanceElt);


        $this->form->createGroup('options', '<h3>' . $this->getFormGroupName() . '</h3>', ['filename', 'instances']);
    }

    protected function isInstanceValid($item)
    {

        try {
            $xml = Service::singleton()->getXmlByRdfItem($item);
        } catch (FileNotFoundException $e) {
        }

        if (empty($xml)) {
            throw new ExportElementException($item, __('no item content'));
        }

        return true;
    }

    /**
     * Get the form group name to be display
     * @return string
     */
    abstract protected function getFormGroupName();
}
