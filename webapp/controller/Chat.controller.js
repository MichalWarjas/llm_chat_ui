sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("mw.osllm.chat.controller.Chat", {
            onInit: function () {
                var sPath = sap.ui.require.toUrl("sap/m/sample/Feed/feed.json");
                var oModel = new JSONModel(sPath);
                this.getView().setModel(oModel);
            },
            onPost: function(oEvent) {
                var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                var oDate = new Date();
                var sDate = oFormat.format(oDate);
                // create new entry
                var sValue = oEvent.getParameter("value");
                var oEntry = {
                    Author: "Alexandrina Victoria",
                    AuthorPicUrl: "http://upload.wikimedia.org/wikipedia/commons/a/aa/Dronning_victoria.jpg",
                    Type: "Reply",
                    Date: "" + sDate,
                    Text: sValue
                };
    
                // update model
                var oModel = this.getView().getModel();
                var aEntries = oModel.getData().EntryCollection;
                aEntries.unshift(oEntry);
                oModel.setData({
                    EntryCollection: aEntries
                });
            },
    
            onSenderPress: function(oEvent) {
                MessageToast.show("Clicked on Link: " + oEvent.getSource().getSender());
            },
    
            onIconPress: function(oEvent) {
                MessageToast.show("Clicked on Image: " + oEvent.getSource().getSender());
            }
        });
    });
