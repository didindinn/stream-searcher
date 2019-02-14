import React, { Component } from 'react';
import './style/App.css';
import { Button, FormField, Grommet, Paragraph, TextInput } from 'grommet';
import ws from './utils/web_service';
import { TWITCH_API_PATH } from './utils/constants';
import Stream from './components/Stream';

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
        language: 'fr',
      },
      filters: {
        min: '',
        max: '',
      },
      loading: false
    }
  }

  hasViewersFilter = () => this.state.filters.min !== '' || this.state.filters.max !== '';
  inViewersRange = (viewerCount) => viewerCount > this.state.filters.min && viewerCount < this.state.filters.max;

  getStreams = async () => {
    const streams = [];
    let cursor = '';
    let params = {};
    let i = 0;

    this.setState({loading: true});

    while (this.counter < 20) {
      params = i > 0 ? { ...this.state.queryParams, after: cursor } : this.state.queryParams;
      const fetchedStreams = await ws.get(TWITCH_API_PATH + 'streams', params);
      cursor = fetchedStreams.pagination.cursor;

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

    this.setState({loading: false});
    this.counter = 0;
  }

  handleViewersInputs = (e) => {
    const filters = { ...this.state.filters };
    filters[e.target.name] = e.target.value;
    this.setState({ filters: filters });
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

          <Button
            label="Filtrer"
            onClick={this.getStreams}
          />
        </div>

        <div className="streams">
          {this.state.loading ? (
            <div class="loading-spinner"><div></div><div></div></div>
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
