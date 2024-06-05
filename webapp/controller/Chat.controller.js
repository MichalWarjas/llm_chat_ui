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
            wrapper_counter: 0,

            onInit: function () {
                this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
                var oModel = new JSONModel();
                var oSettingsModel = new JSONModel({ new_topic: true, busy: true, loaded: false, confirmed:true })
                this.getView().setModel(oModel);
                this.getView().setModel(oSettingsModel, "settings");

                var oModelData = {
                    "SelectedModel": "models/8B/Phi-3-medium-4k-instruct-Q6_K.gguf",
                    "ModelCollection": [
                        {
                            "ModelId": "models/7B/Mistral-7B-Instruct-v0.3-Q6_K.gguf",
                            "Name": "Mistral-7B",
                            "order": 11
                        },
                        {
                            "ModelId": "models/4B/Phi-3-mini-4k-instruct-fp16.gguf",
                            "Name": "Phi-3-mini",
                            "order": 12
                        },
                        {
                            "ModelId": "models/8B/dolphin-2.9-llama3-8b-q8_0.gguf",
                            "Name": "dolphin-2.9-8B",
                            "order": 9
                        },
                        {
                            "ModelId": "models/7B/bielik-7b-instruct-v0.1.Q8_0.gguf",
                            "Name": "bielik-7b",
                            "order": 14
                        },
                        {
                            "ModelId": "models/8B/Phi-3-medium-4k-instruct-Q6_K.gguf",
                            "Name": "Phi-3-medium",
                            "order": 8
                        }
                    ]
                };

                this.getView().setModel(new JSONModel(oModelData), "models");

                this.disclaimerMessage();
            },
            disclaimerMessage: function () {
                MessageBox.warning(
                    `Welcome! Before we begin, please take a moment to read through this introductory message:

                    Thank you for choosing our application. This platform allows you to interact and collaborate with various Large Language Models (LLMs) in order to explore the full potential of AI-powered solutions across an array of domains. Please remember that, although these models have been trained on diverse datasets, they may still produce unpredictable results at times due to their inherent limitations and the complexity of natural language processing.
                    
                    As a user, it is essential for you to remain aware that we are not responsible or liable for any output generated by these models, including but not limited to misinformation, errors in judgment, or offensive content. It's crucial to exercise discretion and critical thinking when engaging with the LLM outputs and ensure they align with your individual needs and ethical standards.
                    
                    In case of any uncertainties or concerns during your interaction with our application, please do not hesitate to reach out for assistance. We encourage you to use this tool responsibly and enjoy exploring its capabilities!
                    
                    Now that you're familiar with the key aspects of using this platform, let's dive in and start interacting with these powerful language models!

                    Please click "OK" if you understood and accept the information above. Otherwise click "ABORT" to disable the application.
                    
                    Models licenses details are available below:
                    
                    `,
                    {
                        icon: MessageBox.Icon.WARNING,
                        title: "Dislaimer",
                        details: `Licenses:
                        <ul>
                        <li>Phi models: <a href="//huggingface.co/microsoft/Phi-3-medium-4k/resolve/main/LICENSE">MIT License </a></li>
                        <li>bielik-7b-instruct-v0.1.Q8_0.gguf:  <a href="//spdx.org/licenses/CC-BY-NC-4.0">CC BY NC 4.0 (non-commercial use)</a></li>
                        <li>dolphin-2.9-llama3-8b-q8_0.gguf: META LLAMA 3 COMMUNITY LICENSE AGREEMENT</li>
                        <li>Mistral-7B-Instruct-v0.3-Q6_K.gguf: <a href="//huggingface.co/datasets/choosealicense/licenses/blob/main/markdown/apache-2.0.md"> apache-2.0 </a></li>
                        </ul>`,
                        actions: [MessageBox.Action.OK, MessageBox.Action.ABORT],
                        emphasizedAction: MessageBox.Action.OK,
                        initialFocus: MessageBox.Action.ABORT,
                        onClose: this.onDisclaimerClose.bind(this)
                    }
                );
            },
            onDisclaimerClose: function(oEvent){
                const oSettingsModel = this.getView().getModel("settings");
                if(oEvent === "ABORT"){
                    oSettingsModel.setProperty("/confirmed",false);
                    MessageBox.error("Application disabled due to the user disclaimer disagreement");
                }else{
                    this.getStatus(false);
                }
            },
            onAfterRendering: function(oEvent){
            },
            getStatus: function(retry){
                const oSettingsModel = this.getView().getModel("settings");
                const oModelsModel = this.getView().getModel("models");
                console.log(`Getting status. Retry flag: ${retry}`);
                let currentlySelected = oModelsModel.getProperty("/SelectedModel");
                let cacheBuster = btoa(new Date().getTime());
                setTimeout(() =>{
                  fetch(`/status?vp=${cacheBuster}`, {
                        method: 'GET'}).then((response) =>{
                            if(response.status >= 400 && response.status < 502){
                                MessageBox.error(`An error occurred while fetching model state. Response status: ${response.status}`);
                                oSettingsModel.setProperty("/busy", false);
                            }else if(response.status > 503){
                                this.getStatus(true)
                            }else if(response.status === 502 || response.status === 503){
                                MessageBox.error(`AI service has been temporary switched off due to technical resources limitations. Please try again later or contact developer at warjas.michal.dev@gmail.com`);
                                oSettingsModel.setProperty("/busy", false);
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
                                MessageToast.show(`Model status is ${Status}. Loading model ${currentlySelected} `);
                                this.loadModel();
                                }else{
                                this.getStatus(true);
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
                this.resetChat();
                oSettingsModel.setProperty("/busy", true);
                let cacheBuster = btoa(new Date().getTime());
                try {
                    const response = await fetch(`/loadmodel?vp=${cacheBuster}`, {
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
            escapeHtml: function(unsafe) {
                return unsafe
                  .replace(/&/g, "&amp;") // Replace '&' with &amp;
                  .replace(/</g, "&lt;")   // Replace '<' with &lt;
                  .replace(/>/g, "&gt;")   // Replace '>' with &gt;
                  .replace(/"/g, "&quot;") // Replace '"' with &quot;
                  .replace(/'/g, "&#039;"); // Replace ''' with &#039;
              },
            wrapCode: function(input_text){

              let wrapped_text = input_text.replaceAll("```", () =>{
                let codeMarkup
                if(this.wrapper_counter % 2 === 0){
                    codeMarkup = "<code>";
                }else{
                    codeMarkup = "</code>"
                }
                this.wrapper_counter += 1;
                return codeMarkup;
              });  

              return wrapped_text;

            },
            getAnswer: function(first_time){
                const oSettingsModel = this.getView().getModel("settings");
                let cacheBuster = btoa(new Date().getTime());
                setTimeout(() =>{
                  fetch(`/answer?vp=${cacheBuster}`, {
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
                                Text: this.wrapCode(this.escapeHtml(generated_response))
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
                let cacheBuster = btoa(new Date().getTime());
                try {
                    const response = await fetch(`/generate?vp=${cacheBuster}`, {
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
                        Text: this.wrapCode(this.escapeHtml(generated_response))
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
                var sValue = this.wrapCode(this.escapeHtml(oEvent.getParameter("value")));
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
                let cacheBuster = btoa(new Date().getTime());
                try {
                    const response = await fetch(`/initialize?vp=${cacheBuster}`, {
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
