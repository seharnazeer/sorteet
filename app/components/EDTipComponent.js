
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { TextInput } from 'react-native';
import { FlatList } from 'react-native';
import { Text } from 'react-native';
import { ScrollView } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { strings } from '../locales/i18n';
import { showValidationAlert } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { debugLog, funGetFrench_Curr, getProportionalFontSize, isRTLCheck, validateTwoDecimal } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import metrics from '../utils/metrics';
import EDButton from './EDButton';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';

export default class EDTipComponent extends React.Component {
    tipsArray = [

    ]

    tip = ''
    percentageActualTip = ''
    isCustom = false

    state = {
        customTip: '',
        selectedOption: this.props.paymentOptions !== undefined && this.props.paymentOptions !== null && this.props.paymentOptions.length !== 0 ?
            this.props.paymentOptions[0].payment_gateway_slug
            : '',
    }

    componentWillMount = () => {
        console.log('Payment Option',this.props.paymentOptions)
        if (
            this.props.default_tip_percent_val !== undefined &&
            this.props.default_tip_percent_val !== null &&
            this.props.default_tip_percent_val !== ""
        ) {
            this.tip = this.props.default_tip_percent_val
            this.props.tipArray.map(v => {
                if (this.props.default_tip_percent_val == v.percentage) {
                    this.percentageActualTip = v.value
                }
            })

            this.isCustom = false
            this.tipsArray = this.props.tipArray.map(v => ({ value: v.percentage, selected: this.props.default_tip_percent_val == v.percentage, percentage: v.value }))
            this.setState({ tip: this.props.default_tip_percent_val })
        }


    }

    submitTip = () => {
        if (this.state.selectedOption == "") {
            showValidationAlert(strings("tipPaymentMethodError"))
            return;
        }
        if (this.tip !== undefined && this.tip !== null && this.tip.trim().length !== 0)
            this.props.submitTip(this.tip, this.isCustom, this.percentageActualTip, this.state.selectedOption, this.publishable_key)
    }
    onOptionSelection = (data) => {
        this.setState({ selectedOption: data.payment_gateway_slug })
    }

    createPaymentList = item => {
        let display_name = `display_name_${this.props.lan}`
        return (

                <TouchableOpacity style={[style.subContainer, { flexDirection: isRTLCheck() ? "row-reverse" : "row" }]}
                    onPress={() => this.onOptionSelection(item.item)}>
                    <EDRTLView style={{ alignItems: 'center', flex: 1 }}>
                        <Icon name={
                            item.item.payment_gateway_slug === 'applepay'?"apple-pay":
                            item.item.payment_gateway_slug === 'paypal' ? 'paypal' : item.item.payment_gateway_slug === 'cod' ? 'account-balance-wallet' : 'cc-stripe'} 
                            type={
                                item.item.payment_gateway_slug === 'applepay'?"fontisto":
                                item.item.payment_gateway_slug === 'paypal' ? 'entypo' : item.item.payment_gateway_slug === 'cod' ? 'material' : 'font-awesome'} size={18} color={this.state.selectedOption == item.item.payment_gateway_slug ? EDColors.primary : EDColors.text} style={style.paymentIconStyle} />
                        <EDRTLText style={[style.paymentMethodTitle, { color: this.state.selectedOption == item.item.payment_gateway_slug ? EDColors.black : EDColors.blackSecondary }]} title={
                            item.item[display_name]} />
                    </EDRTLView>
                    <Icon name={"check"} size={getProportionalFontSize(16)} selectionColor={EDColors.primary} color={this.state.selectedOption == item.item.payment_gateway_slug ? EDColors.primary : EDColors.white} style={{ margin: 10 }} />
                </TouchableOpacity>

        )
    }

