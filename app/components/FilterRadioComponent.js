import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { RadioButton, RadioGroup } from "react-native-flexi-radio-button";
import { EDColors } from "../utils/EDColors";
import { isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import EDRTLText from "./EDRTLText";

export default class FilterRadioComponent extends React.PureComponent {

    state = {
        index: this.props.index
    }

    onSelectedIndex = (value) => {
        this.props.onSelected(value)
        this.setState({
            index: value
        })
    }

    render() {
        return (
            <View style={[style.languageContainer, this.props.style]}>
                {this.props.title !== undefined && this.props.title !== null && this.props.title !== "" ?
                    <EDRTLText style={style.title} title={this.props.title} />
                    : null}
                <RadioGroup
                    size={18}
                    thickness={2}
                    color={this.props.color || EDColors.black}
                    onSelect={this.onSelectedIndex}
                    selectedIndex={this.state.index}
                >
                    {this.props.countryArray.map(index => {
                        return (
                            <RadioButton
                                style={{ flexDirection: isRTLCheck() ? 'row-reverse' : 'row' }}
                            >
                                <Text style={{ marginRight: 5 }}>{index.language_name}</Text>
                            </RadioButton>
                        )
                    })}
                </RadioGroup>
            </View>
        )
    }
}

export const style = StyleSheet.create({
    languageContainer: {
        marginHorizontal: 10,
        padding: 10,
        borderRadius: 6,
        backgroundColor: "#fff",
    },
    title: {
        fontFamily: EDFonts.bold,
        color: "#000",
        fontSize: 14,
        marginHorizontal: 10
    }
})