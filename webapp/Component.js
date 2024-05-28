sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "mw/osllm/chat/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("mw.osllm.chat.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            getContentDensityClass() {
                return Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";
            },
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);