import { Spinner } from "native-base";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import { strings } from "../locales/i18n";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import EDImage from "./EDImage";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";
import EDText from "./EDText";
import EDThemeButton from "./EDThemeButton";
import { styles } from "./EDMenuListComponent";

export default class ImageGrid extends React.Component {

    quantity = 0

    state = {
        quantity: 0,
        cartLoading: false,
        cartData: []
    }

    onPressAddtoCartHandler = (qty) => {
        this.setState({ cartLoading: true })
        if ((this.props.item.is_customize === "1" || this.props.item.is_customize === 1) && qty == -1)
            this.props.navigateToCart()
        else
            this.props.onAddToCart(this.props.item, qty)
    }


    componentDidMount() {
        this.setState({
            cartData: this.props.cartData,
        })
        this.props.cartData.map((value) => {
            if (value.menu_id === this.props.item.menu_id && value.quantity >= 1) {
                this.quantity = parseInt(this.quantity) + parseInt(value.quantity)
            }
        })
        this.setState({
            quantity: this.quantity
        })
    }

    componentWillReceiveProps(props) {
        this.setState({
            cartData: props.cartData,
            cartLoading: false
        })
    }

    render() {
        let count = 0
        let same_item_incart = this.state.cartData.filter(item => { return item.menu_id === this.props.item.menu_id })
        if (same_item_incart !== undefined && same_item_incart !== null && same_item_incart.length !== 0) {
            same_item_incart.map(data => {
                count = count + data.quantity
            })
        }

        return (
            <View style={style.container} >
                <TouchableOpacity onPress={this.onPressHandler}>
                    <EDImage style={style.image} source={this.props.item.image} />

                    <EDText ellipsizeMode={"tail"} numberOfLines={1} style={style.title}
                        title={this.props.item.name} />
                    <EDRTLText style={[style.price, { textDecorationLine: this.props.item.offer_price !== "" ? "line-through" : null }]} title={this.props.item.price !== null && this.props.item.price !== "0" && this.props.item.price !== "0.00" ? this.props.currency + this.props.item.price : ""} />
                    {this.props.item.offer_price !== "" ?
                        <EDRTLText style={[style.price, { color: EDColors.primary, marginTop: 0 }]} title={this.props.currency + this.props.item.offer_price} /> : null}
                </TouchableOpacity>
                {this.state.cartLoading ?
                    <Spinner size="small" color={EDColors.primary} style={{ height: 40 }} /> :
                    (this.props.isOpen ?
                        (this.state.cartData.some(item => item.menu_id === this.props.item.menu_id && item.quantity >= 1) ?
                            <EDRTLView style={style.qtyContainer}>
                                <Icon name="remove-circle" size={getProportionalFontSize(22)} color={EDColors.primary} onPress={() => this.onPressAddtoCartHandler(-1)} />
                                <Text style={style.qtyText}>
                                    {count}
                                </Text>
                                <Icon name="add-circle" size={getProportionalFontSize(22)} color={EDColors.primary} onPress={() => this.onPressAddtoCartHandler(1)} />

                            </EDRTLView> :
                            <EDThemeButton
                                style={style.buttonStyle0}
                                textStyle={{
                                    fontSize: getProportionalFontSize(12)
                                }}
                                label={strings("addToCart")}
                                onPress={() => this.onPressAddtoCartHandler(1)}

                            />) : null)}
            </View>
        );
    }

    onPressHandler = () => {
        this.props.onPress(this.props.item)
    }
}

export const style = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderRadius: 6,
        shadowColor: "#000",
        width: metrics.screenWidth * 0.5 - 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 1,
        margin: 10,
        alignSelf: "flex-start"
    },
    image: {
        width: metrics.screenWidth * 0.5 - 20,
        height: metrics.screenHeight * 0.2,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6
    },
    title: {
        flex: 1,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(16),
        marginLeft: 5,
        marginTop: 5,
        marginRight: 5,
        color: "#000"
    },
    price: {
        fontFamily: EDFonts.regular,
        marginHorizontal: 5,
        marginVertical: 5
    },
    qtyContainer: {
        alignItems: "center",
        alignSelf: "center",
        height: 35,
        marginBottom: 5
    },
    qtyText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(18),
        marginHorizontal: 10
    }, buttonStyle0: {
        width: metrics.screenWidth * .45 - 10,
        height: 30,
        marginBottom: 10,
        marginTop: 0
    }
});
