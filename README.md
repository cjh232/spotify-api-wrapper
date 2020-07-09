# spotify-api-wrapper
Node JS wrapper for Spotify REST API

## Progress
Wrapper is in it's inital stages and will be updated heavily.

## Usage

First, you must instantaite the wrapper. 

```js
var sp = require('spotify-web-api');
```
### Future Authentication:

Wrapper will eventually use **Authorization Code Flow with Proof Key for Code Exchange (PKCE)** to avoid the need for a Client Secret.

> The authorization code flow with PKCE is the best option for mobile and desktop applications where it is unsafe to store your client secret. It provides your app with an access token that can be refreshed.

For more information, refer to the [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow)

To declare the Spotify class you will need to provide the **Client ID** and a **Redirect URI**.

```js
var spotify = new sp.Spotify('[Client Id]', '[Redirect URL]');
```

### Current Authentication

For now the wrapper uses **Authorization Code Flow** and will require a Client Secret, Cliend Id, and Redirect URI when instantiating.

```js
var spotify = new sp.Spotify('[Client Id]', '[Client Secret]', '[Redirect URL]');
```
***The three arguments above must match the information found on the Spotify Dev Dashboard. Otherwise, the program will not work.***

