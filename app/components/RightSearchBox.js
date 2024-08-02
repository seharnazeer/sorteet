import React from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Icon } from "react-native-elements";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import EDRTLView from "./EDRTLView";

export default class RightSearchBox extends React.PureComponent {

    render() {
        return (

            <EDRTLView style={style.container}>
                <TextInput
                    value={this.props.value}
                    style={[style.inputText, { textAlign: isRTLCheck() ? 'right' : 'left' }]}
                    placeholder={this.props.placeholder}
                    returnKeyType='search'
                    selectionColor={EDColors.primary}
                    onChangeText={text => {
                        this.props.onChangeText(text);
                    }}
                    onSubmitEditing={this.props.onSearchClick}
                />
                <TouchableOpacity
                    style={style.search}
                    activeOpacity={1.0}
                    onPress={() => { this.props.onSearchClick(); }}>
                    <Icon
                        name={"search"}
                        color={EDColors.white}
                    />
                </TouchableOpacity>
            </EDRTLView>
        );
    }
}

export const style = StyleSheet.create({
    container: {
        margin: 10, borderRadius: 6, shadowColor: "gray",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        overflow: 'hidden',
        backgroundColor: "#fff"
    },
    inputText: {
        padding: 8, flex: 1,
        fontSize: getProportionalFontSize(14), //R.K 07-01-2021
        fontFamily: EDFonts.regular
    },
    search: {
        padding: 10, backgroundColor: EDColors.primary,
    },
    imgStyle: { alignSelf: "center" }
});

