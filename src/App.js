import React, { Component } from 'react';
import { Grommet, Paragraph } from 'grommet';
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
  state = {
    streams: []
  }

  async componentDidMount() {
    const streams = await ws.get(TWITCH_API_PATH + 'streams');

    this.setState({
      streams: streams.data
    })
    console.log(streams);
  }

  render() {
    return (
      <Grommet theme={theme}>
        <div className="streams">
          {this.state.streams.length > 0 ? (
              this.state.streams.map((stream, i) => (
                <Stream key={stream.id} {...stream} />
              ))
          ) : (
            <Paragraph>
              Aucun stream n'a été trouvé avec ces critères.
            </Paragraph>
          )}
        </div>
      </Grommet>
    );
  }
}

export default App;