    render() {
        return (
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
                <TouchableOpacity onPress={this.props.onDismissDriverTip} style={{ flex: 1 }} />
                <View style={{ backgroundColor: EDColors.white, borderRadius: 16, marginBottom: -16, zIndex: 1 }}>
                    <View style={style.lineView}>
                        <View style={style.line}></View>
                    </View>
                    <EDRTLView style={style.rtlView}>
                        <EDRTLText
                            style={style.whatIsYourRating}
                            title={strings('tipMsg')} />
                        <Icon onPress={this.props.onDismissDriverTip} containerStyle={{ marginHorizontal: 5 }} type={'material'} size={getProportionalFontSize(25)} name={'close'} color={EDColors.text} />
                    </EDRTLView>
                </View>
                <View style={{
                    backgroundColor: "#fff",
                    paddingTop: 20,
                    paddingBottom: 10,
                    paddingHorizontal: 5
                }}>

                    {/* Tip Buttons */}
                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} containerStyle={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>

                        {this.tipsArray.map((item, key) => {
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[style.roundButton, { borderWidth: 1, borderColor: item.selected ? EDColors.primary : EDColors.blackSecondary, backgroundColor: EDColors.white, borderRadius: 8 }]}
                                    onPress={() => {
                                        for (let i = 0; i < this.tipsArray.length; i++)
                                            if (i == key)
                                                this.tipsArray[i].selected = true
                                            else
                                                this.tipsArray[i].selected = false
                                        this.isCustom = false
                                        this.percentageActualTip = item.percentage
                                        this.setState({ tip: item.value, customTip: '', noTip: false })
                                    }}>
                                    <Text style={[style.button, { color: item.selected ? EDColors.primary : EDColors.blackSecondary }]}>{item.value + "%"}</Text>
                                </TouchableOpacity>
                            )
                        })}

                    </ScrollView>

                    <EDRTLView style={{ alignItems: 'center', marginHorizontal: 10, marginBottom: 5, width: 150 }}>

                        <EDRTLView style={{ borderBottomWidth: 1, borderColor: "#EDEDED", flex: 1 }}>
                            <Text style={{ textAlignVertical: "center", fontSize: 16 }}>{this.props.currency}</Text>
                            <TextInput style={style.customTipInput}
                                placeholder={strings("customTip")}
                                multiline={false}
                                keyboardType={'number-pad'}
                                selectionColor={EDColors.primary}
                                onChangeText={(value) => {
                                    const newArr1 = this.tipsArray.map(v => ({ ...v, selected: false }))
                                    this.tipsArray = newArr1
                                    const customTip = value.replace(/[- #*;,+<>N()\{\}\[\]\\\/]/gi, "")
                                    if (customTip <= 999) {
                                        if (!validateTwoDecimal(customTip)) {
                                            this.isCustom = true
                                            this.percentageActualTip = ""
                                            this.tip = ''
                                            this.setState({ customTip: customTip, tip: '', noTip: false })
                                        }
                                    }
                                }}
                                value={this.state.customTip} />
                        </EDRTLView>

                    </EDRTLView>
                    {this.props.paymentOptions !== undefined && this.props.paymentOptions !== null && this.props.paymentOptions.length !== 0 ?
                        <EDRTLText title={strings("choosePaymentOption")} style={style.paymentHeader} /> : null}
                    {this.props.paymentOptions !== undefined && this.props.paymentOptions !== null && this.props.paymentOptions.length !== 0 ?

                        <FlatList
                            data={this.props.paymentOptions}
                            extraData={this.state}
                            renderItem={this.createPaymentList}
                        /> : null}
                    <EDRTLView style={[style.roundButton, {
                        width: "100%", marginHorizontal: 10, justifyContent: "space-between",
                        backgroundColor: EDColors.white,
                        paddingHorizontal: 10, alignItems: 'center', alignSelf: 'center'
                    }]}>

                        {/* {this.tip.trim() == "" && this.state.customTip == '' ? null : */}
                        <EDRTLText title={strings("timAmount") + " : " + this.props.currency + funGetFrench_Curr(
                            (this.isCustom ? this.state.customTip : this.percentageActualTip), 1, this.props.lan)}
                            style={{ textAlignVertical: 'center', fontFamily: EDFonts.bold, color: EDColors.black }} />
                        {/* } */}
                        <EDRTLView style={{ alignItems: 'center', justifyContent: "flex-end" }}>
                            <EDButton
                                style={[style.roundButton, { borderColor: EDColors.primary, borderWidth: 1, borderRadius: 8, alignItems: "center", textAlign: "center", padding: 0, margin: 0, marginHorizontal: 10, backgroundColor: "white" }]}
                                onPress={() => {
                                    const newArr1 = this.tipsArray.map(v => ({ ...v, selected: false }))
                                    this.tipsArray = newArr1
                                    this.tip = ''
                                    this.isCustom = false
                                    this.percentageActualTip = ""

                                    this.setState({ noTip: true, tip: '', customTip: '' })
                                    // this.submitTip()
                                }}
                                textStyle={[style.button, { color: EDColors.primary, fontSize: getProportionalFontSize(13), alignSelf: "center", textAlign: "center" }]} label={strings("clearTip")}
                            />
                            <EDButton
                                style={[style.roundButton, { borderRadius: 8, alignItems: "center", textAlign: "center", padding: 0, margin: 0, marginHorizontal: 0 }]}
                                disabled={(Number(this.state.customTip) == 0 || this.state.customTip?.toString().trim() === '') && this.state.tip?.toString().trim() === ''}
                                onPress={() => {
                                    this.tip = this.state.customTip?.trim() != "" && this.state.customTip?.trim() != "" ? this.state.customTip : this.state.tip
                                    this.submitTip()
                                }}
                                textStyle={[style.button, { fontSize: getProportionalFontSize(13), alignSelf: "center", textAlign: "center" }]} label={strings("submitButton")}
                            />

                        </EDRTLView>
                    </EDRTLView>
                </View>
            </View>
        )
    }
}

