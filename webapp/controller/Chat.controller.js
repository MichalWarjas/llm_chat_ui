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
                    "SelectedModel": "models/8B/dolphin-2.9-llama3-8b-q8_0.gguf",
                    "ModelCollection": [
                        {
                            "ModelId": "models/7B/Mistral-7B-Instruct-v0.3-Q6_K.gguf",
                            "Name": "Mistral-7B-Instruct-v0.3-Q6_K.gguf",
                            "order": 11
                        },
                        {
                            "ModelId": "models/4B/Phi-3-mini-4k-instruct-fp16.gguf",
                            "Name": "Phi-3-mini-4k-instruct-fp16.gguf",
                            "order": 12
                        },
                        {
                            "ModelId": "models/8B/dolphin-2.9-llama3-8b-q8_0.gguf",
                            "Name": "dolphin-2.9-llama3-8b-q8_0.gguf",
                            "order": 9
                        },
                        {
                            "ModelId": "models/7B/mistral-7b-instruct-v0.2.Q5_K_M.gguf",
                            "Name": "mistral-7b-instruct-v0.2.Q5_K_M.gguf",
                            "order": 15
                        },
                        {
                            "ModelId": "models/7B/bielik-7b-instruct-v0.1.Q8_0.gguf",
                            "Name": "bielik-7b-instruct-v0.1.Q8_0.gguf",
                            "order": 14
                        },
                        {
                            "ModelId": "models/8B/Phi-3-medium-4k-instruct-Q6_K.gguf",
                            "Name": "Phi-3-medium-4k-instruct-Q6_K.gguf",
                            "order": 10
                        }
                    ]
                };

                this.getView().setModel(new JSONModel(oModelData), "models");

                this.disclaimerMessage();
            },
            disclaimerMessage: function () {
                MessageBox.warning(
                    "Initial button focus is set by attribute \n initialFocus: sap.m.MessageBox.Action.CANCEL",
                    {
                        icon: MessageBox.Icon.WARNING,
                        title: "Dislaimer",
                        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                        emphasizedAction: MessageBox.Action.OK,
                        initialFocus: MessageBox.Action.CANCEL
                    }
                );
            },
            onAfterRendering: function(oEvent){
                this.getStatus(false);
            },
            getStatus: function(retry){
                const oSettingsModel = this.getView().getModel("settings");
                const oModelsModel = this.getView().getModel("models");
                console.log(`Getting status. Retry flag: ${retry}`);
                setTimeout(() =>{
                  fetch("/status", {
                        method: 'GET'}).then((response) =>{
                            if(response.status >= 400 && response.status < 503){
                                MessageBox.error(`An error occurred while fetching model state. Response status: ${response.status}`);
                                oSettingsModel.setProperty("/busy", false);
                            }else if(response.status >= 503){
                                this.getStatus(true)
                            }else{
                        response.json().then( (startResult) => {
                            const { Status, modelName } = startResult;
                            if (Status === "Initialized") {
                                oModelsModel.setProperty("/SelectedModel",modelName);
                                MessageToast.show(`Model ${modelName} loaded`);
                                console.log(`Model ${modelName} loaded`);
                                this.getAnswer(true);
                            } else {
                                if(!retry){
                                MessageToast.show(`Model status is ${Status}. Please load a model `);
                                oSettingsModel.setProperty("/busy", false);
                                }else{
                                    this.getStatus(true)
                                }
                            }
                     } ).catch(
                            (error) => {
                                console.error('Failed to fetch external data', error);
                            if(!retry){
                                oSettingsModel.setProperty("/busy", false);
                                MessageToast.show(`Failed to fetch external data ${error}`);
                            }else{          
                                this.getStatus(true);
                            }
                            }
                        );
                    }
                  
                    }).catch( (error) => {
                        console.error('Failed to fetch external data', error);
                        if(!retry){
                    oSettingsModel.setProperty("/busy", false);
                    MessageToast.show(`Failed to fetch external data ${error}`);
                }else{
                 this.getStatus(true);
                }
                })}, 5000);
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
                        this.getStatus(true)
                    }
                } catch (error) {
                    MessageToast.show("Please wait while model is being loaded to GPU");
                    console.error('Failed to fetch external data', error);
                    this.getStatus(true)
                }
            },
            getAnswer: function(first_time){
                const oSettingsModel = this.getView().getModel("settings");
                setTimeout(() =>{
                  fetch("/answer", {
                        method: 'GET'}).then((response) =>{
                            if(response.status >= 400 && response.status < 503){
                                MessageBox.error(`An error occurred while getting response. Response status: ${response.status}`);
                                oSettingsModel.setProperty("/busy", false);
                            }else if(response.status >= 503){
                                this.getAnswer()
                            }else{
                        response.json().then( (aiResponse) => {
                            const { generated_response } = aiResponse;
                            console.log(aiResponse);
                            if(generated_response === "Initial"){
                                if(first_time){
                                    oSettingsModel.setProperty("/busy", false);
                                    oSettingsModel.setProperty("/loaded", true);
                                }else{
                                MessageBox.error("Something went wrong please try again");
                                oSettingsModel.setProperty("/busy", false);
                                }
                            }else if(generated_response === "Running"){
                                if(first_time){
                                    MessageToast.show("It looks someone else is already using the app. Please try again later");
                                }else{
                                this.getAnswer();
                                }
                            }else{
                                if(first_time){
                                    oSettingsModel.setProperty("/busy", false);
                                    oSettingsModel.setProperty("/loaded", true);
                                }else{
                                var oFormat = DateFormat.getDateTimeInstance({ style: "medium" });
                                var oDate = new Date();
                                var sDate = oFormat.format(oDate);    
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
                        }
                        }
                     } ).catch(
                            (error) => {
                                console.error('Failed to fetch external data', error);
                                oSettingsModel.setProperty("/busy", false);
                                MessageToast.show(`Failed to fetch external data ${error}`);  
                            }
                        );
                    }
                  
                    }).catch( (error) => {
                        console.error('Failed to fetch external data', error);
                    oSettingsModel.setProperty("/busy", false);
                    MessageToast.show(`Failed to fetch external data ${error}`);
       
                })}, 2500);
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
                    if(generated_response === "Initial"){
                        MessageToast.show("Something went wrong please try again");
                    }else if(generated_response === "Running"){
                        this.getAnswer();
                    }else{
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
                }
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
