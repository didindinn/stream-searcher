import React, { Component } from 'react';

class RadioInput extends Component {
    render() {
        return (
            <>
                <label htmlFor={this.props.id}>{this.props.children}</label>
                <input
                    className="radio"
                    type="radio"
                    id={this.props.id}
                    label="Exclude"
                    name="game-filter"
                    value={this.props.value}
                    checked={this.props.checked}
                    onChange={this.props.onChange}
                />
            </>
        );
    }
}

export default RadioInput;