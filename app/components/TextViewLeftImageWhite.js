import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Icon } from "react-native-elements";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import EDRTLView from "./EDRTLView";

export default class TextViewLeftImageWhite extends React.PureComponent {
    render() {
        return (
            <EDRTLView style={style.container}>
                <Icon
                    name={this.props.image}
                    type={this.props.type || 'material'}
                    size={this.props.size || getProportionalFontSize(20)}
                    color={EDColors.white}
                />
                <Text style={style.text} numberOfLines={this.props.lines}>
                    {this.props.text}
                </Text>
            </EDRTLView>
        );
    }
}

export const style = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        marginTop: 10,
        marginLeft: 5
    },
    text: {
        fontSize: getProportionalFontSize(14),
        fontFamily: EDFonts.regular,
        marginLeft: 5,
        color: EDColors.white
    },
    image: {
        width: 20,
        height: 20
    }
});
