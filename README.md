## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Thu May 02 2024 10:09:55 GMT+0200 (Central European Summer Time)|
|**App Generator**<br>@sap/generator-fiori-freestyle|
|**App Generator Version**<br>1.5.1|
|**Generation Platform**<br>Visual Studio Code|
|**Floorplan Used**<br>simple|
|**Service Type**<br>None|
|**Service URL**<br>N/A
|**Module Name**<br>mw.osllm.chat|
|**Application Title**<br>Open Source LLMs chat|
|**Namespace**<br>|
|**UI5 Theme**<br>sap_fiori_3|
|**UI5 Version**<br>1.123.1|
|**Enable Code Assist Libraries**<br>False|
|**Add Eslint configuration**<br>False|
|**Enable Telemetry**<br>True|

## mw.osllm.chat

Chat with different opensource llms

### Starting the generated app

-   This app has been generated using the SAP Fiori tools - App Generator, as part of the SAP Fiori tools suite.  In order to launch the generated app, simply run the following from the generated app root folder:

```
    npm start
```

#### Pre-requisites:

1. Active NodeJS LTS (Long Term Support) version and associated supported NPM version.  (See https://nodejs.org)


To avoid CORS issue when interfering with the API configure proxy 
for example for nginx
  GNU nano 6.2                                                                          /etc/nginx/sites-available/reverse-proxy                                                                                   
server {
    listen <your_API_host>:80;
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /status {
        proxy_pass http://127.0.0.1:8000/status;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /initialize {
        proxy_pass http://127.0.0.1:8000/initialize;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
     location /loadmodel {
        proxy_pass http://127.0.0.1:8000/loadmodel;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location /generate {
        proxy_pass http://127.0.0.1:8000/generate;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

}


