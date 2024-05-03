sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
],
    function (Controller, MessageToast, DateFormat, JSONModel, MessageBox) {
        "use strict";

        return Controller.extend("mw.osllm.chat.controller.Chat", {
            onInit: function () {
                var oModel = new JSONModel();
                this.getView().setModel(oModel);
            },
            fetchExternalData: async function(question) {
                try {
                  const response = await fetch("http://127.0.0.1:8000/generate",{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(question),
                  });
                  const data = await response.json();
                  console.log(data);
                } catch (error) {
                  console.error('Failed to fetch external data', error);
                }
              },           
            onPost: function(oEvent) {
                var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                var oDate = new Date();
                var sDate = oFormat.format(oDate);
                // create new entry
                var sValue = oEvent.getParameter("value");
                this.fetchExternalData(sValue);
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
                if(aEntries && aEntries.length > 0){
                aEntries.unshift(oEntry);
                }else{
                aEntries = [oEntry];
                }
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
