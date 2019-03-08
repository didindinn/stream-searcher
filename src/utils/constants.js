export const TWITCH_API_PATH = 'https://api.twitch.tv/helix/';
export const TWITCH_CLIENT_ID = 'u9uy2z02kjilpslbrrbddxgtkgeqh6';
export const MIN_STREAMS_PER_PAGE = 16;
export const TWITCH_AUTH_PATH = 'https://id.twitch.tv/oauth2/';
export const COOKIE_NAME = 'stream_searcher_token';
export const TWITCH_AUTH_PARAMS = {
    client_id: TWITCH_CLIENT_ID,
    redirect_uri: 'http://localhost:3000',
    response_type: 'token',
    scope: ''
}
export const TWITCH_LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'da', label: 'Dansk' },
    { value: 'de', label: 'Deutsch' },
    { value: 'en-gb', label: 'English - UK' },
    { value: 'es', label: 'Español - España' },
    { value: 'es-mx', label: 'Español - Latinoamérica' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' },
    { value: 'hu', label: 'Magyar' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'no', label: 'Norsk' },
    { value: 'pl', label: 'Polski' },
    { value: 'pt', label: 'Português' },
    { value: 'pt-br', label: 'Português - Brasil' },
    { value: 'sk', label: 'Slovenčina' },
    { value: 'fi', label: 'Suomi' },
    { value: 'sv', label: 'Svenska' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'tr', label: 'Türkçe' },
    { value: 'cs', label: 'Čeština' },
    { value: 'el', label: 'Ελληνικά' },
    { value: 'bg', label: 'Български' },
    { value: 'ru', label: 'Русский' },
    { value: 'th', label: 'ภาษาไทย' },
    { value: 'zh-cn', label: '中文 简体' },
    { value: 'zh-tw', label: '中文 繁體' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'ro', label: 'Română' },
];