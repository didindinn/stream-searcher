import cookies from 'browser-cookies';
import { COOKIE_NAME } from './constants';

export function checkAuthentication() {
    const params = new URLSearchParams(document.location.hash.substr(1));
    if (!params.has('access_token')) return false;

    let date = new Date();
    date.setHours(date.getHours() + 1)
    
    cookies.set(
        COOKIE_NAME,
        params.get('access_token'),
        { expires: date }
    );

    window.history.pushState(null, '', '/');

    return true;
}

export function isAuthenticated() {
    return cookies.get(COOKIE_NAME) !== null;
}

export function disconnect() {
    cookies.erase(COOKIE_NAME);

    return false;
}