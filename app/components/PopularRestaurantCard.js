import React, { Component } from "react";
import { FlatList } from "react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import Carousel from "react-native-snap-carousel";
import StarRating from 'react-native-star-rating';
import Assets from "../assets";
import { strings } from '../locales/i18n';
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import EDImage from "./EDImage";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";
import EDText from "./EDText";
import LinearGradient from 'react-native-linear-gradient';
import h2p from 'html2plaintext'
export default class PopularRestaurantCard extends Component {
    constructor(props) {
        super(props);
        // this.coupon = this.props.restObjModel.restaurant_coupons || []
    }

    componentWillReceiveProps(props) {
        this.setState({ restObjModel: props.restObjModel.item });
    }

    state = {
        restObjModel: this.props.restObjModel.item
    };

    render() {
        return (
            <TouchableOpacity
                style={{ flex: 1, marginHorizontal: 5 }}
                activeOpacity={1}
                onPress={this._onModelPressed}>
                <View style={{ margin: 5 }}>
                    <View style={styles.container}>
                        <View>
                            <EDImage
                                source={this.state.restObjModel.image}
                                style={styles.imageStyle}
                                resizeMode={'cover'}
                                placeholder={Assets.logo}
                                placeholderResizeMode={"contain"}
                            />
                            {this.state.restObjModel.restaurant_coupons !== undefined &&
                                this.state.restObjModel.restaurant_coupons !== null &&
                                this.state.restObjModel.restaurant_coupons.length !== 0
                                ?
                                <LinearGradient
                                    style={{ position: "absolute", bottom: 0, width: "100%", height: "100%", justifyContent: "flex-end" }}
                                    colors={[EDColors.transparent, "rgba(0,0,0,0.1)", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)",]}
                                >
                                    <View>

                                        <Carousel
                                            horizontal
                                            pagingEnabled
                                            sliderWidth={metrics.screenWidth - 20}
                                            itemWidth={metrics.screenWidth - 20}
                                            windowSize={5}
                                            autoplay
                                            scrollEnabled={false}
                                            autoplayInterval={5000}
                                            loop
                                            data={this.state.restObjModel.restaurant_coupons}
                                            renderItem={({ item, index }) => {
                                                return <EDRTLView style={{ alignItems: 'flex-start', padding: 10, paddingHorizontal: 15 }}>
                                                    <Icon name="local-offer" size={18} color={EDColors.white} />
                                                    <EDRTLText style={styles.promoTitle} numberOfLines={2} title={item.name + ", " + h2p(item.description)} />
                                                </EDRTLView>
                                            }}
                                        />
                                    </View>
                                </LinearGradient>
                                : null}
                            <Text
                                style={[styles.textStyle, {
                                    left: isRTLCheck() ? null : 10,
                                    right: isRTLCheck() ? 10 : null,
                                    backgroundColor: this.state.restObjModel.timings !== undefined && this.state.restObjModel.timings !== null && this.state.restObjModel.timings.closing !== undefined && this.state.restObjModel.timings.closing.toLowerCase() === "open" ?
                                        EDColors.open : EDColors.error
                                }]}>
                                {this.state.restObjModel.timings !== undefined && this.state.restObjModel.timings !== null && this.state.restObjModel.timings.closing !== undefined && this.state.restObjModel.timings.closing.toLowerCase() === "open" ? strings("restaurantOpen") : strings("restaurantClosed")}
                            </Text>

                            {/* <Text
                                style={[styles.textStyle, {
                                    left: isRTLCheck() ? 10 : null,
                                    right: isRTLCheck() ? null : 10,
                                    backgroundColor: EDColors.black
                                }]}>
                                {this.state.restObjModel.timings !== undefined && this.state.restObjModel.timings !== null && this.state.restObjModel.timings.closing !== undefined && this.state.restObjModel.timings.closing.toLowerCase() === "open" ? strings("restaurantOpen") : strings("restaurantClosed")}
                            </Text> */}

                            <EDRTLView style={[styles.distanceContainer, {
                                alignSelf: isRTLCheck() ? 'flex-start' : 'flex-end',

                                overflow: 'hidden'
                            }]}>
                                <Icon name="motorcycle" type={"font-awesome-5"} color={EDColors.white} size={getProportionalFontSize(15)} />
                                <EDRTLText title={parseFloat(this.state.restObjModel.distance).toFixed(2) + " " + (this.props.useMile ? strings("miles") : strings("km"))} style={styles.newText} />

                            </EDRTLView>
                        </View>
                        <View style={styles.mainView}>

                            <EDRTLView style={{ justifyContent: "space-between", flex: 4 }}>

                                <EDText style={{ marginHorizontal: 0, marginTop: 0, flex: 3 }}
                                    textStyle={{ fontFamily: EDFonts.bold, fontSize: getProportionalFontSize(16) }}
                                    title={this.state.restObjModel.name} />
                                {this.props.isShowReview ?
                                    <View style={{}}>
                                        <View style={styles.reviewContainer}>

                                            {this.state.restObjModel.rating != null &&
                                                this.state.restObjModel.rating > 0 ?
                                                <EDRTLView style={styles.centerView}>
                                                    <Icon name={"star"} type="ant-design" color={EDColors.white} size={getProportionalFontSize(10)} />
                                                    <EDRTLText title={this.state.restObjModel.rating + " (" + this.state.restObjModel.restaurant_review_count + " " + strings("ratings") + ")"} style={styles.newText} />
                                                </EDRTLView> :
                                                <View>
                                                    <EDRTLText title={strings("homeNew")} style={[styles.newText, { fontSize: getProportionalFontSize(11), padding: 1 }]} />
                                                </View>
                                            }
                                        </View>
                                    </View>
                                    : null}
                            </EDRTLView>

                            <EDRTLView
                                style={styles.rtlView}>
                                <Icon name={"location-pin"} type="simple-line-icon" color={EDColors.text} size={getProportionalFontSize(15)} />
                                <EDRTLText style={styles.addressStyle}
                                    numberOfLines={1}
                                    title={this.state.restObjModel.address} />
                            </EDRTLView>

                            <EDRTLView style={styles.ratingStyle}>
                                {/* <EDRTLView
                                    style={{ alignContent: "center" }}>
                                    <Icon name={"route"} color={EDColors.text} size={13} />
                                    <EDText style={{ marginHorizontal: 0, marginTop: 0, }}
                                        numberOfLines={1}
                                        textStyle={styles.addressStyle}
                                        title={parseFloat(this.state.restObjModel.distance).toFixed(2) + " KM"} />
                                </EDRTLView> */}


                            </EDRTLView>
                            {/* <FlatList
                                    horizontal
                                    pagingEnabled
                                    data={this.coupon}
                                    renderItem={({ item, index }) => {
                                        return <View style={{padding:5, borderRadius : 6,backgroundColor: EDColors.primary, marginRight:5, marginBottom:10}}>
                                            <EDRTLView style={{ alignItems: 'center' ,}}>
                                                <Icon name="local-offer" size={16} color={EDColors.white} />
                                                <EDRTLText style={styles.promoTitle} title={item.name} />
                                            </EDRTLView>
                                        </View>
                                    }}
                                /> */}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    _onModelPressed = () => {
        this.props.onPress(this.state.restObjModel)
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: EDColors.white,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,

        elevation: 1,
        marginHorizontal: 5
    },
    centerView: { justifyContent: 'center', alignItems: 'center' },
    imageStyle: { width: "100%", height: metrics.screenHeight * 0.24, alignSelf: "center" },
    textStyle: {
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
    },
    newText: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(12),
        // textAlign: 'center',
        // alignSelf: 'center',
        // textAlignVertical: 'center',
        color: EDColors.white,
        paddingHorizontal: 5,
    },
    reviewContainer: {
        padding: 5,
        backgroundColor: EDColors.grayNew,
        borderRadius: 4,
        // marginBottom: 2.5,
        justifyContent: 'center'
        // maxHeight: 25
    },
    distanceContainer: {
        backgroundColor: EDColors.distance,
        position: "absolute",
        top: 10,
        right: 10,
        padding: 5,
        paddingHorizontal: 10,
        alignItems: 'center',
        borderRadius: 5,
        marginHorizontal: 5
    },
    rtlView: { marginTop: 2.5 },
    mainView: { marginHorizontal: 12.5, marginTop: 10 },
    ratingStyle: { marginTop: 3, marginBottom: 10, justifyContent: 'space-between', alignItems: 'center' },
    addressStyle: {
        marginHorizontal: 5,
        fontSize: getProportionalFontSize(14),
        fontFamily: EDFonts.regular,
        maxWidth: metrics.screenWidth * .85
    },
    promoTitle: {
        marginHorizontal: 2.5,
        fontSize: getProportionalFontSize(12),
        fontFamily: EDFonts.semiBold,
        color: EDColors.white,
        flex: 1
    },
    promoSubTitle: {
        marginHorizontal: 23,
        fontSize: getProportionalFontSize(11),
        fontFamily: EDFonts.regular,
        color: EDColors.white

    }
})
