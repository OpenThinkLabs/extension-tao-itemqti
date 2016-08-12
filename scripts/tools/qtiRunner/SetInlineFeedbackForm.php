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
 * Copyright (c) 2016  (original work) Open Assessment Technologies SA;
 *
 * @author Alexander Zagovorichev <zagovorichev@1pt.com>
 */

namespace oat\taoQtiItem\scripts\tools\qtiRunner;


use oat\oatbox\action\Action;
use oat\tao\model\ClientLibConfigRegistry;

/**
 * Change default "modal feedback" to inline
 *
 * Examples:
 *  turn on: php index.php "oat\taoQtiItem\scripts\tools\qtiRunner\SetInlineFeedbackForm" --inline
 *  turn off: php index.php "oat\taoQtiItem\scripts\tools\qtiRunner\SetInlineFeedbackForm"
 *
 * Class SetInlineFeedbackForm
 * @package oat\taoQtiItem\scripts\tools\qtiRunner
 */
class SetInlineFeedbackForm implements Action
{
    public function __invoke($params)
    {
        $inlineModel = in_array('inline', $params) || in_array('--inline', $params);

        ClientLibConfigRegistry::getRegistry()->register(
            'taoQtiItem/runner/provider/qti',
            array(
                'inlineModalFeedback' => $inlineModel
            )
        );

        return new \common_report_Report(\common_report_Report::TYPE_SUCCESS, $inlineModel ? 'Inline model was set' : 'Inline model was unset');
    }
}
