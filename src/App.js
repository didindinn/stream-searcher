import React, { Component } from 'react';
import { Grommet } from 'grommet'

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
  render() {
    return (
      <Grommet theme={theme}>
        App
      </Grommet>
    );
  }
}

export default App;
