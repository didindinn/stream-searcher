/* TODO
- Style
- Pagination only with load more, refresh on search
- Add game search when not on the list or increase games list
- Mandatory language selection
- BUG : CORS on Firefox
- Reset filters
*/

import React, { Component } from 'react';
import 'reset-css';
import './style/App.css';
import ws from './utils/web_service';
import { TWITCH_API_PATH, TWITCH_LANGUAGES, MIN_STREAMS_PER_PAGE, TWITCH_AUTH_PATH, TWITCH_AUTH_PARAMS } from './utils/constants';
import Stream from './components/Stream';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import qs from 'query-string';
import { checkAuthentication, disconnect, isAuthenticated } from './utils/user';

let gamesIds = [];
let games = [];
let toastId = 0;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      streams: [],
      topGames: [],
      gamesIds: [],
      games: [],
      excludeGames: 'false',
      queryParams: {
        first: 100,
        language: ['fr'],
        game_id: []
      },
      filters: {
        min: '',
        max: '',
        excludedGames: []
      },
      loading: false,
      lastCursor: '',
      filtersDisplayed: true,
      logged: false
    }
  }

  componentDidMount() {
    this.getTopGames()

    if (isAuthenticated() || checkAuthentication())
      this.setState({ logged: true });
  }

  notifyError = (error) => {
    if (toast.isActive(toastId)) return;

    const id = Math.random();
    toastId = id;

    toast.error(error, {
      toastId: id,
      position: toast.POSITION.TOP_CENTER
    });
  }

  hasFilters = () => this.state.filters.min !== '' || this.state.filters.max !== '' || this.state.filters.excludedGames.length;
  inMinRange = (viewerCount) => this.state.filters.min === '' || viewerCount > this.state.filters.min;
  inMaxRange = (viewerCount) => this.state.filters.max === '' || viewerCount < this.state.filters.max;
  isExcludedGame = (gameId) => this.state.excludeGames === 'true' && this.state.filters.excludedGames.includes(gameId);

  getTopGames = async () => {
    const fetchedGames = await ws.get(TWITCH_API_PATH + 'games/top', { first: 100 });

    if (fetchedGames.error) {
      this.notifyError(fetchedGames.error);
      return;
    }

    let games = [];

    for (const game of fetchedGames.data)
      games.push({ value: game.id, label: game.name });

    this.setState({ topGames: games });
  }

  getStreams = async () => {
    let streams = this.state.lastCursor ? this.state.streams : [];
    let tmpStreams = [];
    let params = {};
    let counter = 0;
    let cursor = '';

    this.setState({loading: true});
    this.hideFilters();
    if (!this.state.lastCursor) {
      this.setState({ streams: [] });
      window.scrollTo(0, 0);
    }

    while (counter < MIN_STREAMS_PER_PAGE) {
      params = Object.assign({}, this.state.lastCursor ? { ...this.state.queryParams, after: this.state.lastCursor } : this.state.queryParams);
      if (this.state.excludeGames === 'true') params.game_id = [];

      const fetchedStreams = await ws.get(TWITCH_API_PATH + 'streams', params);

      if (fetchedStreams.error) {
        toast.error(fetchedStreams.error, {
          position: toast.POSITION.TOP_CENTER
        });
        break;
      }

      if (fetchedStreams.data.length < 100) {
        cursor = '';
        counter = MIN_STREAMS_PER_PAGE;
      } else
        cursor = fetchedStreams.pagination.cursor;

      if (this.hasFilters()) {
        for (const stream of fetchedStreams.data) {
          if (!this.inMinRange(stream.viewer_count)) {
            counter = MIN_STREAMS_PER_PAGE;
            break;
          }
          if (this.inMaxRange(stream.viewer_count) && !this.isExcludedGame(stream.game_id)) {
            tmpStreams.push(stream);
            counter++;
          }
        };
      } else {
        tmpStreams.push(...fetchedStreams.data);
        counter = MIN_STREAMS_PER_PAGE;
      }

      this.getGames(tmpStreams);

      streams.push(...tmpStreams);

      this.setState({
        streams: streams,
        lastCursor: cursor
      });
    }

    this.setState({ loading: false });
    counter = 0;
  }

  getGames = async (newStreams) => {
    let newGamesIds = [];

    for (const stream of newStreams)
        if (!gamesIds.includes(stream.game_id) && !newGamesIds.includes(stream.game_id))
          newGamesIds.push(stream.game_id);

    if (newGamesIds.length === 0)
      return;

    gamesIds.push(newGamesIds);
    const fetchedGames = await ws.get(TWITCH_API_PATH + 'games', {id: newGamesIds});

    if (fetchedGames.error) {
      this.notifyError(fetchedGames.error);

      return;
    }

    games.push(...fetchedGames.data);

    this.updateStreams(newStreams);
  }

  updateStreams = (newStreams) => {
    let streams = this.state.streams;

    for (const stream of streams) {
      for (const newStream of newStreams) {
        if (stream.id === newStream.id) {
          const game = games.filter(obj => obj.id === newStream.game_id);
          if (game[0])
            newStream.game_name = game[0].name;
        }
      }
    };

    this.setState({streams: streams});
  }

  handleViewersInputs = (e) => {
    let filters = { ...this.state.filters };
    filters[e.target.name] = e.target.value;

    this.setState({
      filters: filters,
      lastCursor: ''
    });
  }

  setLanguage = (selectedLanguages) => {
    let languages = [];
    let queryParams = { ...this.state.queryParams };

    if (selectedLanguages)
      for (const language of selectedLanguages)
        languages.push(language.value);

    queryParams.language = languages;
    this.setState({
      queryParams: queryParams,
      lastCursor: ''
    });
  }

  setGame = (selectedGames) => {
    let gameIds = [];
    let queryParams = { ...this.state.queryParams };

    if (selectedGames)
      for (const game of selectedGames)
        gameIds.push(game.value);

    queryParams.game_id = gameIds;
    this.setState({
      queryParams: queryParams,
      lastCursor: ''
    });
  }

  setExcludedGame = (selectedGames) => {
    let gameIds = [];
    let filters = { ...this.state.filters };

    if (selectedGames)
      for (const game of selectedGames)
        gameIds.push(game.value);

    filters.excludedGames = gameIds;
    this.setState({
      filters: filters,
      lastCursor: ''
    });
  }

  handleGameFilter = (e) => {
    this.setState({
      excludeGames: e.target.value,
      lastCursor: ''
    })
  }

  hideFilters = () => {
    this.setState({filtersDisplayed: false})
    document.body.classList.remove('no-scroll');
  }

  displayFilters = () => {
    this.setState({filtersDisplayed: true})
    document.body.classList.add('no-scroll');
  }

  login = () => document.location.href = `${TWITCH_AUTH_PATH}authorize?${qs.stringify(TWITCH_AUTH_PARAMS)}`;
  logoff = () => this.setState({ logged: disconnect() });

  render() {
    let filtersClass = this.state.filtersDisplayed ? 'filters__container filters__container--displayed' : 'filters__container';

    return (
      <div>
        <ToastContainer />

        <div className={filtersClass}>
          <button className="filters__closer" onClick={this.hideFilters}>
            <svg version="1.1" x="0px" y="0px" viewBox="0 0 31.112 31.112" className="icon">
              <polygon points="31.112,1.414 29.698,0 15.556,14.142 1.414,0 0,1.414 14.142,15.556 0,29.698 1.414,31.112 15.556,16.97 29.698,31.112 31.112,29.698 16.97,15.556 "/>
            </svg>
          </button>

          <div className="filters">
            <div className="filters__viewers">
              <h2>Viewers</h2>
              <div className="filters__line">
                <div className="filters__element">
                  <label htmlFor="min" className="input__label">Min</label>
                  <input 
                    type="number"
                    id="min"
                    name="min"
                    value={this.state.filters.min}
                    onChange={this.handleViewersInputs}
                    className="input__number"
                  />
                </div>

                <div className="filters__element">
                  <label htmlFor="max" className="input__label">Max</label>
                  <input
                    type="number"
                    id="max"
                    name="max"
                    value={this.state.filters.max}
                    onChange={this.handleViewersInputs}
                    className="input__number"
                  />
                </div>
              </div>
            </div>

            <div className="filters__games">
              <h2>Games</h2>
              <div className="filters__line">
                <div className="filters__radios">
                  <label htmlFor="include">Include</label>
                  <input
                    className="radio"
                    type="radio"
                    id="include"
                    label="Include"
                    name="game-filter"
                    value="false"
                    checked={this.state.excludeGames === "false"}
                    onChange={this.handleGameFilter}
                  />

                  <label htmlFor="exclude">Exclude</label>
                  <input
                    className="radio"
                    type="radio"
                    id="exclude"
                    label="Exclude"
                    name="game-filter"
                    value="true"
                    checked={this.state.excludeGames === "true"}
                    onChange={this.handleGameFilter}
                  />
                </div>

                <div className="filters__element" style={{ display: this.state.excludeGames === "true" ? 'none' : 'block' }}>
                  <Select
                    id="game-id"
                    name="game_id"
                    options={this.state.topGames}
                    isMulti
                    onChange={this.setGame}

                  />
                </div>

                <div className="filters__element" style={{ display: this.state.excludeGames === "true" ? 'block' : 'none' }}>
                  <Select
                    id="excluded-games"
                    name="excluded_games"
                    options={this.state.topGames}
                    isMulti
                    onChange={this.setExcludedGame}
                  />
                </div>
              </div>
            </div>

          <div className="filters__languages">
            <h2>Languages</h2>
            <div className="filters__line">
              <div className="filters__element">
                <Select
                  id="language"
                  name="language"
                  options={TWITCH_LANGUAGES}
                  isMulti
                  onChange={this.setLanguage}
                  defaultValue={{ value: 'fr', label: 'Français' }}
                />
              </div>
            </div>
          </div>

          <div className="button__container">
            <button onClick={this.getStreams}>Search</button>
          </div>
          </div>
        </div>

        <header>
          <button onClick={this.displayFilters} className="filters__button">
            <svg version="1.1" x="0px" y="0px" width="459" height="459" viewBox="0 0 459 459" className="filters__icon icon">
              <path d="M178.5,382.5h102v-51h-102V382.5z M0,76.5v51h459v-51H0z M76.5,255h306v-51h-306V255z"/>
            </svg>

            Filters
          </button>

          {!this.state.logged ? (
              <button onClick={this.login} className="user__button">
                <svg height="640" viewBox="0 0 480 480" width="640" className="user__icon icon">
                  <path d="M240 0C107.453 0 0 107.453 0 240s107.453 240 240 240c7.23 0 14.434-.324 21.602-.969 6.664-.597 13.27-1.511 19.824-2.656l2.52-.445c121.863-22.743 206.359-134.551 194.96-257.996C467.508 94.488 363.97.039 240 0zm-19.281 463.152h-.567a221.883 221.883 0 0 1-18.52-2.449c-.35-.062-.702-.101-1.046-.168a223.092 223.092 0 0 1-17.77-3.95l-1.418-.362a223.244 223.244 0 0 1-16.949-5.352c-.578-.207-1.16-.39-1.738-.605-5.465-2.008-10.832-4.258-16.117-6.692-.656-.293-1.313-.574-1.969-.887-5.184-2.398-10.266-5.101-15.25-7.945-.703-.398-1.414-.797-2.117-1.191a226.827 226.827 0 0 1-14.403-9.176c-.71-.496-1.43-.977-2.136-1.473a224.986 224.986 0 0 1-13.512-10.398L96 411.449V344c.059-48.578 39.422-87.941 88-88h112c48.578.059 87.941 39.422 88 88v67.457l-1.063.887a217.439 217.439 0 0 1-13.777 10.601c-.625.438-1.258.856-1.879 1.285a223.69 223.69 0 0 1-14.625 9.336c-.625.364-1.265.707-1.886 1.067-5.06 2.879-10.204 5.597-15.45 8.047-.601.28-1.207.543-1.816.8a220.521 220.521 0 0 1-16.246 6.743c-.547.203-1.098.379-1.602.57-5.601 2.008-11.281 3.824-17.031 5.383l-1.379.344a225.353 225.353 0 0 1-17.789 3.96c-.344.063-.687.106-1.031.16a222.58 222.58 0 0 1-18.54 2.458h-.566c-6.398.55-12.8.847-19.28.847-6.481 0-12.935-.242-19.321-.793zM400 396.625V344c-.066-57.41-46.59-103.934-104-104H184c-57.41.066-103.934 46.59-104 104v52.617C-6.164 308.676-5.203 167.68 82.148 80.918 169.5-5.84 310.5-5.84 397.852 80.918c87.351 86.762 88.312 227.758 2.148 315.7zm0 0"/>
                  <path d="M240 64c-44.184 0-80 35.816-80 80s35.816 80 80 80 80-35.816 80-80c-.047-44.164-35.836-79.953-80-80zm0 144c-35.348 0-64-28.652-64-64s28.652-64 64-64 64 28.652 64 64c-.04 35.328-28.672 63.96-64 64zm0 0"/>
                </svg>

                Authenticate
              </button>
          ) : (
            <button onClick={this.logoff} className="user__button">
              <svg viewBox="0 0 480 480" className="user__icon icon">
                <path d="M240 0C107.5 0 0 107.5 0 240s107.5 240 240 240c7.2 0 14.4-.3 21.6-1 6.7-.6 13.3-1.5 19.8-2.7l2.5-.4c121.9-22.7 206.4-134.6 195-258S364 0 240 0zm-19.3 463.2h-.6c-6.2-.6-12.4-1.4-18.5-2.4-.4-.1-.7-.1-1-.2-6-1.1-11.9-2.4-17.8-3.9l-1.4-.4c-5.7-1.6-11.4-3.4-16.9-5.4-.6-.2-1.2-.4-1.7-.6-5.5-2-10.8-4.3-16.1-6.7-.7-.3-1.3-.6-2-.9-5.2-2.4-10.3-5.1-15.3-7.9l-2.1-1.2c-4.9-2.9-9.7-5.9-14.4-9.2l-2.1-1.5c-4.6-3.3-9.1-6.8-13.5-10.4l-1.2-1.1V344c.1-48.6 39.4-87.9 88-88h112c48.6.1 87.9 39.4 88 88v67.5l-1.1.9c-4.5 3.7-9.1 7.3-13.8 10.6-.6.4-1.3.9-1.9 1.3-4.8 3.3-9.6 6.4-14.6 9.3-.6.4-1.3.7-1.9 1.1-5.1 2.9-10.2 5.6-15.4 8-.6.3-1.2.5-1.8.8-5.3 2.5-10.7 4.7-16.2 6.7-.5.2-1.1.4-1.6.6-5.6 2-11.3 3.8-17 5.4l-1.4.3c-5.9 1.6-11.8 2.9-17.8 4-.3.1-.7.1-1 .2-6.1 1.1-12.3 1.9-18.5 2.5h-.6c-6.4.6-12.8.8-19.3.8s-13.1-.3-19.5-.8zM400 396.6V344c-.1-57.4-46.6-103.9-104-104H184c-57.4.1-103.9 46.6-104 104v52.6C-6.2 308.7-5.2 167.7 82.1 80.9c87.4-86.8 228.4-86.8 315.7 0 87.4 86.8 88.4 227.8 2.2 315.7z"/>
                <path d="M240 64c-44.2 0-80 35.8-80 80s35.8 80 80 80 80-35.8 80-80-35.8-80-80-80zm0 144c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z"/>
                <path d="M410 85.5L394.5 70 240 224.5 85.5 70 70 85.5 224.5 240 70 394.5 85.5 410 240 255.5 394.5 410l15.5-15.5L255.5 240 410 85.5z"/>
              </svg>

              Disconnect
            </button>
          )}
        </header>

        <div className="content">
          {this.state.streams.length ? (
            <div>
              <div className="streams">
                {this.state.streams.map((stream, i) => (
                  <Stream key={i} logged={this.state.logged} {...stream} />
                ))}
              </div>
              <div>
                {!this.state.loading && (
                  this.state.lastCursor ? (
                    <button onClick={this.getStreams}>Load more</button>
                  ) : (
                      <p>No more stream.</p>
                    )
                )}
              </div>
            </div>
          ) : (
              !this.state.loading &&
              <p>No stream was found with these filters.</p>
            )}
          {this.state.loading &&
            <div>
              <div className="loading-spinner"><div></div><div></div></div>
            </div>
          }
        </div>
      </div>
    );
  }
}

export default App;
