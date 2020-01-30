## OAUTH2
It is necessary to use [OAUTH2 to get an access token](https://github.com/reddit-archive/reddit/wiki/OAuth2) in order to make POST requests to modmail. If no POST requests to modmail are needed, then  you do not need to create an access token.

First, authorize the app at the following URL:  
> ```https://www.reddit.com/api/v1/authorize?client_id=${process.env.CLIENT_ID}&response_type=code&state=${ARBITRARY_CODEWORD}&redirect_uri=${REDIRECT_URI}&duration=permanent&scope=modmail```  


Then use the code at the end of the URL in the following curl command:  
> ```curl -X POST --data "grant_type=authorization_code&code=${CODE}&redirect_uri=${REDIRECT_URI}" -H 'Authorization: Basic ${AUTHORIZATION_CODE}' https://www.reddit.com/api/v1/access_token```
  
>The format for the authorization code is `client_id:client_secret` in base 64 encoding.