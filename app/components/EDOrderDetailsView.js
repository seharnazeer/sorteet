import LottieView from 'lottie-react-native';
import moment from 'moment';
import React, { Component } from 'react';
import { StyleSheet, TouchableOpacity, View, FlatList } from 'react-native';
import { Icon } from 'react-native-elements';
import StepIndicator from 'react-native-step-indicator';
import { SvgXml } from "react-native-svg";
import Assets from '../assets';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { capiString, debugLog, funGetDateStr, funGetFrench_Curr, getProportionalFontSize, isRTLCheck } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import { curve_down, curve_up, ellipse } from '../utils/EDSvgIcons';
import metrics from '../utils/metrics';
import EDButton from './EDButton';
import EDImage from './EDImage';
import EDPopupView from './EDPopupView';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';
import EDThemeButton from './EDThemeButton';



export default class EDOrderDetailsView extends Component {
    constructor(props) {
        super(props);
        this.itemToIterate = this.props.orderDetails
        this.isForPastOrder = this.props.forPast
        this.labels = [
            strings("orderAccepted"),
            // strings("orderPreparing"),
            this.props.orderDetails.delivery_flag == "pickup" ? strings("orderReady")  : strings("onWay"),
            ( this.props.orderDetails.delivery_flag == "pickup") ? strings("orderComplete") : strings("orderDelivered")];

        this.customStyles = {
            stepIndicatorSize: 40,
            currentStepIndicatorSize: 10,
            separatorStrokeWidth: 1,
            currentStepStrokeWidth: 0,
            stepStrokeCurrentColor: EDColors.strokeColor,
            stepStrokeWidth: 2,
            stepStrokeFinishedColor: EDColors.primary,
            stepStrokeUnFinishedColor: EDColors.transparent,
            separatorFinishedColor: EDColors.strokeColor,
            separatorUnFinishedColor: EDColors.strokeColor,
            separatorCurrentColor: EDColors.strokeColor,
            stepIndicatorFinishedColor: EDColors.primary,
            stepIndicatorUnFinishedColor: EDColors.transparent,
            stepIndicatorCurrentColor: '#ffffff',
            stepIndicatorLabelCurrentColor: EDColors.primary,
            stepIndicatorLabelFinishedColor: '#ffffff',
        }

        this.state = {
            isExpanded: false,
            currentPosition: 0,
            totalWave: 0,
            totalWidth: 0,
            remainingTime: 0,
            detailVisible: false
        }
    }



    getStepIndicatorIconConfig = ({
        position,
        stepStatus,
    }) => {
        const iconConfig = {
            name: 'feed',
            color: stepStatus === 'finished' ? EDColors.white : '#fe7013',
            size: getProportionalFontSize(20),
            type: "material"
        };
        switch (position) {
            case 0: {
                iconConfig.name = 'checklist';
                iconConfig.type = "octicon"
                break;
            }
            // case 1: {
            //     iconConfig.name = 'outdoor-grill';
            //     break;
            // }
            case 1: {
                iconConfig.name = this.props.orderDetails.delivery_flag == "pickup" ? 'shopping-bag'
                     : "delivery-dining";
                break;
            }
            case 2: {
                iconConfig.name = '';
                break;
            }

            default: {
                break;
            }
        }
        return iconConfig;
    };

