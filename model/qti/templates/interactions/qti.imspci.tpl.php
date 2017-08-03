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
 * Copyright (c) 2017 (original work) Open Assessment Technologies SA (under the project TAO-PRODUCT);
 */
?>
<?php
$config = get_data('config');
?>
<customInteraction <?=get_data('attributes')?>>
    <portableCustomInteraction customInteractionTypeIdentifier="<?=get_data('typeIdentifier')?>" data-version="<?=get_data('version')?>" xmlns="http://www.imsglobal.org/xsd/portableCustomInteraction_v1">
        <?=get_data('serializedProperties')?>
        <modules<?if(isset($config[0])):?> primaryConfiguration="<?=$config[0]?>"<?endif;?><?if(isset($config[1])):?> fallbackConfiguration="<?=$config[1]?>"<?endif;?>>
            <?php foreach(get_data('modules') as $id => $paths):?>
                <module id="<?=$id?>"<?if(isset($paths[0])):?> primaryPath="<?=$paths[0]?>"<?endif;?><?if(isset($paths[1])):?> fallbackPath="<?=$paths[1]?>"<?endif;?>/>
            <?php endforeach;?>
        </modules>
        <markup>
            <?=get_data('markup')?>
        </markup>
    </portableCustomInteraction>
</customInteraction>