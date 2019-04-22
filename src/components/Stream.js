import React, { Component } from 'react';
import ReactGA from 'react-ga';

class Stream extends Component {
    redirect = (userName) => {
        ReactGA.outboundLink(
            { label: 'Clicked ' + userName + ' Stream' },
            function () {
                document.location.href = `https://www.twitch.tv/${userName}`;
            }
        );
    };

    render() {
        let thumbnail = this.props.thumbnail_url.replace('{width}', 400);
        thumbnail = thumbnail.replace('{height}', 225);

        return (
            <div className="stream" title={this.props.title} onClick={() => this.redirect(this.props.user_name)}>
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
            </div>
        );
    }
}

export default Stream;