    componentDidMount = () => {

        this.itemToIterate.price = this.itemToIterate.price.filter(data => { return data.label_key !== undefined })
        if (!this.isForPastOrder && this.itemToIterate.price !== undefined && this.itemToIterate.price !== null && this.itemToIterate.price instanceof Array) {
            this.taxable_fields = this.itemToIterate.price.filter(data => { return data.label_key !== undefined && (data.label_key.toLowerCase().includes("fee") || data.label_key.toLowerCase().includes("tax")) && data.value !== "" && data.value != "0.00" && data.value != 0})
            let taxable_fields = this.taxable_fields
            this.itemToIterate.price = this.itemToIterate.price.filter(function (data) {
                return !taxable_fields.includes(data);
            });
            let total_taxes = 0
            if (taxable_fields.length !== 0) {
                taxable_fields.map(data => {
                    total_taxes = total_taxes + Number(data.value)
                })
            }
            this.itemToIterate.price.splice(
                this.itemToIterate.price.length - 1, 0, {
                label: strings("taxes&Fees"),
                value: total_taxes,
                label_key: "Tax and Fee",
                showToolTip: true
            }
            )
        }

        this.getCurrentPosition()

        if (!this.isForPastOrder &&
            this.itemToIterate.order_status.toLowerCase() === "placed" &&
            (this.itemToIterate.show_cancel_order === "1" || this.itemToIterate.show_cancel_order === 1) &&
            this.itemToIterate.remaining_time > 0

        ) {

            this.setState({
                remainingTime: this.itemToIterate.remaining_time
            })

            let interval = setInterval(
                () => {
                    if (this.state.remainingTime > 0)
                        return this.setState((prevState) => {
                            return { remainingTime: prevState.remainingTime - 1 };
                        });
                    else
                        clearInterval(interval)
                },
                1000
            );
        }
    }


    onLayout = (e) => {
        let totalWave = (e.nativeEvent.layout.width - 60) / 10
        if (totalWave % 2 !== 0)
            totalWave = totalWave + 1
        this.setState({ totalWave: totalWave, totalWidth: e.nativeEvent.layout.width - 60 })
    }



    toggleView = () => {
        this.setState({ isExpanded: !this.state.isExpanded })
    }

    onPressHandler = () => {
        if (this.isForPastOrder) {
            if (this.props.onPress !== undefined)
                this.props.onPress(this.itemToIterate)
        }
        else {
            // this.toggleView()
        }
    }

    renderStepIndicator = (params) => {
        return (
            params.stepStatus === "finished" ?
                <Icon {...this.getStepIndicatorIconConfig(params)} /> :
                <View style={styles.dot} />
        )
    }

    renderLabel = (data) => {
        return (
            <View style={{ alignItems: "center" }}>
                <EDRTLText
                    title={data.label}
                    style={[styles.statusText, {
                        color: data.stepStatus == "unfinished" ? EDColors.blackSecondary : EDColors.primary
                    }]}
                />
                {data.stepStatus !== "unfinished" && data.stepStatus !== "current" ?
                    <EDRTLText
                        title={
                            data.position == 0 ?
                                this.itemToIterate.accept_order_time :
                                // data.position == 1 ?
                                //     this.itemToIterate.preparing :
                                data.position == 1 ?
                                    (this.itemToIterate.ready !== "" ? this.itemToIterate.ready : this.itemToIterate.onGoing) : ""
                        }
                        style={[styles.addonText, { fontSize: getProportionalFontSize(10), marginTop: 2.5 }]}
                    /> : null
                }
            </View>
        )
    }

    getCurrentPosition = () => {
        let status = this.itemToIterate.order_status.toLowerCase()
        let stepStatus = 0

        if (status == "accepted")
            stepStatus = 1
        // else if (status == "preparing")
        //     stepStatus = 2
        else if (status == "ready" || status == "ongoing")
            stepStatus = 2
        else
            stepStatus = 0

        this.setState({ currentPosition: stepStatus })
    }

