import moment from "moment";
import React from "react";
import { Image, Text } from "react-native";
import { Linking, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import StarRating from "react-native-star-rating";
import { SvgXml } from "react-native-svg";
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Assets from "../assets";
import { strings } from "../locales/i18n";
import { showValidationAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import { direction_icon } from "../utils/EDSvgIcons";
import metrics from "../utils/metrics";
import EDImage from "./EDImage";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";
import EDText from "./EDText";
import { styles } from "./EDThemeHeader";
import EDUnderlineButton from "./EDUnderlineButton";

export default class RestaurantOverview extends React.PureComponent {
    render() {
        return (
            <>
                <Text
                    style={[style.openText, {
                        right: isRTLCheck() ? null : 15,
                        left: isRTLCheck() ? 15 : null,
                        backgroundColor: this.props.item.timings !== undefined && this.props.item.timings !== null && this.props.item.timings.closing !== undefined && this.props.item.timings.closing.toLowerCase() === "open" ?
                            EDColors.open : EDColors.error
                    }]}>
                    {this.props.item.timings !== undefined && this.props.item.timings !== null && this.props.item.timings.closing !== undefined && this.props.item.timings.closing.toLowerCase() === "open" ? strings("restaurantOpen") : strings("restaurantClosed")}
                </Text>
                {this.props.item.background_image !== undefined &&
                    this.props.item.background_image !== null &&
                    this.props.item.background_image !== "" ?

                    <EDImage
                        source={this.props.item.background_image}
                        placeholder={Assets.logo}
                        resizeMode={'cover'}
                        placeholderResizeMode={'contain'}
                        placeholderStyle={[style.bgImage, {
                            height: metrics.screenHeight * 0.1,
                            paddingVertical: metrics.screenHeight * 0.15,
                        }]}
                        style={style.bgImage}
                    /> :

                    <Image
                        source={Assets.logo}
                        resizeMode={'contain'}
                        style={{
                            height: metrics.screenHeight * 0.045,
                            width: "100%",
                            paddingVertical: metrics.screenHeight * 0.1,
                            marginBottom: metrics.screenHeight * 0.065,
                            marginTop : metrics.screenHeight * 0.035
                        }} />
                }
                <View style={[style.bgImage, { position: "absolute", backgroundColor: "rgba(0,0,0,.4)" }]} />
                <View style={style.container}>


                    <View style={style.mainView}>
                        <EDRTLView>
                            <EDImage source={this.props.item.image}
                                placeholder={Assets.logo}
                                resizeMode={'cover'}
                                placeholderResizeMode={'contain'}
                                style={style.ImageStyle}
                            />
                            <View style={{ flex: 1, marginHorizontal: 7.5 }}>
                                <EDText
                                    style={{ marginHorizontal: 0, marginTop: 0 }}
                                    textStyle={style.itemName}
                                    numberOfLines={2}
                                    title={this.props.item.name} />

                                <EDRTLView style={style.addressView}>
                                    <SimpleLineIcons name="location-pin" color={EDColors.text} size={15} />
                                    <EDRTLText style={{ marginHorizontal: 3, marginTop: 0, fontSize: getProportionalFontSize(12) }}
                                        numberOfLines={2}
                                        textStyle={style.txtStyle}
                                        title={this.props.item.address} />
                                </EDRTLView>
                            </View>
                        </EDRTLView>
                    </View>
                    <EDRTLView style={style.rtlView}>
                        {this.props.isShow ?

                            <TouchableOpacity onPress={() => this.props.onButtonClick(this.props.item)} activeOpacity={1}>

                                <EDRTLView style={{ marginRight: 5, alignItems: "center", marginTop: 5, borderWidth: .5, borderColor: EDColors.blackSecondary, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2.5 }}>
                                    {/* <StarRating
                                    disabled={true}
                                    starSize={getProportionalFontSize(18)}
                                    maxStars={5}
                                    emptyStarColor={EDColors.emptyStar}
                                    containerStyle={style.ratingStyle}
                                    fullStarColor={EDColors.fullStar}
                                    rating={parseFloat(this.props.rating)}
                                    fullStar={'star'}
                                    emptyStar={'star'}
                                    iconSet={'FontAwesome'}
                                /> */}
                                    <Icon name="star" color={EDColors.primary} size={17} />
                                    <EDRTLText title={
                                        this.props.rating !== undefined && this.props.rating !== null && this.props.rating !== "" && this.props.rating !== '0.0' ? (
                                            parseFloat(this.props.rating).toFixed(1) + " (" + this.props.total_reviews + " " + strings("ratings") + ")") : strings("homeNew")} style={style.ratingText} />
                                </EDRTLView>
                            </TouchableOpacity>
                            : null}
                        <TouchableOpacity onPress={this.props.onInfoPress} activeOpacity={1}>
                            <EDRTLView style={style.clockView}>
                                <Icon name="watch-later" color={EDColors.primary} style={{ marginHorizontal: 3 }} size={17} />
                                <EDRTLText style={{ marginTop: 0 }}
                                    numberOfLines={1}
                                    style={style.ratingText}
                                    title={this.props.item.timings !== undefined && this.props.item.timings !== null && this.props.item.timings.open != "" && this.props.item.timings.close != "" ?
                                        // Object.entries(this.props.item.week_timings)[0][1].label + " : " +
                                        moment().format("dddd") + " : " +
                                        this.props.item.timings.open + "-" + this.props.item.timings.close : strings("closeForDay")}
                                />
                                <Icon name="expand-more"
                                    onPress={this.props.onInfoPress}
                                    color={EDColors.primary} containerStyle={isRTLCheck() ? { marginRight: 5 } : { marginLeft: 5 }} size={18} />

                            </EDRTLView>
                        </TouchableOpacity>

                    </EDRTLView>
                    <EDRTLView style={style.rtlView}>
                        <TouchableOpacity onPress={this.onCallPressed} activeOpacity={1}>
                            <EDRTLView style={{ marginRight: 5, alignItems: "center", marginTop: 5, borderWidth: .5, borderColor: EDColors.blackSecondary, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2.5 }}>

                                <Icon name="call" color={EDColors.primary} size={17} />
                                <EDRTLText title={this.props.item.phone_number} style={style.ratingText} />
                            </EDRTLView>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={this.onAddressPressed} activeOpacity={1}>
                            <EDRTLView style={style.clockView}>
                                <Icon name="directions" color={EDColors.primary} style={{ marginHorizontal: 3, }} size={17} />
                                <EDRTLText style={{ marginTop: 0 }}
                                    numberOfLines={1}
                                    style={style.ratingText}
                                    title={strings("map")}
                                />
                            </EDRTLView>
                        </TouchableOpacity>
                        {this.props.item.about_restaurant !== undefined &&
                            this.props.item.about_restaurant !== null &&
                            this.props.item.about_restaurant.trim().length !== 0
                            ?
                            <TouchableOpacity activeOpacity={1} onPress={this.props.onAboutPress}>
                                <EDRTLView style={[style.clockView, {}]}>
                                    <Icon name="info" size={17} color={EDColors.primary} />
                                    <EDRTLText
                                        style={[style.ratingText, { marginHorizontal: 5 }]}
                                        title={strings("about")}
                                    />
                                </EDRTLView>
                            </TouchableOpacity> : null}
                    </EDRTLView>
                    <EDRTLView style={style.rtlView}>
                        {this.props.item.restaurant_type !== undefined &&
                            this.props.item.restaurant_type !== null &&
                            this.props.item.restaurant_type.trim().length !== 0
                            ?

                            <EDRTLView style={[style.clockView]}>
                                <Icon name="fastfood" size={15} color={EDColors.primary} />
                                <EDRTLText
                                    style={[style.ratingText, { marginHorizontal: 5 }]}
                                    title={this.props.item.restaurant_type}
                                />
                            </EDRTLView> : null}
                    </EDRTLView>
                </View>
            </>
        );
    }
    onCallPressed = () => {
        var telStr = `tel:${this.props.item.phone_number}`
        if (Linking.canOpenURL(telStr)) {
            Linking.openURL(telStr).catch((error) => showValidationAlert(strings("callNotSupport")))
        } else {
            showValidationAlert(strings("callNotSupport"))
        }
    }

    onAddressPressed = () => {
        var mapString = Platform.OS == "ios" ? 'maps' + ':0,0?q=' + this.props.item.address : 'geo' + ':0,0?q=' + this.props.item.address
        if (Linking.canOpenURL(mapString)) {
            Linking.openURL(mapString).catch((error) => showValidationAlert(strings("canNotLoadDirections")))
        } else {
            showValidationAlert(strings("canNotLoadDirections"))
        }

    }
}

export const style = StyleSheet.create({
    container: {
        paddingTop: 5,
        paddingBottom: 10,
        paddingLeft: 8,
        paddingRight: 8,
        backgroundColor: EDColors.white,
        borderRadius: 16,
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        marginHorizontal: 15,
        marginVertical: 8,
        marginTop: -80,
        // height: metrics.screenHeight * 0.285,
        // justifyContent: 'center',
    },
    aboutContainer: { marginTop: 10, padding: 10, alignItems: 'center', justifyContent: 'space-between', backgroundColor: EDColors.white, borderRadius: 6 },
    button: {
        borderRadius: 6,
        backgroundColor: EDColors.primary,
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 20,
        paddingRight: 20,
        alignSelf: "center",
        justifyContent: "center",
        marginTop: 10,
        alignItems: "center"
    },
    resText: {
        flex: 1, fontFamily: EDFonts.semiBold, color: "#000", fontSize: getProportionalFontSize(22),
        marginHorizontal: 0,
        marginTop: 0,
    },
    infoText: {
        fontFamily: EDFonts.semiBold, color: "#000", fontSize: getProportionalFontSize(14),
        marginHorizontal: 10,
    },
    clockView: {
        alignContent: "center", alignItems: 'center', marginTop: 5,
        borderWidth: .5, borderColor: EDColors.blackSecondary, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2.5,
        marginRight: 5
    },
    rtlView: { alignContent: "center", alignItems: 'center', marginTop: 3, flexWrap: "wrap" },
    addressImage: { marginTop: 0, height: 30, width: 30, paddingHorizontal: 20, tintColor: EDColors.primary },
    addressView: { marginTop: 3 },
    phoneImage: { marginTop: 0, height: 40, width: 40 },
    textViewStyle: { marginTop: -7, justifyContent: "space-between", alignItems: "center" },
    resHeaderStyle: { width: '100%', marginBottom: 10, justifyContent: 'flex-end' },
    callbuttonStyle: {
        marginTop: 5,
        // width:40,
        // height:40,
        // backgroundColor:EDColors.primary
    },
    imageStyle: { width: 17, tintColor: EDColors.primary },
    fontStyle: { fontSize: getProportionalFontSize(13), },
    txtStyle: { fontSize: getProportionalFontSize(13), textAlignVertical: 'center', overflow: 'hidden', fontFamily: EDFonts.regular, color: EDColors.black },
    sepratoreView: {
        marginTop: 10, height: 1, backgroundColor: "#000"
    },
    itemName: { fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(22) },
    imgStyle: { width: 15, tintColor: EDColors.primary },
    mainView: { marginTop: 5, justifyContent: "space-around" },
    iconStyle: { width: 45, height: 45, borderWidth: 1, borderColor: EDColors.separatorColorNew, backgroundColor: EDColors.white, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5, alignSelf: 'center', alignContent: "center" }
    , commentIconStyle: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5, alignSelf: 'center', backgroundColor: EDColors.primary, paddingLeft: 8, paddingTop: 6 },
    ratingText: {
        fontSize: getProportionalFontSize(12),
        fontFamily: EDFonts.regular,
        color: EDColors.black
    },
    ImageStyle: {
        height: getProportionalFontSize(72),
        width: getProportionalFontSize(72),
        borderRadius: 10
    },
    bgImage: {
        width: "100%", height: metrics.screenHeight * 0.3,

    },
    openText: {
        marginHorizontal: 5.5,
        fontSize: getProportionalFontSize(13),
        paddingHorizontal: 10,
        paddingVertical: 5,
        overflow: 'hidden',
        padding: 5,
        textAlignVertical: 'center',
        fontFamily: EDFonts.medium,
        color: EDColors.white,
        position: "absolute",
        top: 10,
        alignSelf: "flex-end",
        borderRadius: 5,
        zIndex: 1
    },
});

