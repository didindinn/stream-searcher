import React, { Component } from 'react';

class Stream extends Component {
    render() {
        let thumbnail = this.props.thumbnail_url.replace('{width}', 400);
        thumbnail = thumbnail.replace('{height}', 225);

        return (
            <div className="stream" title={this.props.title}>
                <a href={`https://www.twitch.tv/${this.props.user_name}`} target="_blank" rel="noopener noreferrer">
                    <figure className="stream__thumbnail-container">
                        <figcaption className="stream__viewers">{this.props.viewer_count} viewers</figcaption>
                        <img src={thumbnail} alt="Twitch stream" className="stream__thumbnail" />
                    </figure>
                    <div className="stream__info">
                        <p className="stream__title">{this.props.title}</p>
                        <p className="stream__streamer">{this.props.user_name}</p>
                        {this.props.game_name &&
                            <p className="stream__game">{this.props.game_name}</p>
                        }
                    </div>
                </a>
            </div>
        );
    }
}

export default Stream;