import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import BaseContainer from "./BaseContainer";
import Assets from "../assets";
import EDThemeButton from "../components/EDThemeButton";
import { connect } from "react-redux";
import { saveCartCount } from "../redux/actions/Checkout";
import { getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import NavigationService from "../../NavigationService";
import { strings } from "../locales/i18n";
import { EDFonts } from "../utils/EDFontConstants";
import Icon from 'react-native-vector-icons/FontAwesome'
import { EDColors } from "../utils/EDColors";
import metrics from "../utils/metrics";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { initialWindowMetrics } from "react-native-safe-area-context";


class OrderConfirm extends React.PureComponent {
    //#region LIFE CYCLE METHODS

    constructor(props) {
        super(props);

        this.resObj = this.props.navigation.state.params.resObj
    }

    currency = this.props.navigation.state.params.currecy_code
    cashback = this.props.navigation.state.params.cashback




    // RENDER METHOD
    render() {
        return (
            <BaseContainer
                title={strings("orderConfirm")}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={this.onLeftEventHandler}
            >


                {/* MAIN VIEW */}
                <View style={{ flex: 1 }}>
                    {/* CONFRIM IMAGE */}
                    <View style={style.container}>
                        <View style={style.subContainer}>
                            <Image
                                source={Assets.header_placeholder}
                                style={style.imageStyle}
                                resizeMode="contain"
                                />
                        </View>

                        <View style={style.textView}>
                            <Text style={style.thankyouText}>{strings("orderSuccess")}</Text>
                            {this.cashback !== undefined && this.cashback !== null && this.cashback !== "0.00" && this.cashback !== "0" && this.cashback !== 0
                                && this.props.userID !== undefined &&
                                this.props.userID !== null &&
                                this.props.userID !== ""
                                ?
                                <Text style={[style.cashbackText]}>{strings("earned") + this.props.currency + this.cashback}</Text> : null}
                        </View>
                    </View>
                </View>
                {/* TRACK ORDER BUTTON */}
                <View style={style.btnView}>
                    <EDThemeButton
                        label={this.props.userID !== undefined &&
                            this.props.userID !== null &&
                            this.props.userID !== "" ? strings("trackYourOrder") : strings("continue")}
                        onPress={ this.onTrackOrderEventHandler}
                        style={[style.btnStyle,{
								marginBottom: (Platform.OS == "ios" ? initialWindowMetrics.insets.bottom : 0) + 10,

                        }]}
                        textStyle={style.btnText}
                    />
                </View>

            </BaseContainer>
        );
    }
    //#endregion

    //#region 
    /** TRACK UTTON EVENT */
    onTrackOrderEventHandler = () => {
        this.props.saveCartCount(0);
        NavigationService.navigateToSpecificRoute(
            this.props.userID !== undefined &&
                this.props.userID !== null &&
                this.props.userID !== "" ?
                "Order" : "Home")

    }
    //#endregion


    //#region 
    /**ON LEFT PRESSED| */
    onLeftEventHandler = () => {
        NavigationService.navigateToSpecificRoute("Home")
    }
    //#endregion
}

export default connect(
    state => {
        return {
            userID: state.userOperations.userIdInRedux,
            token: state.userOperations.phoneNumberInRedux,
            cartCount: state.checkoutReducer.cartCount,
            lan: state.userOperations.lan,
            currency: state.checkoutReducer.currency_symbol,

        };
    },
    dispatch => {
        return {
            saveCartCount: data => {
                dispatch(saveCartCount(data));
            }
        };
    }
)(OrderConfirm);


export const style = StyleSheet.create({
    container: {
        flex: 1,
        position: "absolute",
        width: "100%",
        height: "100%"
    },
    thankyouText: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(16),
        color: '#000',
        marginTop: 25,
    },
    subContainer: {
        flex: 1,
        justifyContent: "flex-end",
    },
    btnStyle: {
        backgroundColor: EDColors.homeButtonColor,
        borderRadius: 16,
        width: "100%",
        height: Platform.OS == 'android' ? heightPercentageToDP('6%') : heightPercentageToDP('6.0%'),
        justifyContent: 'center',
        alignSelf: 'center',
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
        paddingHorizontal: 10
    },
    btnText: {
        color: EDColors.white,
        textAlign: 'center',
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(17),
    },
    imageStyle: { alignSelf: 'center', height : metrics.screenHeight * .3, width : metrics.screenWidth * .75 },
    textView: { flex: 1, marginTop: 0, alignItems: "center" },
    btnView: { marginHorizontal: 10 },
    cashbackText: { fontSize: getProportionalFontSize(14), fontFamily: EDFonts.medium, color: '#999999', marginTop: 10 },
});


// export const style = StyleSheet.create({
//     container: {
//         flex: 1,
//         position: "absolute",
//         width: "100%",
//         height: "100%"
//     },
//     thankyouText: {
//         fontFamily: EDFonts.satisfy,
//         fontSize: getProportionalFontSize(22),
//         color: "#000",
//         marginTop: 20
//     },
//     subContainer: {
//         flex: 1,
//         justifyContent: "flex-end",
//     },
//     outerView: { backgroundColor: '#fcedc7', borderRadius: 100, width: 160, height: 160, alignSelf: "center", justifyContent: 'center' },
//     midView: { backgroundColor: '#fccf64', borderRadius: 100, width: 130, height: 130, alignSelf: "center", justifyContent: 'center' },
//     innerView: { backgroundColor: EDColors.primary, borderRadius: 100, width: 100, height: 100, alignSelf: "center", justifyContent: 'center' }
// });
