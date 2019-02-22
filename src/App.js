/* TODO
  - BUG : repeated loop (min 60, max 200, japanese)
  - Empty include/exclude games select when radio change
  - Style
*/

import React, { Component } from 'react';
import './style/App.css';
import { Button, FormField, Grommet, Paragraph, RadioButton, TextInput } from 'grommet';
import ws from './utils/web_service';
import { TWITCH_API_PATH, TWITCH_LANGUAGES } from './utils/constants';
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

    this.counter = 0;
    this.lastCursor = '';

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
    }

    this.getTopGames();
  }

  hasFilters = () => this.state.filters.min !== '' || this.state.filters.max !== '' || this.state.filters.excludedGames.length > 0;
  inViewersRange = (viewerCount) => viewerCount > this.state.filters.min && viewerCount < this.state.filters.max;
  isExcludedGame = (gameId) => this.state.filters.excludedGames.includes(gameId);

  getTopGames = async () => {
    const fetchedGames = await ws.get(TWITCH_API_PATH + 'games/top', {first: 100});
    let games = [];

    for (const game of fetchedGames.data)
      games.push({ value: game.id, label: game.name });

    this.setState({ topGames: games });
  }

  getStreams = async () => {
    let streams = [];
    let params = {};
    let i = 0;

    this.setState({ loading: true });

    while (this.counter < 20) {
      params = i > 0 ? { ...this.state.queryParams, after: this.lastCursor } : this.state.queryParams;
      const fetchedStreams = await ws.get(TWITCH_API_PATH + 'streams', params);
      this.lastCursor = fetchedStreams.pagination.cursor || '';
      console.log(this.lastCursor);
      
      if (this.hasFilters()) {
        for (const stream of fetchedStreams.data) {
          console.log(this.inViewersRange(stream.viewer_count));
          if (this.inViewersRange(stream.viewer_count) && !this.isExcludedGame(stream.game_id)) {
            streams.push(stream);
          }
        };
      } else {
        streams.push(...fetchedStreams.data);
      }

      this.counter = streams.length;
      this.setState({ streams: streams });
      i++;

      console.log(streams);
    }

    this.setState({ loading: false });
    this.counter = 0;
  }

  handleViewersInputs = (e) => {
    let filters = { ...this.state.filters };
    filters[e.target.name] = e.target.value;
    this.setState({ filters: filters });
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
    this.setState({ queryParams: queryParams });
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
    this.setState({ queryParams: queryParams });
  }

  setExcludedGame = (selectedGames) => {
    let gameIds = [];
    let filters = { ...this.state.filters };

    if (selectedGames)
      for (const game of selectedGames)
        gameIds.push(game.value);

    console.log(gameIds);
    filters.excludedGames = gameIds;
    this.setState({ filters: filters });
  }

  handleGameFilter = (e) => {
    this.setState({ excludeGames: e.target.value })
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
            label="Filtrer"
            onClick={this.getStreams}
          />
        </div>

        <div className="streams">
          {this.state.loading ? (
            <div className="loading-spinner"><div></div><div></div></div>
          ) : (
              this.state.streams.length > 0 ? (
                this.state.streams.map((stream, i) => (
                  <Stream key={i} {...stream} />
                ))
              ) : (
                  <Paragraph>
                    Aucun stream n'a été trouvé avec ces critères.
              </Paragraph>
                )
            )}
        </div>
      </Grommet>
    );
  }
}

export default App;
