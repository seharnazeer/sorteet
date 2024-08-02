import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { debugLog, funGetFrench_Curr, getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";
import { EDColors } from "../utils/EDColors";
import { Icon } from "react-native-elements";
import EDPopupView from "./EDPopupView";
import { strings } from "../locales/i18n";
import { FlatList } from "react-native";

export default class PriceDetail extends React.PureComponent {

    state = {
        detailVisible: false
    }

    deleteCoupon = () => {
        if (this.props.deleteCoupon)
            this.props.deleteCoupon(this.props.coupon_name)
    }

    showTaxBreakdown = () => {
        this.setState({ detailVisible: true })
    }

    hideTaxBreakdown = () => {
        this.setState({ detailVisible: false })
    }

    renderDetailModal = () => {
        return (
            <EDPopupView isModalVisible={this.state.detailVisible}
                shouldDismissModalOnBackButton
                onRequestClose={this.hideTaxBreakdown}
            >
                <View style={style.modalStyle}>
                    <EDRTLView style={style.headerContainer}>
                        <EDRTLText title={strings("taxes&Fees")} style={style.headerText} />
                        <Icon name="close" color={EDColors.primary} size={24} onPress={this.hideTaxBreakdown} />
                    </EDRTLView>
                    <FlatList
                        contentContainerStyle={{ paddingTop: 5 }}
                        data={this.props.taxable_fields}
                        renderItem={({ item, index }) => {
                            return <EDRTLView style={{ alignItems: 'center', justifyContent: "space-between", marginBottom: 5 }}>
                                <EDRTLText style={style.modalItemTitle} title={item.label} />
                                <Text style={style.modalPrice} >{
                                    this.props.currency + funGetFrench_Curr(item.value, 1, this.props.currency)}</Text>
                            </EDRTLView>
                        }}
                    />

                </View>

            </EDPopupView>
        )
    }

    render() {
        return (
            <View>
                {this.renderDetailModal()}
                {this.props.price !== "" && this.props.price !== null && this.props.price !== undefined && this.props.label_key !== "Coupon Amount" ?
                    <EDRTLView style={[style.container, this.props.style]}>
                        <View style={{ flex: 1 }}>
                            <EDRTLView style={{ flex: 1, alignItems: 'center' }}>
                                <EDRTLText style={[style.itemTitle, this.props.titleStyle]} title={this.props.title} />
                                {this.props.showToolTip ?
                                    <Icon name="infocirlce" type="ant-design" size={16} onPress={this.showTaxBreakdown} />
                                    : null
                                }
                                {this.props.coupon_name !== undefined && this.props.coupon_name !== null && this.props.coupon_name !=="" ?
                                    <Icon name="delete" type="ant-design"  size={16} onPress={this.deleteCoupon} /> : null}
                            </EDRTLView>
                            {this.props.subtitle !== undefined && this.props.subtitle !== null && this.props.subtitle.trim().length !== 0 ?
                                <EDRTLText style={style.subtitle} title={this.props.subtitle} />
                                : null}
                        </View>
                        <Text style={[style.price, this.props.priceStyle]} >{this.props.price}</Text>
                    </EDRTLView>
                    : <View />
                }
            </View>
        );
    }
}

export const style = StyleSheet.create({
    container: {
        marginTop: 10,
        marginLeft: 10,
        marginRight: 20,
        alignItems: 'center'
    },
    price: {
        fontFamily: EDFonts.bold,
        fontSize: getProportionalFontSize(14),
        color: EDColors.grey,

    },
    modalPrice: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(13),
        color: EDColors.black,

    },
    itemTitle: {
        fontFamily: EDFonts.bold,
        fontSize: getProportionalFontSize(14),
        color: EDColors.grey,
    },
    modalItemTitle: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(13),
        color: EDColors.black,
        flex: 1
    },
    headerText: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(16),
        color: EDColors.primary,
    },
    subtitle: {
        flex: 1,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(12),
        marginTop: 2,
        color: EDColors.grey,
        marginHorizontal: 10
        // height: 20
    },
    modalStyle: { backgroundColor: EDColors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, margin: 10 },
    headerContainer: { justifyContent: "space-between", alignItems: 'center', borderBottomWidth: 1, borderBottomColor: EDColors.separatorColorNew, paddingBottom: 5 }
});