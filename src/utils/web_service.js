import qs from 'query-string';
import { TWITCH_CLIENT_ID } from './constants';

class WS {
    getDefaultRequestOptions() {
        let args = {
            headers: {
                'Content-Type': 'application/json',
                'Client-ID': TWITCH_CLIENT_ID
            },
        };

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
                .catch(error => {console.error(error)});
        });
    }
}

export default new WS();