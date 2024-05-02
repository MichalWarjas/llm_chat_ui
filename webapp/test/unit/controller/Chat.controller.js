/*global QUnit*/

sap.ui.define([
	"mw.osllm.chat/controller/Chat.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Chat Controller");

	QUnit.test("I should test the Chat controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
