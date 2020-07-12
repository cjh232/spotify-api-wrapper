var request = require('request-promise');
var hashGen = require("crypto");
var querystring = require("querystring");
var secret = require('./secret');



/* TODO:----------------
    ***** GET NEW REFRESH TOKEN (Nothing will work until then) ******
    1. [DONE] Create function to get access token from spotify API
    2. [DONE] Create authorization function ** Need to be tested in Angular for the proper flow
    3. Store codeVerifier into local storage in generateAuthorizationUrl()
    4. [DONE] Create a setAccessTokenExpiration() function

*/

class Spotify {

    credentials;
    baseUrl = 'https://api.spotify.com/v1';
    expirationTime;
    scope = "";

    constructor(clientId: string, clientSecret: string, redirectUri: string) {
        this._setCredential('clientId', clientId);
        this._setCredential('clientSecret', clientSecret);
        this._setCredential('redirectUri', redirectUri);
    }

    _generateRandomString(length: number): string {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.-~';
      
        for (var i = 0; i < length; i++) {
          text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
      }

    _setCredential(key: string, val: string) {
        this.credentials = this.credentials || {};
        this.credentials[key] = val;

    }

    async _postRequest(options: object): Promise<any> {

        return new Promise( function(resolve, reject) {
            request.post(options)
                .then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(`POST: ${err.message}`);
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

    async _buildRequest(method: string, options, formOptions?) {

        if(formOptions != null) {
            options.url += `?${querystring.stringify(formOptions)}`;

        }

        var func;

        switch(method) {
            case 'POST':
                func = this._postRequest;
                break;
            case 'GET':
                func = this._getRequest;
        }

        return new Promise((resolve, reject) => {
            func(options)
                .then(res => {
                    resolve(res);
                })
                .catch(err => reject(err));
        });
    }

    setRefreshToken(token: string): void {
        this._setCredential('refresh', token);
    }

    setAccessToken(token: string): void {
        this._setCredential('access', token);
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

        if(this.credentials['refresh'] == null) {
            throw 'No refresh token has been supplied.';
        }

        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: { 'Authorization': 'Basic ' + (Buffer.from(this.credentials['clientId'] + ':' + this.credentials['clientSecret']).toString('base64')) },
            form: {
            grant_type: 'refresh_token',
            refresh_token: this.credentials['refresh'],
            },
            json: true
        };

        return new Promise((resolve, reject) => {
            this._postRequest(authOptions)
                .then(res => {
                    this.setAccessToken(res.access_token);
                    this._setAccessTokenExpirationTime(res.expires_in);
                    resolve(this.credentials['access']);
                })
                .catch(err => reject(err));
        })

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
            client_id: this.credentials['clientId'],
            scope: this.scope,
            redirect_uri: 'http://localhost:8888/callback',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
        })

        return authUrl;
        // console.log("Authorization URL:\n" + authUrl);
    }

    // TODO: Test this function once integrated into Angular
    async getNewTokenPair(codeVerifier: string, authCode: string) {

        var options = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            client_id: this.credentials['clientId'],
            code: authCode,
            redirect_uri: this.credentials['redirectUri'],
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
        },
        headers: {
            'Authorization': 'Basic ' + (new Buffer(this.credentials['clientId'] + ':' + this.credentials['clientSecret']).toString('base64'))
        },
        json: true
        };

        var response = await this._postRequest(options);
        this.setAccessToken(response.access_token);
        this.setRefreshToken(response.refresh_token);

        return Promise.resolve({ access_token: this.credentials['access'], refresh_token: this.credentials['refresh'] });
    }

    //formOptions - {limit, offset}
    async getUserPlaylists(userID: string, formOptions?): Promise<any> {

        await this._verifyAccessToken();

        var url = `${this.baseUrl}/users/${userID}/playlists`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.credentials['access'] },
            json: true,
        }

        return this._buildRequest('GET', options, formOptions);
    }

    async getMyPlaylists(formOptions?): Promise<any> {

        await this._verifyAccessToken();

        var url = `${this.baseUrl}/me/playlists`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.credentials['access']},
            json: true,
        }

        return this._buildRequest('GET', options, formOptions);

    }

    async getPlaylistById(playlistId: string, formOptions?): Promise<any> {
        var url = `${this.baseUrl}/playlists/${playlistId}`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.credentials['access']},
            json: true,
        }

        return this._buildRequest('GET', options, formOptions);

    }

    async getPlaylistTracks(playlistId: string, formOptions?): Promise<any> {
        var url = `${this.baseUrl}/playlists/${playlistId}/tracks`

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.credentials['access']},
            json: true,
        }

        return this._buildRequest('GET', options, formOptions);

    }

    async getMyTopTracks(formOptions?): Promise<any> {
        var url = `${this.baseUrl}/me/top/tracks`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.credentials['access']},
            json: true,
        }

        return this._buildRequest('GET', options, formOptions);

    }

    async getMyTopArtists(formOptions?): Promise<any> {
        var url = `${this.baseUrl}/me/top/artists`;

        var options = {
            url: url,
            headers: { 'Authorization': 'Bearer ' + this.credentials['access']},
            json: true,
        }

        return this._buildRequest('GET', options, formOptions);
    }

}

var spotify = new Spotify(secret.clientId, secret.clientSecret, 'https://later.com');
let newScopes = [
    'playlist-read-collaborative', 
    'user-top-read',
    'playlist-read-private',
    'user-follow-read',
    'user-library-read',
]
spotify.setScope(newScopes);

spotify.setRefreshToken(secret.refresh);


spotify.renewAccessToken()
    .then(token => {
        return spotify.getMyTopArtists({time_range: 'long_term', limit: 5});
    })
    .then(topArtists => {
        topArtists.items.forEach(artist => console.log(artist.name))
    })
    .catch(err => console.log(err));





module.exports = {
    Spotify: Spotify,
}

// spotify.generateAuthorizationUrl();
