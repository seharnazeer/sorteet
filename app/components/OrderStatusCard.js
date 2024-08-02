import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Icon } from 'react-native-elements';

export default class OrderStatusCard extends React.PureComponent {
    render() {
        return (
            <View style={styles.mainView}>
                <Text style={styles.textStyle} numberOfLines={this.props.lines}>{this.props.text}</Text>
                <Text style={styles.text}>{this.props.heading}</Text>
                <View style={[styles.iconView, {
                    backgroundColor: this.props.isStepCompleted ? EDColors.primary : EDColors.white,
                    borderColor: this.props.isStepCompleted ? EDColors.primary : EDColors.black
                }]}>
                    <Icon type={this.props.type} name={this.props.image} size={getProportionalFontSize(30)} style={styles.imageStyle} color={this.props.isStepCompleted ? EDColors.white : EDColors.black} />
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    textStyle: {
        fontSize: getProportionalFontSize(10),
        marginVertical: 2,
        fontFamily: EDFonts.regular,
        color: EDColors.primary,
    },
    imageStyle: { alignSelf: 'center' },
    text: {
        fontSize: getProportionalFontSize(10), fontFamily: EDFonts.regular,
        marginBottom: 2, textAlign: 'center', height: 30
    },
    mainView: { flex: 1, alignItems: "center", width: ((metrics.screenWidth - 20) / 7) + 3 },
    iconView: {
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderRadius: 50, padding: 8, marginBottom : 20,
    }
})
