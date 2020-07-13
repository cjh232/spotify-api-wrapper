# spotify-api-wrapper
Node JS wrapper for the RESTful Spotify API. Wrapper was built as a tool for a larger web application bootstrapped into any other applications being designed.

## Progress:
Wrapper is in it's inital stages and will be updated heavily.

## Features:

### Playlists
- Access a user's playlist by passing spotify user name
- Access current user's playlist
- Access a specific playlist by passing the spotify playlist Id
- Access the tracks on a playlist by passing the spotify playlist id

### Personalization
- Get current user's top tracks
- Get current user's top artists

### Profile
- Get current user's profile information
- Get a user's profile information

### TODO:
- Get user's liked songs
- Spotifty search

## Usage

First, you must instantaite the wrapper. 

```js
var sp = require('spotify-web-api');
```
### Future Authorization:

Wrapper will eventually use **Authorization Code Flow with Proof Key for Code Exchange (PKCE)** to avoid the need for a Client Secret.

> The authorization code flow with PKCE is the best option for mobile and desktop applications where it is unsafe to store your client secret. It provides your app with an access token that can be refreshed.

For more information, refer to the [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization-guide/#authorization-code-flow)

To declare the Spotify class you will need to provide the **Client ID** and a **Redirect URI**.

```js
var spotify = new sp.Spotify('[Client Id]', '[Redirect URL]');
```

### Current Authorization:

For now the wrapper uses **Authorization Code Flow** and will require a Client Secret, Cliend Id, and Redirect URI when instantiating.

```js
var spotify = new sp.Spotify('[Client Id]', '[Client Secret]', '[Redirect URL]');
```
***The three arguments above must match the information found on the Spotify Dev Dashboard. Otherwise, the program will not work.***

### Scopes:

Before making the authorization request from the User, you must specify the scope of the permissions you are asking for. Spotify offers a list of available scopes and
their descriptions [here](https://developer.spotify.com/documentation/general/guides/scopes/).

To set the scope you will need to pass a string array, with each index holding the specific scopes needed. This can be given to the **setScope()** function.

```js
let newScopes = [
    'playlist-read-collaborative', 
    'user-top-read',
    'playlist-read-private',
    'user-follow-read',
    'user-library-read',
]
spotify.setScope(newScopes);
```

