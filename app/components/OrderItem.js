import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { strings } from "../locales/i18n";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import EDImage from "./EDImage";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";

export default class OrderItem extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        return (
            <EDRTLView style={style.container}>
                <EDImage style={[style.itemImage, this.props.imageStyle]} source={this.props.itemImage} />

                <View style={style.subView}>
                    <EDRTLView>

                        <Text style={[style.itemName, this.props.titleStyle]}>{this.props.itemName}</Text>
                    </EDRTLView>
                    {this.props.foodType !== undefined && this.props.foodType !== null && this.props.foodType !== "" ?
                        <EDRTLText title={strings("foodType") + this.props.foodType} style={style.foodType} />
                        : null}
                    <EDRTLText style={[{ margin: 2 }, this.props.quantityStyle]} title={this.props.quantity} />
                    <EDRTLText style={[style.price, this.props.priceStyle]} title={this.props.price} />
                </View>
            </EDRTLView>
        );
    }
}

export const style = StyleSheet.create({
    container: {

        borderRadius: 16,
        backgroundColor: "#fff",
        alignSelf: "flex-start"
    },
    foodType: {
        fontFamily: EDFonts.regular,
        color: "#000",
        fontSize: getProportionalFontSize(12),
        marginTop: 3,
        marginHorizontal: 1
    },
    itemImage: {
        flex: 2,
        borderRadius: 8,
        marginHorizontal: 8,
        marginBottom: 3,
        marginTop: 3,
        height: 90
    },
    itemName: {
        fontSize: 18,
        fontFamily: EDFonts.bold,
        color: "#000",
    },
    qunContainer: {
        flex: 1,
        flexDirection: "row",
        marginRight: 10,
        justifyContent: "flex-end"
    },
    roundButton: {
        margin: 2,
        borderRadius: 10,
        backgroundColor: EDColors.primary,
        justifyContent: "center"
    },
    price: {
        marginTop: 10,
        marginBottom: 10,
        fontSize: 15,
        fontFamily: EDFonts.regular
    },
    deleteContainer: {
        flex: 0.8,
        backgroundColor: EDColors.primary,
        justifyContent: "center",
        alignItems: "center",
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6
    },
    subView: { flex: 4, marginTop: 10, marginLeft: 10 }
});
