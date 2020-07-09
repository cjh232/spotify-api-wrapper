var request = require('request-promise');
var hashGen = require("crypto");
var querystring = require("querystring");


class Spotify {

    clientId;
    clientSecret;
    redirectUri;
    baseUrl = 'https://api.spotify.com/v1';
    refreshToken;
    accessToken;
    expirationTime;
    scope = "";

    constructor(clientId: string, clientSecret: string, redirectUri: string) {
        this.clientId = clientId;
        this.redirectUri = redirectUri;
        this.clientSecret = clientSecret;
    }

    _generateRandomString(length: number): string {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.-~';
      
        for (var i = 0; i < length; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
      }

    async _postRequest(options: object): Promise<any> {

        return new Promise( function(resolve, reject) {
            request.post(options)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(`POST: ${err.statusCode}`);
                })
        })

    }

    async _getRequest(options: object): Promise<any> {

        return new Promise( function(resolve, reject) {
            request.get(options)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(`GET: ${err.statusCode}`);
                })
        })
    }


    /* TODO:----------------
    
        1. [DONE] Create function to get access token from spotify API
        2. [DONE] Create authorization function ** Need to be tested in Angular for the proper flow
        3. Store codeVerifier into local storage in generateAuthorizationUrl()
        4. [DONE] Create a setAccessTokenExpiration() function
    
    */

    setRefreshToken(token: string): void {
        this.refreshToken = token;
    }

    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    setScope(scopes: string[]): void {
        var temp = "";

        for(var i = 0; i < scopes.length; i++) {
            temp += scopes[i];
            if(i + 1 < scopes.length) temp += " ";
        }

        this.scope = temp;
        //console.log(temp);
    }

    async renewAccessToken() {

        if(this.refreshToken == null) {
            throw 'No refresh token has been supplied.';
        }

        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + (Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64')) },
            form: {
            grant_type: 'refresh_token',
            refresh_token: this.refreshToken,
            },
            json: true
        };

        return new Promise((resolve, reject) => {
            this._postRequest(authOptions)
                .then(res => {
                    this.accessToken = res.access_token;
                    this._setAccessTokenExpirationTime(res.expires_in);
                    resolve(this.accessToken);
                })
                .catch(err => reject(err));
        })

        return Promise.resolve(this.accessToken);
    }

    async _verifyAccessToken() {

        if(!this._accessTokenIsValid()) {
            console.log("Access token has expired, renewing...");
            await this.renewAccessToken();
        } 

    }

    _accessTokenIsValid(): boolean {
        return new Date().getTime() < this.expirationTime;
    }

    _setAccessTokenExpirationTime(secondsRemaining: number): void {
        this.expirationTime = new Date().getTime() + (secondsRemaining * 1000); 
    }

    generateAuthorizationUrl() {
        // TODO: Store codeVerifier in local stoarge/cache
        var codeVerifier = this._generateRandomString(75);
        var codeChallenge = hashGen.createHash("sha256")
                                    .update(codeVerifier)
                                    .digest("base64");
                                    
        var authUrl = 'https://accounts.spotify.com/authorize?' + querystring.stringify({
            response_type: 'code',
            client_id: this.clientId,
            scope: this.scope,
            redirect_uri: 'http://localhost:8888/callback',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        })

        // console.log("Authorization URL:\n" + authUrl);
    }

    // TODO: Test this function once integrated into Angular
    async getNewTokenPair(codeVerifier: string, authCode: string) {

        var options = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            client_id: this.clientId,
            code: authCode,
            redirect_uri: this.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(this.clientId + ':' + this.clientSecret).toString('base64'))
        },
        json: true
        };

        var response = await this._postRequest(options);
        this.setAccessToken(response.access_token);
        this.setRefreshToken(response.refresh_token);

        return Promise.resolve({ access_token: this.accessToken, refresh_token: this.refreshToken });
    }

    //formOptions - {limit, offset}
    async getUserPlaylists(userID, formOptions?): Promise<any> {

        await this._verifyAccessToken();

        var url = `${this.baseUrl}/users/${userID}/playlists`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.accessToken },
            json: true,
        }

        if(formOptions != null) {
            options.url += `?${querystring.stringify(formOptions)}`;

        }

        return new Promise((resolve, reject) => {
            this._getRequest(options)
                .then(res => {
                    resolve(res.items);
                })
                .catch(err => reject(err));
        })
    }

    async getCurrentUsersPlaylists(formOptions?): Promise<any> {

        await this._verifyAccessToken();

        var url = `${this.baseUrl}/me/playlists`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.accessToken },
            json: true,
        }

        if(formOptions != null) {
            options.url += `?${querystring.stringify(formOptions)}`;

        }

        return new Promise((resolve, reject) => {
            this._getRequest(options)
                .then(res => {
                    resolve(res.items);
                })
                .catch(err => reject(err));
        })



    }

    async getPlaylistById(playlistId: string, formOptions?): Promise<any> {
        var url = `${this.baseUrl}/playlists/${playlistId}`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.accessToken },
            json: true,
        }

        if(formOptions != null) {
            options.url += `?${querystring.stringify(formOptions)}`;

        }

        return new Promise((resolve, reject) => {
            this._getRequest(options)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(err));
        })

    }
}

var spotify = new Spotify('[Client ID]', '<Client Secret>, 'https://later.com');
spotify.setRefreshToken('[Refresh Token]');

let newScopes = [
    'playlist-read-collaborative', 
    'user-top-read',
    'playlist-read-private',
    'user-follow-read',
    'user-library-read',
]

spotify.setScope(newScopes);

spotify.renewAccessToken()
    .then(token => {
        return spotify.getCurrentUsersPlaylists();
    })
    .then(playlists => {
        playlists.forEach(playlist => console.log(playlist.name))
    })
    .catch(err => console.log(err));



// spotify.generateAuthorizationUrl();
