import React, { Component } from 'react';

class NumberInput extends Component {
    render() {
        return (
            <>
                <label htmlFor={this.props.id} className="input__label">{this.props.children}</label>
                <input
                    type="number"
                    id={this.props.id}
                    name={this.props.id}
                    value={this.props.value}
                    onChange={this.props.onChange}
                    className="input__number"
                />
            </>
        );
    }
}

export default NumberInput;