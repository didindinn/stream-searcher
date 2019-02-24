/* TODO
  - Reset cursor when change in filters
  - Add game played in stream details
  - Style
*/

import React, { Component } from 'react';
import './style/App.css';
import { Button, FormField, Grommet, Paragraph, RadioButton, TextInput } from 'grommet';
import ws from './utils/web_service';
import { TWITCH_API_PATH, TWITCH_LANGUAGES, MIN_STREAMS_PER_PAGE } from './utils/constants';
import Stream from './components/Stream';
import Select from 'react-select';

const theme = {
  global: {
    font: {
      family: 'Roboto',
      size: '16px',
      height: '20px',
    },
  },
};

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
      lastCursor: ''
    }

    this.getTopGames();
  }

  hasFilters = () => this.state.filters.min !== '' || this.state.filters.max !== '' || this.state.filters.excludedGames.length;
  inViewersRange = (viewerCount) => {
    if (
      (this.state.filters.min !== '' && viewerCount < this.state.filters.min) ||
      (this.state.filters.max !== '' && viewerCount > this.state.filters.max)
    )
      return false;

    return true;
  }
  isExcludedGame = (gameId) => this.state.excludeGames === 'true' && this.state.filters.excludedGames.includes(gameId);

  getTopGames = async () => {
    const fetchedGames = await ws.get(TWITCH_API_PATH + 'games/top', {first: 100});
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

    this.setState({ loading: true });

    while (counter < MIN_STREAMS_PER_PAGE) {
      params = Object.assign({}, this.state.lastCursor ? { ...this.state.queryParams, after: this.state.lastCursor } : this.state.queryParams);
      if (this.state.excludeGames === 'true') params.game_id = [];

      const fetchedStreams = await ws.get(TWITCH_API_PATH + 'streams', params);

      if (this.hasFilters()) {
        for (const stream of fetchedStreams.data) {
          if (this.inViewersRange(stream.viewer_count) && !this.isExcludedGame(stream.game_id)) {
            streams.push(stream);
            counter++;
          }
        };
      } else {
        streams.push(...fetchedStreams.data);
        counter = MIN_STREAMS_PER_PAGE;
      }

      if (fetchedStreams.data.length < 100) {
        cursor = '';
        counter = MIN_STREAMS_PER_PAGE;
      } else
        cursor = fetchedStreams.pagination.cursor;

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

    if (selectedLanguages) {
      for (const language of selectedLanguages) {
          languages.push(language.value);
      }
    }

    queryParams.language = languages;
    this.setState({ 
      queryParams: queryParams,
      lastCursor: ''
    });
  }

  setGame = (selectedGames) => {
    let gameIds = [];
    let queryParams = { ...this.state.queryParams };

    if (selectedGames) {
      for (const game of selectedGames) {
        gameIds.push(game.value);
      }
    }

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
      <Grommet theme={theme}>
        <div className="filters">
          <FormField
            label="Viewers minimum"
            htmlFor="min"
          >
            <TextInput
              type="number"
              id="min"
              name="min"
              value={this.state.filters.min}
              onChange={this.handleViewersInputs}
            />
          </FormField>
          <FormField
            label="Viewers maximum"
            htmlFor="max"
          >
            <TextInput
              type="number"
              id="max"
              name="max"
              value={this.state.filters.max}
              onChange={this.handleViewersInputs}
            />
          </FormField>

          <FormField
            label="Stream language"
            htmlFor="language"
          >
            <Select
              id="language"
              name="language"
              options={TWITCH_LANGUAGES} 
              isMulti 
              onChange={this.setLanguage} 
              defaultValue={{value: 'fr', label: 'Français' }} 
            />
          </FormField>

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

          <FormField
            label="Searched games"
            htmlFor="game-id"
            style={{display: this.state.excludeGames === "true" ? 'none' : 'block' }}
          >
            <Select
              id="game-id"
              name="game_id"
              options={this.state.topGames} 
              isMulti
              onChange={this.setGame}
            />
          </FormField>

          <FormField
            label="Excluded games"
            htmlFor="excluded-games"
            style={{display: this.state.excludeGames === "true" ? 'block' : 'none' }}
          >
            <Select
              id="excluded-games"
              name="excluded_games"
              options={this.state.topGames} 
              isMulti
              onChange={this.setExcludedGame}
            />
          </FormField>

          <Button
            label="Search"
            onClick={this.getStreams}
          />
        </div>

        <div className="streams__container">
          {this.state.streams.length ? (
            <div className="streams">
              {this.state.streams.map((stream, i) => (
                <Stream key={i} {...stream} />
              ))}
              <div>
                {this.state.lastCursor ? (
                  <Button
                    label="Load more"
                    onClick={this.getStreams}
                  />
                ) : (
                  <Paragraph>
                    No more stream.
                  </Paragraph>
                )}
              </div>
            </div>
          ) : (
            <Paragraph>
              No stream was found with these filters.
            </Paragraph>
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
