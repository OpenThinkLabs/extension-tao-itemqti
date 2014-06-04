<div class="preview-overlay tao-scope overlay preview-{{previewType}} item-no-print"
     style="overflow-x: hidden;display:none">
    <div class="preview-container-outer">
        <div class="preview-canvas">
            <form class="preview-utility-bar plain">
                <div class="preview-utility-bar-inner grid-row">

                    <div class="col-4">
                        <input type="hidden" value="" class="standard-device-selector preview-device-selector" data-target="standard">
                        <select class="preview-type-selector">
                            {{#each previewTypes}}
                            <option value="{{value}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
                            {{/each}}
                        </select>
                    </div>
                    <div class="col-6 standard-only device-type-and-orientation"></div>
                    <div class="col-6 desktop-only device-type-and-orientation">
                        <select class="desktop-device-selector preview-device-selector" data-target="desktop">
                            {{#each desktopDevices}}
                            <option value="{{value}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
                            {{/each}}
                        </select>
                    </div>
                    <div class="col-6 mobile-only device-type-and-orientation">
                        <select class="mobile-device-selector preview-device-selector" data-target="mobile">
                            {{#each mobileDevices}}
                            <option value="{{value}}" {{#if selected}}selected="selected"{{/if}}>{{label}}</option>
                            {{/each}}
                        </select>
                        <select tabindex="-1" class="mobile-orientation-selector orientation-selector"
                                data-target="mobile">
                            <option value="landscape">{{__ 'Landscape'}}</option>
                            <option value="portrait">{{__ 'Portrait'}}</option>
                        </select>
                    </div>
                    <div class="col-2">
                            <span class="btn-info small preview-closer rgt">
                                {{__ 'Close'}}
                                <span class="icon-close r"></span>
                            </span>
                    </div>
                </div>
                <div class="preview-message-box">
                    <div class="feedback-info small">
                        <span class="icon-info"></span>
                        {{__ 'This preview may be scaled to fit your screen. The final rendering may differ.'}}
                        <a href="#">{{__ 'Don’t show this again!'}}</a>
                        <span title="{{__ 'Remove this message'}}" class="icon-close close-trigger"></span>
                    </div>
                </div>
            </form>
            <div class="preview-scale-container">
                <div class="{{previewType}}-preview-frame preview-outer-frame {{previewType}}-preview-landscape">
                    <div class="{{previewType}}-preview-container preview-container">
                        <iframe class="preview-iframe"></iframe>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>