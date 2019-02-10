import React, { Component } from 'react';
import { Paragraph } from 'grommet'

class Stream extends Component {
    render() {
        return(
            <Paragraph>
                {this.props.user_name}
            </Paragraph>
        );
    }
}

export default Stream;