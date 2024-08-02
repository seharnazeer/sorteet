import { View } from 'native-base';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { EDColors } from '../utils/EDColors';
import { getProportionalFontSize, isRTLCheck } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';
import TextviewRadius from './TextviewRadius';

export default class EDCategoryBox extends React.Component {

    state = {
        isSelected: this.props.isSelected || false
    }

    shouldComponentUpdate = newProps => {
        if (newProps.isSelected !== this.state.isSelected)
            this.setState({ isSelected: newProps.isSelected })
        return true
    }

    render() {
        return (
                <TextviewRadius
                    text={this.props.data.name}
                    style={{ backgroundColor: this.state.isSelected ? EDColors.primary : EDColors.offWhite, height: heightPercentageToDP("5.5%"), borderRadius : 10 , marginHorizontal :0, marginRight : 7.5}}
                    textStyle={[styles.optionText, { color: this.state.isSelected ? EDColors.offWhite : EDColors.black }]}
                    onPress={this.toggleSelection}
                />
        )
    }

    toggleSelection = () => {
        if (this.state.isSelected) {
            this.props.removeFromFoodType(this.props.data)
            this.setState({ isSelected: false })
        }
        else {
            this.props.addToFoodType(this.props.data)
            this.setState({ isSelected: true })
        }
    }


}

const styles = StyleSheet.create({
    listContainer: {
        
    },
    optionText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(16),
        marginHorizontal: 20,
    }
})

