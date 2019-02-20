/* TODO
  - BUG : repeated loop (min 60, max 200, japanese)
  - Include / exclude games
  - Style
*/

import React, { Component } from 'react';
import './style/App.css';
import { Button, FormField, Grommet, Paragraph, TextInput } from 'grommet';
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

    this.state = {
      streams: [],
      queryParams: {
        first: 100,
        language: ["fr"],
      },
      filters: {
        min: '',
        max: '',
      },
      loading: false,
      lastCursor: ''
    }
  }

  hasViewersFilter = () => this.state.filters.min !== '' || this.state.filters.max !== '';
  inViewersRange = (viewerCount) => viewerCount > this.state.filters.min && viewerCount < this.state.filters.max;

  getStreams = async () => {
    const streams = [];
    let params = {};
    let i = 0;

    this.setState({ loading: true });

    while (this.counter < 20) {
      params = i > 0 ? { ...this.state.queryParams, after: this.state.lastCursor } : this.state.queryParams;
      const fetchedStreams = await ws.get(TWITCH_API_PATH + 'streams', params);
      this.state.lastCursor = fetchedStreams.pagination.cursor || '';
      console.log(this.state.lastCursor);

      if (this.hasViewersFilter()) {
        for (const stream of fetchedStreams.data) {
          if (this.inViewersRange(stream.viewer_count)) {
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
    const filters = { ...this.state.filters };
    filters[e.target.name] = e.target.value;
    this.setState({ filters: filters });
  }

  setLanguage = (selectedLanguages) => {
    let languages = [];
    const queryParams = { ...this.state.queryParams };

    if (selectedLanguages) {
      for (const language of selectedLanguages) {
          languages.push(language.value);
      }
    }

    queryParams.language = languages;
    this.setState({ queryParams: queryParams });
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
              name="max"
              value={this.state.filters.max}
              onChange={this.handleViewersInputs}
            />
          </FormField>

          <Select
            options={TWITCH_LANGUAGES} 
            isMulti 
            onChange={this.setLanguage} 
            defaultValue={{value: 'fr', label: 'Français' }} 
          />

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
