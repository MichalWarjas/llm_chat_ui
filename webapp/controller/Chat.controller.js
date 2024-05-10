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
                var oSettingsModel = new JSONModel({ new_topic: true, busy: true, loaded: false })
                this.getView().setModel(oModel);
                this.getView().setModel(oSettingsModel, "settings");

                var oModelData = {
                    "SelectedModel": "models/4B/Phi-3-mini-4k-instruct-fp16.gguf",
                    "ModelCollection": [
                        {
                            "ModelId": "models/4B/Phi-3-mini-4k-instruct-fp16.gguf",
                            "Name": "Phi-3-mini-4k-instruct-fp16.gguf"
                        },
                        {
                            "ModelId": "models/8B/dolphin-2.9-llama3-8b-q8_0.gguf",
                            "Name": "dolphin-2.9-llama3-8b-q8_0.gguf"
                        },
                        {
                            "ModelId": "models/7B/mistral-7b-instruct-v0.2.Q5_K_M.gguf",
                            "Name": "mistral-7b-instruct-v0.2.Q5_K_M.gguf"
                        },
                        {
                            "ModelId": "models/7B/bielik-7b-instruct-v0.1.Q8_0.gguf",
                            "Name": "bielik-7b-instruct-v0.1.Q8_0.gguf"
                        }
                    ]
                };

                this.getView().setModel(new JSONModel(oModelData), "models")
            },
            onAfterRendering: function(oEvent){
                const oSettingsModel = this.getView().getModel("settings");
                const oModelsModel = this.getView().getModel("models");
      
                  fetch("http://127.0.0.1:8000/status", {
                        method: 'GET'}).then((response) =>{
                        response.json().then( (startResult) => {
                            const { Status, modelName } = startResult;
                            if (Status === "Initialized") {
                                oSettingsModel.setProperty("/busy", false);
                                oSettingsModel.setProperty("/loaded", true);
                                oModelsModel.setProperty("/SelectedModel",modelName);
                                MessageToast.show(`Model ${modelName} loaded`);
                            } else {
                                oSettingsModel.setProperty("/busy", false);
                                MessageToast.show(`Model status is ${Status}. Please load a model `);
                            }
                     } ).catch(
                            (error) => {
                                oSettingsModel.setProperty("/busy", false);
                                console.error('Failed to fetch external data', error);
                                MessageToast.show(`Failed to fetch external data ${error}`);
                            }
                        );
                  
                    }).catch( (error) => {
                    oSettingsModel.setProperty("/busy", false);
                    console.error('Failed to fetch external data', error);
                    MessageToast.show(`Failed to fetch external data ${error}`);
                });
            },
            resetChat: function () {
                const oModel = this.getView().getModel();
                const oSettingsModel = this.getView().getModel("settings");
                oModel.setData({
                    EntryCollection: []
                });
                oSettingsModel.setProperty("/new_topic", true);
            },
            loadModel: async function () {
                let llm = this.getView().getModel("models").getProperty("/SelectedModel");
                var oSettingsModel = this.getView().getModel("settings");
                oSettingsModel.setProperty("/busy", true);
                try {
                    const response = await fetch("http://127.0.0.1:8000/loadmodel", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ ModelId: llm }),
                    });
                    const startResult = await response.json();
                    const { startup_status } = startResult;
                    if (startup_status) {
                        oSettingsModel.setProperty("/busy", false);
                        oSettingsModel.setProperty("/loaded", true);
                        MessageToast.show(startup_status);
                    } else {
                        MessageBox.error("Something went wrong");
                        oSettingsModel.setProperty("/busy", false);
                        console.error(startResult);
                    }
                } catch (error) {
                    oSettingsModel.setProperty("/busy", false);
                    console.error('Failed to fetch external data', error);
                    MessageToast.show(`Failed to fetch external data ${error}`);
                }
            },
            fetchExternalData: async function (question) {
                var oSettingsModel = this.getView().getModel("settings");
                var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                var oDate = new Date();
                var sDate = oFormat.format(oDate);
                try {
                    const response = await fetch("http://127.0.0.1:8000/generate", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(question),
                    });
                    const aiResponse = await response.json();
                    const { generated_response } = aiResponse;
                    console.log(aiResponse);
                    var oEntry = {
                        Author: "Helpful assistant",
                        AuthorPicUrl: "./pictures/helpful_assistant.jpg",
                        Type: "Reply",
                        Date: "" + sDate,
                        Text: generated_response
                    };

                    // update model
                    var oModel = this.getView().getModel();
                    var aEntries = oModel.getData().EntryCollection;
                    if (aEntries && aEntries.length > 0) {
                        aEntries.unshift(oEntry);
                    } else {
                        aEntries = [oEntry];
                    }
                    oModel.setData({
                        EntryCollection: aEntries
                    });
                    oSettingsModel.setProperty("/busy", false);
                } catch (error) {
                    oSettingsModel.setProperty("/busy", false);
                    console.error('Failed to fetch external data', error);
                    MessageToast.show(`Failed to fetch external data ${error}`);
                }
            },
            onPost: function (oEvent) {
                var oSettingsModel = this.getView().getModel("settings");
                var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                var oDate = new Date();
                var sDate = oFormat.format(oDate);
                // create new entry
                var sValue = oEvent.getParameter("value");
                let new_topic = oSettingsModel.getProperty("/new_topic");
                const myQuestion = { "user_input": sValue, "new_topic": new_topic };

                if (new_topic) {
                    oSettingsModel.setProperty("/new_topic", false);
                }
                oSettingsModel.setProperty("/busy", true);
                this.fetchExternalData(myQuestion);
                var oEntry = {
                    Author: "Curious user",
                    AuthorPicUrl: "./pictures/john_conor.jpg",
                    Type: "Reply",
                    Date: "" + sDate,
                    Text: sValue
                };

                // update model
                var oModel = this.getView().getModel();
                var aEntries = oModel.getData().EntryCollection;
                if (aEntries && aEntries.length > 0) {
                    aEntries.unshift(oEntry);
                } else {
                    aEntries = [oEntry];
                }
                oModel.setData({
                    EntryCollection: aEntries
                });
            },
            onInitializeModel: async function(oEvent){
                var oSettingsModel = this.getView().getModel("settings");
                try {
                    const response = await fetch("http://127.0.0.1:8000/initialize", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
                    const initResult = await response.json();
                    const { Initialized } = initResult;
                    if (Initialized == "true") {
                        oSettingsModel.setProperty("/busy", false);
                        oSettingsModel.setProperty("/loaded", false);
                        MessageToast.show("Model has been initialized");
                        this.resetChat()
                    } else {
                        MessageBox.error("Something went wrong");
                        oSettingsModel.setProperty("/busy", false);
                        console.error(initResult) ;
                    }
                } catch (error) {
                    oSettingsModel.setProperty("/busy", false);
                    console.error('Failed to fetch external data', error);
                    MessageToast.show(`Failed to fetch external data ${error}`);
                }
            },

            onSenderPress: function (oEvent) {
                MessageToast.show("Clicked on Link: " + oEvent.getSource().getSender());
            },

            onIconPress: function (oEvent) {
                MessageToast.show("Clicked on Image: " + oEvent.getSource().getSender());
            }
        });
    });
