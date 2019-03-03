/* TODO
- Style
- User connection to increase ratelimits
- Add game played in stream details
*/

import React, { Component } from 'react';
import './style/App.css';
import { Accordion, AccordionPanel, Button, Grommet, RadioButton, TextInput } from 'grommet';
import ws from './utils/web_service';
import { TWITCH_API_PATH, TWITCH_LANGUAGES, MIN_STREAMS_PER_PAGE } from './utils/constants';
import Stream from './components/Stream';
import Select from 'react-select';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      streams: [],
      topGames: [],
      excludeGames: 'false',
      queryParams: {
        first: 100,
        language: ["fr"],
        game_id: []
      },
      filters: {
        min: '',
        max: '',
        excludedGames: []
      },
      loading: false,
      lastCursor: '',
      activeIndex: [0]
    }

    this.getTopGames();
  }

  hasFilters = () => this.state.filters.min !== '' || this.state.filters.max !== '' || this.state.filters.excludedGames.length;
  inMinRange = (viewerCount) => this.state.filters.min === '' || viewerCount > this.state.filters.min;
  inMaxRange = (viewerCount) => this.state.filters.max === '' || viewerCount < this.state.filters.max;
  isExcludedGame = (gameId) => this.state.excludeGames === 'true' && this.state.filters.excludedGames.includes(gameId);

  getTopGames = async () => {
    const fetchedGames = await ws.get(TWITCH_API_PATH + 'games/top', { first: 100 });

    if (fetchedGames.error) {
      toast.error(fetchedGames.error, {
        position: toast.POSITION.TOP_CENTER
      });
      return;
    }

    let games = [];

    for (const game of fetchedGames.data)
      games.push({ value: game.id, label: game.name });

    this.setState({ topGames: games });
  }

  getStreams = async () => {
    let streams = this.state.lastCursor ? this.state.streams : [];
    let params = {};
    let counter = 0;
    let cursor = '';

    this.setState({ 
      loading: true,
      activeIndex: []
    });
    if (!this.state.lastCursor) {
      this.setState({streams: []});
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
            streams.push(stream);
            counter++;
          }
        };
      } else {
        streams.push(...fetchedStreams.data);
        counter = MIN_STREAMS_PER_PAGE;
      }

      this.setState({
        streams: streams,
        lastCursor: cursor
      });
    }

    this.setState({ loading: false });
    counter = 0;
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

  render() {
    return (
      <Grommet>
        <ToastContainer />
        <div className="filters__container">
          <Accordion 
            activeIndex={this.state.activeIndex} 
            onActive={newActiveIndex => this.setState({ activeIndex: newActiveIndex })}
            style={{overflow: 'hidden'}}
          >
            <AccordionPanel label="Filters">
              <div className="filters">
                <div className="filters__viewers">
                  <h2>Viewers</h2>
                  <div className="filters__line">
                    <div className="filters__element">
                      <label htmlFor="min">Min</label>
                      <TextInput
                        type="number"
                        id="min"
                        name="min"
                        value={this.state.filters.min}
                        onChange={this.handleViewersInputs}
                      />
                    </div>

                    <div className="filters__element">
                      <label htmlFor="max">Max</label>
                      <TextInput
                        type="number"
                        id="max"
                        name="max"
                        value={this.state.filters.max}
                        onChange={this.handleViewersInputs}
                      />
                    </div>
                  </div>
                </div>

                <div className="filters__games">
                  <h2>Games</h2>
                  <div className="filters__line">
                    <div className="filters__radios">
                      <RadioButton
                        label="Include"
                        name="game-filter"
                        value="false"
                        checked={this.state.excludeGames === "false"}
                        onChange={this.handleGameFilter}
                      />
                      <RadioButton
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
                        menuPortalTarget={document.querySelector('body')}
                      />
                    </div>

                    <div className="filters__element" style={{ display: this.state.excludeGames === "true" ? 'block' : 'none' }}>
                      <Select
                        id="excluded-games"
                        name="excluded_games"
                        options={this.state.topGames}
                        isMulti
                        onChange={this.setExcludedGame}
                        menuPortalTarget={document.querySelector('body')}
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
                        menuPortalTarget={document.querySelector('body')}
                      />
                    </div>
                  </div>
                </div>

                <div className="button__container">
                  <Button
                    label="Search"
                    onClick={this.getStreams}
                  />
                </div>
              </div>
            </AccordionPanel>
          </Accordion>
        </div>

        <div className="streams__container">
          {this.state.streams.length ? (
            <div>
              <div className="streams">
                {this.state.streams.map((stream, i) => (
                  <Stream key={i} {...stream} />
                ))}
              </div>
              <div>
                {!this.state.loading && (
                  this.state.lastCursor ? (
                  <Button
                    label="Load more"
                    onClick={this.getStreams}
                  />
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
      </Grommet>
    );
  }
}

export default App;
