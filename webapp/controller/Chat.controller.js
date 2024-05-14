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

            countdown: 5000,
            intervalHandle: null,



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
                this.getStatus(false,false);
            },

            restartStatusTimer: function(firstTime){
              console.log("Session Timer will be reset");
              if(this.intervalHandle != null){
                this.stopStatusTimer();
                this.startStatusTimer(firstTime);
              }else{
                this.startStatusTimer();
              }
            },
            startStatusTimer: function(firstTime){
                this.intervalHandle = setInterval(() =>{
                    this._statusCountdown(firstTime);
                    console.log("fetching new status");

                }, this.countdown);
                
                let iSeconds = this.countdown / 1000;
                console.log(`New status will be fetched in ${iSeconds} seconds`);
            },
            stopStatusTimer: function(){
                if(this.intervalHandle != null){
                    clearInterval(this.intervalHandle);
                    this.intervalHandle = null;
                    console.log("Session timer deleted");
                }
            },
            _statusCountdown: function(firstTime){
                this.getStatus(firstTime,true);
            },
            getStatus: function(bFirstTime, retry){
                const oSettingsModel = this.getView().getModel("settings");
                const oModelsModel = this.getView().getModel("models");
      
                  fetch("/status", {
                        method: 'GET'}).then((response) =>{
                            if(response.status >= 400 && response.status < 500){
                                MessageBox.error(`An error occurred while fetching model state. Response status: ${response.status}`);
                                oSettingsModel.setProperty("/busy", false);
                                this.stopStatusTimer();
                            }
                        response.json().then( (startResult) => {
                            const { Status, modelName } = startResult;
                            if (Status === "Initialized") {
                                oSettingsModel.setProperty("/busy", false);
                                oSettingsModel.setProperty("/loaded", true);
                                oModelsModel.setProperty("/SelectedModel",modelName);
                                MessageToast.show(`Model ${modelName} loaded`);
                                this.stopStatusTimer()
                            } else {
                                if(!retry){
                                MessageToast.show(`Model status is ${Status}. Please load a model `);
                                oSettingsModel.setProperty("/busy", false);
                                }else{
                                    if(bFirstTime){
                                    this.startStatusTimer(false)
                                    }
                                }
                            }
                     } ).catch(
                            (error) => {
                                console.error('Failed to fetch external data', error);
                            if(!retry){
                                oSettingsModel.setProperty("/busy", false);
                                MessageToast.show(`Failed to fetch external data ${error}`);
                            }else{
                                if(bFirstTime){
                                this.startStatusTimer(false)
                                }
                            }
                            }
                        );
                  
                    }).catch( (error) => {
                        console.error('Failed to fetch external data', error);
                        if(!retry){
                    oSettingsModel.setProperty("/busy", false);
                    MessageToast.show(`Failed to fetch external data ${error}`);
                }else{
                    if(bFirstTime){
                    this.startStatusTimer(false)
                    }
                }
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
                    const response = await fetch("/loadmodel", {
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
                        MessageToast.show("Please wait while model is being loaded to GPU");
                        console.error(startResult);
                        this.startStatusTimer(true)
                    }
                } catch (error) {
                    MessageToast.show("Please wait while model is being loaded to GPU");
                    console.error('Failed to fetch external data', error);
                    this.startStatusTimer(true)
                }
            },
            fetchExternalData: async function (question) {
                var oSettingsModel = this.getView().getModel("settings");
                var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                var oDate = new Date();
                var sDate = oFormat.format(oDate);
                try {
                    const response = await fetch("/generate", {
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
                    const response = await fetch("/initialize", {
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
