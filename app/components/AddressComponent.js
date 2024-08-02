

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { debugLog } from '../utils/EDConstants';
import { getProportionalFontSize, isRTLCheck } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';

export default class AddressComponent extends React.PureComponent {

    constructor(props) {
        super(props)

    }

    render() {
        return (
            <TouchableOpacity
                style={[this.props.isSelected ? style.selected : this.props.isAddressList ? style.isAddressList : style.default]}
                onPress={this.selectAddressHandler}
            >


                <EDRTLView style={[style.currentAddress]}>
                    <EDRTLView style={{ flex: 1 }}>
                        <Icon name={this.props.data.is_main == "1" ? "home-filled" : "business"} type={this.props.data.is_main == "1" ? "material" : "ionicon"} color={EDColors.primary} size={this.props.data.is_main == "1" ? 28 : 23} containerStyle={{ marginRight: 20 }} />
                        <View style={{ flex: 1 }}>
                            <EDRTLText title={this.props.data.address_label !== undefined &&
                                this.props.data.address_label !== null &&
                                this.props.data.address_label.trim().length !== 0 ?
                                this.props.data.address_label :
                                this.props.data.address.split(',')[0]
                            } style={style.currentLocationText} />
                            <EDRTLText title={
                                this.props.data.address_label !== null &&
                                    this.props.data.address_label.trim().length !== 0 ?
                                    this.props.data.address :
                                    this.props.data.address.substring(this.props.data.address.indexOf(",") + 2)
                            } style={style.currentLocationSubText} />
                            {this.props.data.is_main == "1" ?
                                <EDRTLView style={{ alignItems: 'center', marginHorizontal: 0, marginTop: 7.5 }}>
                                    {/* <Icon name="info" color={EDColors.primary} size={16} /> */}
                                    <EDRTLText
                                        style={[style.defaultText]}
                                        title={strings("default")}
                                    />
                                </EDRTLView>
                                : null}
                        </View>
                    </EDRTLView>
                    {!this.props.isSelectedAddress ?
                        <EDRTLView>
                            <Icon onPress={this.editAddressHandler} name={"edit"} type={"entypo"} color={EDColors.black} size={16} containerStyle={{
                                height: 38, width: 38, borderRadius: 19,
                                marginHorizontal:10,
                                backgroundColor:
                                    this.props.isSelected ?
                                        "#d4d4d4" : EDColors.radioSelected, alignItems: 'center', justifyContent: "center"
                            }} />
                            <Icon onPress={this.deleteAddressHandler} name={"delete"} type={"ant-design"} color={EDColors.black} size={16} containerStyle={{
                                height: 38, width: 38, borderRadius: 19,
                                
                                backgroundColor:
                                    this.props.isSelected ?
                                        "#d4d4d4" : EDColors.radioSelected, alignItems: 'center', justifyContent: "center"
                            }} />
                        </EDRTLView>
                        : null}
                </EDRTLView>


            </TouchableOpacity>
        )
    }

    editAddressHandler = () => {
        this.props.editAddress(this.props.data, 2)
    }

    deleteAddressHandler = () => {
        this.props.deleteAddress(this.props.data.address_id, this.props.data.is_main == "1")
    }

    selectAddressHandler = () => {
        this.props.onPress(this.props.index)
    }
}

export const style = StyleSheet.create({
    currentAddress: {
        alignItems: 'center',
        justifyContent: "space-between",

        // flex: 1
    },
    selected: {
        alignItems: "center",
        backgroundColor: EDColors.radioSelected,
        padding: 5,
        marginTop: 0,
        borderColor: EDColors.primary, borderWidth: 1,
        marginVertical: 0,
        paddingVertical: 15,
    },
    textButtonStyle: { fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(14) },
    footerStyle: { marginHorizontal: 20, marginBottom: 5 },
    default: {
        alignItems: "center",
        backgroundColor: EDColors.white,
        // borderRadius: 16,
        padding: 5,
        marginTop: 0,
        // marginLeft: 25,
        // marginRight: 25,
        borderColor: EDColors.white, borderWidth: 1,
        marginVertical: 0,
        paddingVertical: 15,

        // shadowColor: EDColors.grayNew,
        // shadowOffset: {
        //     width: 0,
        //     height: 4,
        // },
        // shadowOpacity: 0.8,
        // shadowRadius: 2,
        // elevation: 5,
    },
    isAddressList: {
        alignItems: "center",
        backgroundColor: EDColors.white,
        borderRadius: 16,
        padding: 10,
        marginTop: 10,
        marginLeft: 20,
        marginRight: 20,
        borderColor: EDColors.white, borderWidth: 1,
        marginVertical: 15,
        shadowColor: EDColors.grayNew, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2, elevation: 5
    },
    textStyle: {
        fontSize: getProportionalFontSize(14),
        color: EDColors.black,
        fontFamily: EDFonts.medium,
        flex: 1,
        marginHorizontal: 10
    },
    txtStyleLine1: {
        color: EDColors.textAccount,
        fontSize: getProportionalFontSize(13),
        fontFamily: EDFonts.regular,
        flex: 1
    },
    landmark: {
        color: EDColors.black,
        fontSize: getProportionalFontSize(13),
        fontFamily: EDFonts.regular,
        flex: 1,
        marginHorizontal: 40,
        marginVertical: 10
    },
    txtStyleLine2: {
        color: EDColors.text,
        fontSize: getProportionalFontSize(12),
        fontFamily: EDFonts.regular,
        flex: 1,
        marginHorizontal: 40,
        marginVertical: 10
    },
    defaultText: {
        color: EDColors.black,
        fontSize: getProportionalFontSize(13),
        fontFamily: EDFonts.bold,
        flex: 1,
        // marginHorizontal: 5,
    },
    imageStyle: {
        width: widthPercentageToDP("4%"),
        height: widthPercentageToDP("4%")
    },
    mainContainer: {
        flex: 2, padding: 10
    },
    touchableStyle: {
        margin: 5,
        marginTop: 10
    },
    rtlView: { alignItems: 'center', flex: 1, marginTop: 5, },
    currentLocationText: {
        fontSize: getProportionalFontSize(14),
        fontFamily: EDFonts.semiBold,
        color: EDColors.black
    },
    currentLocationSubText: {
        fontSize: getProportionalFontSize(13),
        fontFamily: EDFonts.regular,
        color: EDColors.blackSecondary
    },
})