const style = StyleSheet.create({
    roundButton: {
        margin: 10,
        backgroundColor: EDColors.primary,
        borderRadius: 4
    },
    button: {
        paddingTop: 10,
        paddingRight: 20,
        paddingLeft: 20,
        paddingBottom: 10,
        color: "#fff",
        fontFamily: EDFonts.regular,
    },
    lineView: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: EDColors.white,
        borderRadius: 16,
        marginTop: 10
    },
    line: {
        width: metrics.screenWidth * 0.25,
        height: metrics.screenWidth * 0.01,
        backgroundColor: "#F6F6F6",
        marginVertical: 8
    },
    rtlView: {
        justifyContent: 'space-between', marginVertical: 5,
        marginHorizontal: 5,
        backgroundColor: EDColors.white

    },
    subContainer: {
        flexDirection: "row",
        margin: 10,
        backgroundColor: EDColors.transparentBackground,
        // borderRadius: 6,
        padding: 10,
        // justifyContent: "center",
        marginHorizontal: 0,
        backgroundColor: EDColors.white, borderWidth: 2, borderRadius: 16, borderColor: EDColors.white, shadowColor: EDColors.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2,
    },
    paymentMethodTitle: {
        // flex: 1,
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(13),
        color: "#000",
        marginVertical: 10,
        marginStart: 10
    },
    paymentIconStyle: { marginHorizontal: 0 },
    paymentHeader: {
        fontSize: getProportionalFontSize(15),
        fontFamily: EDFonts.bold,
        color: EDColors.black,
        marginHorizontal: 10,
        marginTop: 20
    },
    whatIsYourRating: { marginHorizontal: 5, color: EDColors.primary, fontSize: getProportionalFontSize(16), fontFamily: EDFonts.bold, textAlign: 'center' },
    customTipInput: { textAlign: "center", textAlignVertical: "center", marginHorizontal: 10, fontSize: getProportionalFontSize(14) },
})