    renderOrderedItems = () => {
        return (
            this.itemToIterate.items.map(
                (item, index) => {
                    return (
                        <View key={index}>
                            <EDRTLView style={styles.rtlView}>
                                <EDRTLText title={item.name + (Number(item.quantity > 1) ? " (x" + item.quantity + ")" : "")} style={[styles.leftText, { flex: 1 }]} />
                                <EDRTLText title={this.itemToIterate.currency_symbol + funGetFrench_Curr(item.itemTotal, 1, this.props.lan)} style={[styles.leftText, { flex: undefined }]} />
                            </EDRTLView>
                            {item.is_customize == 1 || item.is_customize == "1" ?
                                item.addons_category_list !== undefined && item.addons_category_list !== null ?
                                    item.addons_category_list.map(
                                        category => {
                                            return (
                                                <View>
                                                    {/* <EDRTLText title={category.addons_category + ":"} style={styles.addonTitle} /> */}
                                                    {category.addons_list.map(
                                                        addons => {
                                                            return (
                                                                <EDRTLView style={[styles.rtlView, { marginVertical: 2.5 }]}>
                                                                    <EDRTLText style={[styles.addonText, { flex: 1 }]} title={capiString(addons.add_ons_name) + (Number(item.quantity > 1) ? " (x" + item.quantity + ")" : "")} />
                                                                    < EDRTLText style={[styles.addonText]} title={this.itemToIterate.currency_symbol + funGetFrench_Curr(addons.add_ons_price, item.quantity, this.props.lan)} />
                                                                </EDRTLView>
                                                            )
                                                        }
                                                    )}
                                                </View>)
                                        }
                                    ) : null
                                : null}
                            {item.is_combo_item == 1 && item.combo_item_details != "" && item.combo_item_details != undefined && item.combo_item_details != null ?
                                <EDRTLText title={item.combo_item_details.replaceAll("+ ", "\r\n")} style={styles.addonText} />
                                : null
                            }
                            {item.comment !== undefined &&
                                item.comment !== null &&
                                item.comment.trim().length !== 0 ?
                                <EDRTLText title={"( " + item.comment + " )"} style={[styles.addonText, { maxWidth: "85%" }]} /> : null
                            }
                        </View>
                    )
                }
            )
        )
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
                <View style={styles.modalStyle}>
                    <EDRTLView style={styles.headerContainer}>
                        <EDRTLText title={strings("taxes&Fees")} style={styles.headerText} />
                        <Icon name="close" color={EDColors.primary} size={24} onPress={this.hideTaxBreakdown} />
                    </EDRTLView>
                    <FlatList
                        contentContainerStyle={{ paddingTop: 5 }}
                        data={this.taxable_fields}
                        renderItem={({ item, index }) => {
                            return <EDRTLView style={{ alignItems: 'center', justifyContent: "space-between", marginBottom: 5 }}>
                                <EDRTLText style={styles.modalItemTitle} title={item.label} />
                                <EDRTLText style={styles.modalPrice} title={
                                    this.itemToIterate.currency_symbol + funGetFrench_Curr(item.value, 1, this.itemToIterate.currency_symbol)} />
                            </EDRTLView>
                        }}
                    />

                </View>

            </EDPopupView>
        )
    }



    renderPriceDetails = () => {
        return (
            <FlatList
                scrollEnabled={true}
                data={this.itemToIterate.price.filter(p => p !== "" && p.value !== undefined && p.value !== null && p.value !== 0 && p.value !== "0.00")}
                listKey={(item, index) => "Q" + index.toString()}
                renderItem={({ item, index }) => {
                    return (
                        <EDRTLView style={styles.rtlView}>
                            <EDRTLView style={{ flex: 1, alignItems: 'center' }}>
                                <EDRTLText title={item.label} style={styles.leftText} />
                                {item.showToolTip ?
                                    <Icon name="infocirlce" type="ant-design" size={16} onPress={this.showTaxBreakdown} containerStyle={{ marginHorizontal: 5 }} />
                                    : null
                                }
                            </EDRTLView>

                            <EDRTLText title={
                                isRTLCheck() ?
                                    (item.label_key.includes("Tip") || item.label_key.includes("Fee") || item.label_key.includes("Delivery") || item.label_key.includes("Credit") || item.label_key.includes("Service")) ? item.value !== undefined && item.value != null && item.value.toString() !== undefined && item.value.toString() !== null ? item.value.toString().includes("%") ? item.value + " +" : this.itemToIterate.currency_symbol + funGetFrench_Curr(item.value, 1, this.props.lan) + " +" : ''
                                        : (item.label_key.includes("Coupon") || item.label_key.includes("Discount") || item.label_key.includes("Used Earning Points") ? this.itemToIterate.currency_symbol + funGetFrench_Curr(item.value, 1, this.props.lan) + " -" : this.itemToIterate.currency_symbol + funGetFrench_Curr(item.value, 1, this.props.lan))
                                    :
                                    (item.label_key.includes("Tip") || item.label_key.includes("Fee") || item.label_key.includes("Delivery") || item.label_key.includes("Credit") || item.label_key.includes("Service")) ? item.value !== undefined && item.value != null && item.value.toString() !== undefined && item.value.toString() !== null ? item.value.toString().includes("%") ? "+ " + item.value : "+ " + this.itemToIterate.currency_symbol + funGetFrench_Curr(item.value, 1, this.props.lan) : ''
                                        : (item.label_key.includes("Coupon") || item.label_key.includes("Discount") || item.label_key.includes("Used Earning Points") ? "- " + this.itemToIterate.currency_symbol + funGetFrench_Curr(item.value, 1, this.props.lan) : this.itemToIterate.currency_symbol + funGetFrench_Curr(item.value, 1, this.props.lan))

                            } style={[styles.leftText, { flex: undefined }]} />
                        </EDRTLView>
                    )
                }}
                keyExtractor={(item, index) => item + index}
                showsVerticalScrollIndicator={false}
            />
        )
    }

    renderOrderDetails = () => {
        return (
            <View style={styles.orderDetailView} onLayout={this.onLayout}>

                {/* RES NAME */}
                <EDRTLView style={styles.resView}>
                    <EDRTLText title={strings("resName")} style={[styles.resLeftText, {
                        textAlign: isRTLCheck() ? 'right' : 'left'
                    }]} />
                    <EDRTLText title={this.itemToIterate.restaurant_name} style={[styles.resRightText, {
                        textAlign: isRTLCheck() ? 'left' : 'right'

                    }]} />
                </EDRTLView>

                {/* ORDER TYPE */}
                <EDRTLView style={styles.rtlView}>
                    <EDRTLText title={strings("orderType")} style={styles.leftText} />
                    <EDRTLText title={ this.itemToIterate.delivery_flag.toLowerCase() == 'delivery' ? strings('deliveryOrder') : strings('pickUpOrder')} style={styles.rightText} />
                </EDRTLView>

                {/* DELIVERY METHOD */}
                {/* {this.itemToIterate.delivery_flag.toLowerCase() == 'delivery' &&
                    this.itemToIterate.delivery_method !== undefined &&
                    this.itemToIterate.delivery_method !== null &&
                    this.itemToIterate.delivery_method.trim().length !== 0
                    ?
                    <EDRTLView style={styles.rtlView}>
                        <EDRTLText title={strings("deliveryMethod")} style={styles.leftText} />
                        <EDRTLText title={capiString(this.itemToIterate.delivery_method)} style={styles.rightText} />
                    </EDRTLView> : null} */}

              

                {/* PAYMENT MODE */}
                {this.itemToIterate.payment_option !== undefined && this.itemToIterate.payment_option !== null && this.itemToIterate.payment_option !== '' ?
                    <EDRTLView style={styles.rtlView}>
                        <EDRTLText title={strings("paymenMethod")} style={styles.leftText} />
                        <EDRTLText title={this.itemToIterate.payment_option} style={styles.rightText} />
                    </EDRTLView> : null}

                {/* REFUND STATUS  */}
                {this.itemToIterate.refund_status !== undefined && this.itemToIterate.refund_status !== null && this.itemToIterate.refund_status !== "" ?
                    <EDRTLView style={styles.rtlView}>
                        <EDRTLText title={strings("refundStatus")} style={styles.leftText} />
                        <EDRTLText title={this.itemToIterate.refund_status !== undefined && this.itemToIterate.refund_status !== null ?
                            capiString(this.itemToIterate.refund_status) : ""
                        } style={styles.rightText} />
                    </EDRTLView> : null}

                {/* DRIVER TIP STATUS */}
                {this.itemToIterate.tips_refund_status !== undefined && this.itemToIterate.tips_refund_status !== null && this.itemToIterate.tips_refund_status !== "" ?
                    <EDRTLView style={styles.rtlView}>
                        <EDRTLText title={strings("tipRefundStatus")} style={styles.leftText} />
                        <EDRTLText title={this.itemToIterate.tips_refund_status !== undefined && this.itemToIterate.tips_refund_status !== null ?
                            capiString(this.itemToIterate.tips_refund_status) : ""
                        } style={styles.rightText} />
                    </EDRTLView> : null}


                <View style={styles.separatorStyle} />

                {/* ORDERED ITEMS  */}
                {this.itemToIterate.items.length > 0 ? <>
                    {this.renderOrderedItems()}
                    <View style={styles.separatorStyle} />
                </> : null}

                {/* PRICE DETAILS */}

                {this.renderPriceDetails()}
                {this.itemToIterate.extra_comment !== undefined &&
                    this.itemToIterate.extra_comment !== null &&
                    this.itemToIterate.extra_comment !== ""
                    ? <>
                        <View style={styles.separatorStyle} />
                        <EDRTLText
                            style={styles.rightText}
                            title={strings("orderComment") + ': ' + this.itemToIterate.extra_comment}
                        />
                    </> : null}
                {this.itemToIterate.delivery_instructions !== undefined &&
                    this.itemToIterate.delivery_instructions !== null &&
                    this.itemToIterate.delivery_instructions !== ""
                    ? <>
                        <View style={styles.separatorStyle} />
                        <EDRTLText
                            style={styles.rightText}
                            title={strings("deliveryInstruction") + ' : ' + this.itemToIterate.delivery_instructions}
                        />
                    </> : null}
            </View>
        )
    }

    trackOrder = () => {
        if (this.props.onTrackOrder !== undefined)
            this.props.onTrackOrder(this.itemToIterate, this.taxable_fields)
    }

    cancelOrder = () => {
        if (this.props.cancelOrder !== undefined)
            this.props.cancelOrder(this.itemToIterate)
    }

    navigateToRestaurant = () => {
        this.props.navigateToRestaurant(
            this.itemToIterate.restaurant_id,
            this.itemToIterate.restaurant_content_id
        )
    }

    render() {

        var wave = []
        let i = 0
        while (i < this.state.totalWave) {
            wave.push(
                <View style={{ marginHorizontal: 3, height: 20, width: 10, borderRadius: 10, backgroundColor: EDColors.white }} />
            )
            i++;
        }
        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={this.onPressHandler}
            >
                {this.renderDetailModal()}
                <View style={styles.mainContainer}>
                    <EDRTLView style={{
                        alignItems: 'center',
                        justifyContent: "space-between",
                        flex: 1
                    }}>

                        <EDRTLView style={{ flex: 1, alignItems: 'center' }} >
                            <TouchableOpacity onPress={this.navigateToRestaurant}>
                                <EDImage source={this.itemToIterate.restaurant_image} style={styles.resImage} />
                            </TouchableOpacity>
                            <View style={{ flex: 1, marginHorizontal: 10 }} >
                                <EDRTLText style={styles.itemsTitle}
                                    title={(this.itemToIterate.items != undefined && this.itemToIterate.items.length > 0
                                        ? this.itemToIterate.items.length
                                        : 0) + " " + (this.itemToIterate.items.length > 1 ? strings("itemsOrdered") : strings("itemOrdered"))}
                                />
                                <TouchableOpacity onPress={this.navigateToRestaurant}>
                                    <EDRTLView style={[styles.dateView, { marginTop: 5, marginBottom: 0 ,}]}>
                                        <Icon name="restaurant" color={EDColors.primary} size={getProportionalFontSize(14)} containerStyle={{ marginHorizontal: 1.5 }} />
                                        <EDRTLText style={styles.resTitle}
                                            title={this.itemToIterate.restaurant_name}
                                        />
                                    </EDRTLView>
                                </TouchableOpacity>
                                {/* <EDRTLView style={[styles.dateView,{marginTop: 5, marginBottom: 0}]}>
                                <Icon name="restaurant"  color={EDColors.blackSecondary} size={getProportionalFontSize(14)} containerStyle={{marginLeft : 2.5,marginRight :4}} />
                                <EDRTLText style={[styles.orderDateText]}
                                    title={this.itemToIterate.restaurant_name} />
                            </EDRTLView> */}
                                <EDRTLView style={[styles.dateView,{ alignItems:"flex-start"}]}>
                                    <Icon name="calendar" type="evilicon" color={EDColors.blackSecondary} size={getProportionalFontSize(18)} />
                                    <EDRTLText style={styles.orderDateText}
                                        title={funGetDateStr(this.itemToIterate.order_date, "MMMM D, YYYY, hh:mm A")} />
                                </EDRTLView>
                                {this.itemToIterate.refund_status !== undefined && this.itemToIterate.refund_status !== null && this.itemToIterate.refund_status !== "" ?
                                    <EDRTLView style={[styles.dateView, { marginTop: -  getProportionalFontSize(5), marginBottom: 0 }]}>
                                        {/* <Icon name="attach-money" color={EDColors.blackSecondary} size={getProportionalFontSize(17)} /> */}
                                        <Icon name="cash-refund" type="material-community" color={EDColors.blackSecondary} size={getProportionalFontSize(17)} />

                                        <EDRTLText style={[styles.orderDateText, { fontFamily: EDFonts.medium, marginHorizontal: 2.5, marginTop: getProportionalFontSize(5) }]}
                                            title={capiString(this.itemToIterate.refund_status)}
                                        />
                                    </EDRTLView>

                                    : null
                                }
                            </View>
                        </EDRTLView>
                        {/* {!this.isForPastOrder ? */}
                        <View style={{
                            height: "100%",
                            alignSelf: "flex-start",
                            alignItems: "flex-end",
                            justifyContent: "space-between"
                        }}>
                            {this.itemToIterate.order_status.toLowerCase() === "cancel" ||
                                this.itemToIterate.order_status.toLowerCase() === "rejected"
                                ?
                                <EDRTLText style={[styles.cancelledText]}
                                    title={this.itemToIterate.order_status_display}
                                /> : null
                            }

                            <EDRTLText style={[styles.itemsTitle, {
                                fontSize: getProportionalFontSize(17),
                                marginHorizontal: 10,
                                textAlignVertical: "center",
                                flex: 1
                            }]}
                                title={this.itemToIterate.currency_symbol + funGetFrench_Curr(this.itemToIterate.total, 1, this.props.lan)}
                            />

                            {this.itemToIterate.order_status.toLowerCase() === "cancel" ||
                                this.itemToIterate.order_status.toLowerCase() === "rejected"

                                ?
                                <EDRTLText style={[styles.cancelledText]}
                                    title={``}
                                /> : null
                            }
                        </View>
                        {/* :

                            <EDRTLText style={[styles.itemsTitle, {
                                alignSelf: "flex-start",
                            }]}
                                title={"(#" + this.itemToIterate.order_id + ")"}
                            />} */}
                    </EDRTLView>
                    {
                        !this.isForPastOrder &&
                            this.itemToIterate.scheduled_date !== undefined &&
                            this.itemToIterate.scheduled_date !== null &&
                            this.itemToIterate.scheduled_date !== ""
                            ?
                            <>
                                <EDRTLView style={styles.scheduled}>
                                    <Icon name="schedule" size={18} color={EDColors.primary} />
                                    <EDRTLText
                                        title={strings("orderScheduled") + " " +
                                            moment(this.itemToIterate.scheduled_date, "YYYY-MM-DD").format("MMMM D, YYYY") + ", " +
                                            this.itemToIterate.slot_open_time + " - " + this.itemToIterate.slot_close_time
                                        } style={[styles.schedulingText]} />
                                </EDRTLView>
                            </> : null}
                    {!this.isForPastOrder ?
                        <View style={styles.statusView}>

                            {this.itemToIterate.order_status.toLowerCase() === "placed" ?
                                <>
                                    <EDRTLView style={styles.waiting}>
                                        {/* <EDRTLView style={styles.waitingSubView}> */}
                                        <EDRTLText
                                            title={strings("waitingForRestaurant")} style={styles.waitingText} />
                                        <LottieView
                                            source={require('../assets/57513-glass-hour.json')}
                                            style={{ height: 20, width: 20 }}
                                            autoPlay
                                            loop
                                            speed={.5} />

                                    </EDRTLView>
                                </> : null}
                            {this.itemToIterate.delivery_flag.toLowerCase() == 'delivery' &&
                                this.itemToIterate.delivery_method == "relay" ?
                                <>
                                    <EDRTLView style={styles.waiting}>
                                        <EDRTLText
                                            title={strings("relayTrackMessage")} style={[styles.waitingText]} />
                                    </EDRTLView>
                                </> : null}
                            <StepIndicator
                                customStyles={this.customStyles}
                                currentPosition={this.state.currentPosition}
                                labels={this.labels}
                                renderStepIndicator={this.renderStepIndicator}
                                renderLabel={this.renderLabel}
                                stepCount={3}
                            />

                            <TouchableOpacity activeOpacity={1}
                                onPress={this.toggleView}>
                                <EDRTLView style={[styles.expandButton, {
                                    backgroundColor: this.state.isExpanded ? EDColors.primary : EDColors.white,
                                    borderColor: this.state.isExpanded ? EDColors.primary : EDColors.separatorColorNew,
                                }]}>
                                    <EDRTLText
                                        title={strings("orderDetails") + " (#" + this.itemToIterate.order_id + ")"} style={[styles.itemsTitle, { color: this.state.isExpanded ? EDColors.white : EDColors.black }]} />
                                    <Icon name={this.state.isExpanded ? "expand-less" : "expand-more"} color={this.state.isExpanded ? EDColors.white : EDColors.blackSecondary} size={getProportionalFontSize(23)} />
                                </EDRTLView>

                            </TouchableOpacity>

                            {this.state.isExpanded ?
                                <View style={styles.expandedView} >
                                    <EDRTLView style={styles.waveContainer}>
                                        {wave}
                                    </EDRTLView>
                                    {this.renderOrderDetails()}
                                    <EDRTLView style={[styles.waveContainer, { marginTop: -10, marginBottom: 10 }]}>
                                        {wave}
                                    </EDRTLView>
                                </View> : null}
                            {
                                (this.itemToIterate.third_party_tracking_url !== undefined &&
                                    this.itemToIterate.third_party_tracking_url !== null &&
                                    this.itemToIterate.third_party_tracking_url.trim().length !== 0) ||
                                    (this.itemToIterate.delivery_flag === "delivery" && this.itemToIterate.onGoing !== "") ?
                                    <EDButton
                                        activeOpacity={1}
                                        icon={'route'}
                                        iconType={"font-awesome-5"}
                                        style={[styles.trackButton]}
                                        iconColor={EDColors.black}
                                        iconSize={16}
                                        label={strings("trackOrder")}
                                        textStyle={[styles.itemsTitle, { marginHorizontal: 5 }]}
                                        onPress={this.trackOrder}
                                    /> : null}



                            {!this.isForPastOrder && this.itemToIterate.order_status.toLowerCase() === "placed" && this.itemToIterate.show_cancel_order == "1" && this.state.remainingTime !== 0 ?
                                <EDRTLView style={styles.cancelOrderView}>
                                    <EDRTLView style={{
                                        alignItems: "center",
                                        flex: 1
                                    }}>
                                        <LottieView
                                            source={require('../assets/61508-waiting.json')}
                                            style={{ height: 30, width: 30 }}
                                            autoPlay
                                            loop
                                            colorFilters={[{
                                                keypath: "A/loadervitay copy Outlines",
                                                color: EDColors.primary
                                            },
                                            {
                                                keypath: "Layer 2/loadervitay copy Outlines",
                                                color: EDColors.primary
                                            },
                                            {
                                                keypath: "manecilla/loadervitay copy Outlines",
                                                color: EDColors.primary
                                            }]}

                                            speed={2} />
                                        <EDRTLText title={strings("cancelOrderText") + this.state.remainingTime + " " + (this.state.remainingTime == 1 ? strings("second") : strings("seconds"))} style={styles.cancelOrderText} />

                                    </EDRTLView>
                                    <EDButton label={strings("cancelOrder")}
                                        style={styles.cancelButton}
                                        textStyle={styles.cancelText}
                                        onPress={this.cancelOrder}
                                    />
                                </EDRTLView>

                                : null}

                        </View> : null}

                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: EDColors.white,
        margin: 10,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,

        elevation: 1,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 5
    },
    itemsTitle: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(16),
        color: EDColors.black
    },
    resTitle: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(14),
        color: EDColors.primary,
    },
    dateView: {
        alignItems: 'center',
        marginVertical: 5
    },
    orderDateText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(13),
        color: EDColors.blackSecondary
    },
    statusView: {
        borderTopColor: EDColors.offWhite,
        borderTopWidth: 1,
        width: metrics.screenWidth,
        marginTop: 10,
        paddingTop: 20,
        flex: 1,
        alignSelf: "center"
    },
    statusText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(12),
        marginTop: 15
    },
    dot: {
        height: 10,
        width: 10,
        borderRadius: 5,
        backgroundColor: EDColors.strokeColor
    },
    waiting: {
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 20,
        marginTop: -10,
        justifyContent: "center",
        flex: 1
    },
    scheduled: {
        alignItems: 'center',
        flex: 1,
        marginTop: 10
    },
    waitingSubView: {
        alignItems: 'center',
        flex: 1
    },
    waitingText: {
        marginHorizontal: 5,
        color: EDColors.black,
        textAlign: "center",
        flex: 1
    },
    cancelledText: {
        fontSize: getProportionalFontSize(13),
        fontFamily: EDFonts.medium,
        color: EDColors.error,
        marginHorizontal: 10,
    },
    schedulingText: {
        marginHorizontal: 5,
        color: EDColors.black,
        flex: 1,
        fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(13)
    },
    expandButton: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 5,
        backgroundColor: EDColors.primary,
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: "space-between",
        borderWidth: 1,

    },
    expandedView: {
        marginTop: 0
    },
    orderDetailView: {
        marginHorizontal: 30,
        padding: 15,
        backgroundColor: EDColors.offWhite
    },
    rtlView: {
        justifyContent: 'space-between',
        marginVertical: 5,

    },
    leftText: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(14),
        color: EDColors.black,

    },
    rightText: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(12),
        color: EDColors.blackSecondary,
    },
    resView: {
        justifyContent: 'space-between',
        marginVertical: 5,
        flex: 1,
        alignItems: 'center'
    },
    resLeftText: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(14),
        color: EDColors.black,
        flex: 1,

    },
    resRightText: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(13),
        color: EDColors.blackSecondary,
        flex: 1,
    },
    separatorStyle: {
        height: 1.5,
        backgroundColor: EDColors.separatorColorNew,
        width: "100%",
        marginVertical: 5
    },
    addonTitle: {
        fontSize: getProportionalFontSize(12),
        color: EDColors.black,
        textDecorationLine: "underline"
    },
    addonText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(13),
        color: EDColors.blackSecondary,
    },
    trackButton: {
        marginHorizontal: 20,
        backgroundColor: EDColors.separatorColorNew,
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 15,
        marginTop: 5
    },
    waveContainer: {
        zIndex: 1,
        marginBottom: -10,
        overflow: "hidden",
        marginHorizontal: 30,

        borderRightColor: EDColors.offWhite,
        borderLeftColor: EDColors.offWhite,

    },
    cancelOrderText: {
        flex: 1,
        fontFamily: EDFonts.regular,
        color: EDColors.black,
        fontSize: getProportionalFontSize(13)
    },
    cancelText: {
        fontFamily: EDFonts.medium,
        color: EDColors.white,
        fontSize: getProportionalFontSize(12)
    },
    cancelButton: {
        backgroundColor: EDColors.error,
        padding: 5,
        paddingHorizontal: 10,
        marginHorizontal: 0
    },
    cancelOrderView: {
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 20,
        marginTop: 10
    },
    resImage: {
        height: 70,
        width: 70,
        borderRadius: 10
    },
    modalItemTitle: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(13),
        color: EDColors.black,
        flex: 1
    },
    modalPrice: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(13),
        color: EDColors.black,
    },
    headerText: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(16),
        color: EDColors.primary,
    },
    modalStyle: { backgroundColor: EDColors.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16, margin: 10 },
    headerContainer: { justifyContent: "space-between", alignItems: 'center', borderBottomWidth: 1, borderBottomColor: EDColors.separatorColorNew, paddingBottom: 5 }

})