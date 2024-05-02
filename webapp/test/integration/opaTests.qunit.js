/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["mw/osllm/chat/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
