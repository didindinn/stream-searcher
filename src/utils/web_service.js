import qs from 'query-string';
import { COOKIE_NAME, TWITCH_CLIENT_ID } from './constants';
import cookies from 'browser-cookies';
import { isAuthenticated } from './user';

class WS {
    getDefaultRequestOptions() {
        let args = {
            headers: {},
            mode: 'cors'
        };

        if (isAuthenticated())
            args.headers['Authorization'] = `Bearer ${cookies.get(COOKIE_NAME)}`;
        else
            args.headers['Client-ID'] = TWITCH_CLIENT_ID

        return args;
    }

    async get(endPoint, query, resCallback) {
        if (query) endPoint = `${endPoint}?${qs.stringify(query)}`;
        const options = { ...this.getDefaultRequestOptions(), method: 'GET' };

        return this.fetch(endPoint, options, resCallback);
    }

    fetch(endPoint, options) {
        return new Promise((resolve, reject) => {
            fetch(endPoint, options)
                .then(res => res.json())
                .then(data => resolve(data))
                .catch(error => console.error(error));
        });
    }
}

export default new WS();