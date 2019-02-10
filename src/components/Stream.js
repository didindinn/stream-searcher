import React, { Component } from 'react';
import { Image, Paragraph } from 'grommet'

class Stream extends Component {
    render() {
        let thumbnail = this.props.thumbnail_url.replace('{width}', 400);
        thumbnail = thumbnail.replace('{height}', 225);

        return (
            <div className="stream">
                <a href={`https://www.twitch.tv/${this.props.user_name}`} target="_blank" rel="noopener noreferrer">
                    <Image src={thumbnail} />
                    <Paragraph>{this.props.user_name}</Paragraph>
                    <Paragraph>{this.props.title}</Paragraph>
                    <Paragraph>{this.props.viewer_count}</Paragraph>
                </a>
            </div>
        );
    }
}

export default Stream;