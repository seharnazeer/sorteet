import React from 'react';
import { View } from 'react-native';
import { isRTLCheck } from '../utils/EDConstants';

export default class EDRTLView extends React.Component {
    render() {
        return (
            <View
                onLayout={this.props.onLayout}
                pointerEvents={this.props.pointerEvents || 'auto'}
                opacity={this.props.opacity || 1}
                style={[{ flexDirection: this.props.isWallet == 'wallet' ? 'column' : isRTLCheck() ? 'row-reverse' : 'row' }, this.props.style]}>
                {this.props.children}
            </View>
        )
    }
}
