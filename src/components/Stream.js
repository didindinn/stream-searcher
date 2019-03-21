import React, { Component } from 'react';

class Stream extends Component {
    render() {
        let thumbnail = this.props.thumbnail_url.replace('{width}', 400);
        thumbnail = thumbnail.replace('{height}', 225);

        return (
            <div className="stream">
                <a href={`https://www.twitch.tv/${this.props.user_name}`} target="_blank" rel="noopener noreferrer">
                    <p className="stream__viewers">Viewers: {this.props.viewer_count}</p>
                    <p className="stream__title">{this.props.title}</p>
                    <img src={thumbnail} alt="Twitch stream" className="stream__thumbnail" />
                    {this.props.game_name &&
                        <p className="stream__game">{this.props.game_name}</p>
                    }
                    <p className="stream__streamer">Streamer: {this.props.user_name}</p>
                </a>
            </div>
        );
    }
}

export default Stream;