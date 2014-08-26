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
 * Copyright (c) 2013 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 *               
 * 
 */

namespace oat\taoQtiItem\model;

use oat\taoQtiItem\model\Config;

/**
 * Interface defining required method for a plugin
 *
 * @package taoQTI
 
 */
Class Config
{   
    protected $properties = array();
    protected $interactions = array();
    protected $uiHooks = array();

    /**
     * Affect the config
     * 
     * @param \oat\taoQtiItem\model\creator\CreatorConfig $config
     */
    public function __construct(){
        
    }
    
    public function setProperty($key, $value){
        $this->properties[$key] = $value;
    }
    
    public function addInteraction($interactionPath){
        $this->interactions[] = $interactionPath;
    }
    
    public function addHook($pluginPath){
        $this->hooks[] = $pluginPath;
    }
    
    public function toArray(){
        
        return array(
            'properties' => $this->properties,
            'interactions' => $this->interactions,
            'uiHooks' => $this->uiHooks
        );
    }
    
}