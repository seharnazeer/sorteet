import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Assets from "../assets";
import { strings } from "../locales/i18n";
import { EDColors } from "../utils/EDColors";
import { debugLog, funGetFrench_Curr, getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import EDImage from "./EDImage";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";

export default class ProductComponent extends React.Component {

    constructor(props) {
        super(props);
        this.quantity = 0
        this.allowPreOrder = this.props.allowPreOrder || false
    }

    state = {
        quantity: 0
    }
    componentDidMount() {
    }

    render() {
        this.quantity = 0
        this.props.cartData.map((value) => {
            if (value.menu_id === this.props.data.menu_id && value.quantity >= 1) {
                this.quantity = parseInt(this.quantity) + parseInt(value.quantity)
            }
        })
        return (
            <View
                onLayout={this.props.onLayout}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={this.props.onProductPress}>

                    <EDRTLView style={[style.nestedContainer, this.props.style]}>
                        <EDImage
                            source={this.props.shouldLoadImage ? this.props.data.image : undefined}
                            placeholder={this.props.shouldLoadImage ? Assets.user_placeholder : Assets.imageLoading}
                            style={style.itemImage}
                            resizeMode={this.props.data.image !== undefined &&
                                this.props.data.image !== "" &&
                                this.props.data.image !== null ?
                                'cover' : 'contain'}
                        />
                        {this.props.data.in_stock == "0" && this.allowPreOrder ?
                            <View style={{
                                borderRadius: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: "rgba(0,0,0,.5)",
                                position: 'absolute', zIndex: 1, top: 10, left: 10, height: (metrics.screenHeight * .175) - 20, width: (metrics.screenHeight * .175) - 20
                            }}>
                                <EDRTLText title={strings("itemSoldOut")} style={[style.customTextStyle, { textAlign: "center", marginTop: 0, fontFamily: EDFonts.semiBold, color: EDColors.white, fontSize: getProportionalFontSize(13) }]} />
                                <EDRTLText title={"(" + strings("preOrder") + ")"} style={[style.customTextStyle, { textAlign: "center", marginTop: 2.5, fontFamily: EDFonts.semiBold, color: EDColors.white, fontSize: getProportionalFontSize(12) }]} />

                            </View>
                            : null}
                        <View style={style.centerViewStyle}>
                            <View style={{ flex: 1 }}>
                                <EDRTLView>
                                    <EDRTLText style={style.nestedTitle} numberOfLines={2} title={this.props.data.name} />
                                </EDRTLView>
                                {this.props.data.food_type_name !== undefined && this.props.data.food_type_name !== null && this.props.data.food_type_name !== "" ?
                                    <EDRTLText title={strings("foodType") + this.props.data.food_type_name} style={style.foodType} /> : null}
                                {this.props.data.availability !== undefined && this.props.data.availability !== null && this.props.data.availability !== "" ?
                                    <EDRTLText title={strings("availibility") + ': ' + this.props.data.availability} style={style.foodType} /> : null}
                                {/* <EDRTLText style={style.nestedDesc} title={this.props.data.menu_detail} /> */}
                                {this.props.data.is_customize === "1" ?
                                    <View>
                                        <Text style={[style.customTextStyle]}>{"(" + strings("customizationAvailable") + ")"}</Text>
                                    </View>
                                    : null}

                            </View>
                            <View style={{ justifyContent: "space-between", flexDirection: isRTLCheck() ? "row-reverse" : "row" }} >
                                {this.props.data.is_customize === "1" ?
                                    <View style={style.isCustom}>
                                        <EDRTLView style={{ alignItems: 'center' }}>
                                            <EDRTLText style={[style.nestedPrice, { color: EDColors.grey, textDecorationLine: this.props.data.offer_price !== "" ? "line-through" : null }]} title={this.props.currency + funGetFrench_Curr(this.props.data.price, 1, this.props.lan)} />
                                            {this.props.data.offer_price !== "" ? <EDRTLText style={[style.nestedPrice]} title={"  " + this.props.currency + funGetFrench_Curr(this.props.data.offer_price, 1, this.props.lan)} /> : null}
                                        </EDRTLView>
                                    </View>
                                    :
                                    <View style={style.isCustom}>
                                        <EDRTLView style={{ alignItems: 'center' }}>
                                            <EDRTLText style={[style.nestedPrice, { color: EDColors.grey, textDecorationLine: this.props.data.offer_price !== "" ? "line-through" : null, }]} title={this.props.currency + funGetFrench_Curr(this.props.data.price, 1, this.props.currency)} />
                                            {this.props.data.offer_price !== "" ? <EDRTLText style={[style.nestedPrice]} title={"  " + this.props.currency + funGetFrench_Curr(this.props.data.offer_price, 1, this.props.currency)} /> : null}
                                        </EDRTLView>
                                    </View>}

                                {this.props.isOpen ?
                                    <View
                                        style={style.isOpen}
                                    >
                                        {(this.props.data.in_stock == "0" && !this.allowPreOrder) ?
                                            <EDRTLText title={strings("itemSoldOut")} style={style.customTextStyle} />
                                            :
                                            <>
                                                {this.props.addons_category_list === undefined || this.props.addons_category_list.length === 0 ?
                                                    (this.props.cartData.some(item => item.menu_id === this.props.data.menu_id && item.quantity >= 1) ?
                                                        <View style={{}}>
                                                            <TouchableOpacity
                                                                onPress={() => { this.props.addOneData(this.props.data, -1) }}>
                                                                <View style={[style.minusBoxButton]}>
                                                                    <Icon size={getProportionalFontSize(16)} color={EDColors.black} name={'remove'} />

                                                                </View>
                                                            </TouchableOpacity>
                                                        </View> : null)
                                                    :
                                                    (this.props.addons_category_list === undefined || this.props.addons_category_list.length === 0) && this.props.cartData.length !== 0 ?
                                                        <View>
                                                            {this.props.cartData.some(item => item.menu_id === this.props.data.menu_id && item.quantity >= 1) ?
                                                                <View>
                                                                    <TouchableOpacity
                                                                        onPress={() => { this.props.minusItems(this.props.data) }}>
                                                                        <View style={[style.minusBoxButton]}>
                                                                            <Icon size={getProportionalFontSize(16)} color={EDColors.black} name={'remove'} />

                                                                        </View>
                                                                    </TouchableOpacity>
                                                                </View>
                                                                : null}
                                                        </View> : null}

                                                {/* <View> */}
                                                {(this.props.addons_category_list === undefined || this.props.addons_category_list.length === 0) && this.quantity != undefined && this.quantity != 0 && this.quantity > 0 ?
                                                    <Text style={style.qtyTextStyle}>{this.quantity}</Text>
                                                    : null}
                                                {/* </View> */}

                                                {this.props.addons_category_list === undefined || this.props.addons_category_list.length === 0 ?
                                                    this.props.cartData.some(item => item.menu_id === this.props.data.menu_id && item.quantity >= 1) ?
                                                        <View style={{}}>
                                                            <TouchableOpacity
                                                                style={[{ marginRight: !isRTLCheck() ? 0 : 20 }]}
                                                                onPress={() => { this.props.addOneData(this.props.data, 1) }}>
                                                                <View style={[style.roundButton]}>
                                                                    <Icon size={getProportionalFontSize(16)} color={EDColors.white} name={'add'} />

                                                                </View>

                                                            </TouchableOpacity>
                                                        </View> :
                                                        (this.props.data.in_stock !== "0" || this.allowPreOrder ?
                                                            <TouchableOpacity onPress={() => { this.props.addOneData(this.props.data, 1) }}>
                                                                <View style={[style.roundButton]}>
                                                                    <Icon size={getProportionalFontSize(16)} color={EDColors.white} name={'add'} />

                                                                </View>
                                                            </TouchableOpacity> :
                                                            <EDRTLText title={strings("itemSoldOut")} style={style.customTextStyle} />)
                                                    :
                                                    this.props.cartData.length !== 0 ?
                                                        <View>
                                                            {this.props.cartData.some(item => item.menu_id === this.props.data.menu_id && item.quantity >= 1) ?
                                                                <View>
                                                                    <TouchableOpacity
                                                                        onPress={() => { this.props.plusAction() }}>
                                                                        <View style={[style.roundButton]}>
                                                                            <Icon size={getProportionalFontSize(16)} color={EDColors.white} name={'add'} />

                                                                        </View>
                                                                    </TouchableOpacity>
                                                                </View>
                                                                :

                                                                <TouchableOpacity
                                                                    onPress={() => { this.props.addData(this.props.data) }}>
                                                                    <View style={[style.roundButton]}>
                                                                        <Icon size={getProportionalFontSize(16)} color={EDColors.white} name={'add'} />

                                                                    </View>
                                                                </TouchableOpacity>}
                                                        </View>
                                                        :
                                                        (this.props.data.in_stock !== "0" || this.allowPreOrder ?
                                                            <TouchableOpacity
                                                                onPress={() => { this.props.addData(this.props.data) }}>
                                                                <View style={[style.roundButton]}>
                                                                    <Icon size={getProportionalFontSize(16)} color={EDColors.white} name={'add'} />

                                                                </View>
                                                            </TouchableOpacity> :
                                                            <EDRTLText title={strings("itemSoldOut")} style={style.customTextStyle} />
                                                        )}
                                            </>}
                                    </View>
                                    : null}

                            </View>

                        </View>

                    </EDRTLView>

                </TouchableOpacity>
            </View>
        )
    }
}

export const style = StyleSheet.create({
    container: {
        flex: 1
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.50)"
    },
    emptyView: {
        flex: 1,
        textAlign: "center",
        textAlignVertical: "center",
        alignContent: "center",
        color: "#000",
        fontSize: getProportionalFontSize(15),
        fontFamily: EDFonts.regular
    },
    modalSubContainer: {
        backgroundColor: "#fff",
        padding: 10,
        marginLeft: 20,
        marginRight: 20,
        borderRadius: 6,
        width: Dimensions.get("window").width - 40,
        height: Dimensions.get("window").height - 80,
        marginTop: 20,
        marginBottom: 20
    },
    itemContainer: {
        alignSelf: "flex-start",
        flexDirection: "row",
        margin: 5,
        padding: 4,
        borderRadius: 4,
        backgroundColor: "#fff"
    },
    itemTitle: {
        flex: 3,
        color: "#000",
        padding: 10,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(18),
    },
    rightImage: {
        alignSelf: "center",
        marginEnd: 10
    },
    nestedContainer: {
        alignItems: "flex-start",
        borderRadius: 16,
        backgroundColor: "#ffffff",
        margin: 10,
        padding: 10,
        marginHorizontal: 15,
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
        // flex: 1
        height: metrics.screenHeight * 0.175,

    },
    nestedTitle: {
        fontFamily: EDFonts.semiBold,
        color: EDColors.black,
        fontSize: getProportionalFontSize(14),
    },
    foodType: {
        fontFamily: EDFonts.regular,
        color: "#000",
        fontSize: getProportionalFontSize(13),
        marginTop: 2.5,
        color: EDColors.black
    },
    nestedDesc: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(11),
        marginTop: 2.5,
        color: EDColors.textNew
    },
    nestedPrice: {
        fontFamily: EDFonts.semiBold,
        color: EDColors.black,
        fontSize: getProportionalFontSize(14),
        textAlign: isRTLCheck() ? 'right' : "left",
        justifyContent: 'flex-end',
        flexDirection: "row"
    },
    nestedRoundView: {
        alignSelf: "flex-end",
        bottom: 0,
        justifyContent: 'flex-end',
        marginBottom: -5,
        marginLeft: 10
    },
    qunContainer: {
        flex: 1,
        flexDirection: "row",
        marginRight: 10,
        justifyContent: "flex-end"
    },
    roundButton: {
        alignSelf: "flex-end",
        justifyContent: 'center',
        alignItems: "center",
        marginLeft: 10,
        backgroundColor: EDColors.primary,
        borderRadius: 8,
        padding: 5
    },
    minusBoxButton: {
        alignSelf: "flex-end",
        justifyContent: 'center',
        alignItems: "center",
        backgroundColor: EDColors.white,
        borderRadius: 8,
        padding: 5,
        borderWidth: 1.5,
        borderColor: EDColors.separatorColorNew,
    },
    minusIconStyle: {
        paddingVertical: 1
    },
    viewStyle: {
        width: 7,
        height: 7,
        margin: 2,
        borderRadius: 6,
    },
    parentViewStyle: {
        borderWidth: 1,
        alignSelf: "center"
    },
    customTextStyle: {
        fontFamily: EDFonts.regular,
        marginTop: 5,
        color: 'red',
        fontSize: 12,
    },
    imageStyle: {
        marginHorizontal: 5, width: 10,
        height: 10,
        tintColor: EDColors.primary
    },
    itemImage: { height: metrics.screenHeight * 0.175 - 20, width: metrics.screenHeight * 0.175 - 20, borderRadius: 8 },
    centerViewStyle: { marginHorizontal: 10, justifyContent: "space-between", flex: 1 },
    addItemView: {},
    subItemView: { flexDirection: 'row', alignItems: 'center' },
    qtyTextStyle: {
        alignSelf: 'center', fontSize: getProportionalFontSize(14), marginLeft: 10,
        color: EDColors.black, fontFamily: EDFonts.medium
    },
    addTouchableStyle: { borderRadius: 10, borderWidth: 1, borderColor: EDColors.primary },
    addonsAddViewStyle: { padding: 3, flexDirection: 'row', alignItems: 'center' },
    commanStyle: { marginLeft: 5 },
    subView: { flexDirection: 'column', flex: 0.8, justifyContent: 'space-between', alignItems: 'center' },
    isOpen: { flexDirection: 'row', justifyContent: 'space-between' },
    isCustom: { flexDirection: 'column', marginTop: 5 }
});