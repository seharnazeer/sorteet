
import moment from 'moment';
import { Spinner } from 'native-base';
import React from "react";
import { TextInput } from 'react-native';
import { Platform } from 'react-native';
import { BackHandler, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements";
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import SeeMore from 'react-native-see-more-inline';
import { SvgXml } from 'react-native-svg';
import WebView from 'react-native-webview';
import { NavigationActions, NavigationEvents, StackActions } from "react-navigation";
import { connect } from "react-redux";
import CartItem from "../components/CartItem";
import EDButton from '../components/EDButton';
import EDCategoryOrder from "../components/EDCategoryOrder";
import { EDCookingInfo } from '../components/EDCookingInfo';
import EDImage from "../components/EDImage";
import EDItemDetails from "../components/EDItemDetails";
import EDPlaceholderComponent from "../components/EDPlaceholderComponent";
import EDPopupView from "../components/EDPopupView";
import EDRTLText from "../components/EDRTLText";
import EDRTLView from "../components/EDRTLView";
import EDThemeButton from '../components/EDThemeButton';
import PriceDetail from "../components/PriceDetail";
import ProductComponent from '../components/ProductComponent';
import { strings } from "../locales/i18n";
import { saveCartCount, saveCartPrice, saveCheckoutDetails, saveIsCheckoutScreen } from "../redux/actions/Checkout";
import { clearCartData, clearCurrency_Symbol, getCartList, saveCartData } from "../utils/AsyncStorageHelper";
import { showDialogue, showNoInternetAlert, showPaymentDialogue, showProceedDialogue, showValidationAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import { validateTwoDecimal, capiString, COUPON_ERROR, debugLog, funGetFrench_Curr, getProportionalFontSize, isRTLCheck, RESPONSE_SUCCESS, RESTAURANT_ERROR, RETURN_URL } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import { discount_icon } from '../utils/EDSvgIcons';
import metrics from "../utils/metrics";
import { netStatus } from "../utils/NetworkStatusConnection";
import { addOrder, addToCart, checkCardPayment, createPaymentMethod } from "../utils/ServiceManager";
import BaseContainer from "./BaseContainer";
import * as RNLocalize from "react-native-localize";
import { Paystack, paystackProps } from 'react-native-paystack-webview';

export class CheckOutContainer extends React.PureComponent {
    //#region LIFE CYCLE METHODS

    constructor(props) {
        super(props);
        this.isRefresh = false
        this.cartData = [];
        this.deleteIndex = -1;
        this.cart_id = 0;
        this.cartResponse = undefined;
        this.delivery_charges = ""
        this.promoCode = ""
        this.promoArray = []
        this.resId = ""
        this.resName = ""
        this.minimum_subtotal = ""
        this.featured_items = undefined
        this.unpaid_orders_status = true
        this.featured_items_image = []
        this.selectedItem = ""
        this.comment = ""
        this.placeOrderFromCheckout = false
        this.cartTotal = ''
        this.count = 0
        this.payment_option = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.payment_option !== undefined ?
            this.props.navigation.state.params.payment_option : "cod"

        this.selectedCard = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.selectedCard !== undefined ?
            this.props.navigation.state.params.selectedCard : undefined

        this.cardData = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.cardData !== undefined ?
            this.props.navigation.state.params.cardData : undefined

        this.isDefaultCard = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDefaultCard !== undefined ?
            this.props.navigation.state.params.isDefaultCard : false

        this.isCardSave = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isCardSave !== undefined ?
            this.props.navigation.state.params.isCardSave : false

        this.countryCode = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.countryCode !== undefined ?
            this.props.navigation.state.params.countryCode : ""


        this.publishable_key = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.publishable_key !== undefined ?
            this.props.navigation.state.params.publishable_key : ""

        this.secret_key = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.secret_key !== undefined ?
            this.props.navigation.state.params.secret_key : ""

         console.log('pub',this.publishable_key)
         console.log('sec',this.secret_key)
         console.log('payOp',this.payment_option)

        this.tipsArray = []
        this.tip = ''
        this.forCartFetch = false
        this.isCustom = false
        this.isPreOrder = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isPreOrder !== undefined ?
            this.props.navigation.state.params.isPreOrder : false

        this.allowPreOrder = this.props.navigation.state.params !== undefined && this.props.navigation.state.params.allowPreOrder !== undefined ?
            this.props.navigation.state.params.allowPreOrder : false
        this.taxable_fields = []

        this.paystackMethod = this.props.navigation.state.params.paystackMethod
        // this.email = this.props.navigation.state.params.email
        this.email = this.props.email;
        //console.log('selectedCard',this.email);
        this.paystackWebViewRef = React.createRef(paystackProps.PayStackRef);

        this.state = {
            cardDetails: null,
        };
    }

    state = {
        key: 1,
        isLoading: false,
        isAsyncSync: false,
        value: 0,
        walletApplied: false,
        visible: false,
        isCategory: false,
        isParcel: false,
        tip: "",
        customTip: "",
        noTip: true,
        tipView: false,
        showInfoModal: false,
        descriptionVisible: true,
        url: undefined
    };


    handleCardDetails = (cardDetails) => {
        this.setState({ cardDetails });
        console.log('cardDetails', cardDetails);
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
        if (this.props.navigation.state.params?.delivery_status !== 'PickUp' &&
            this.props.navigation.state.params?.default_tip_percent_val !== undefined &&
            this.props.navigation.state.params?.default_tip_percent_val !== null &&
            this.props.navigation.state.params?.default_tip_percent_val !== ""
        ) {
            this.tip = this.props.navigation.state.params?.default_tip_percent_val
            this.isCustom = false
            //to enable tip view set tipview=true
            this.setState({ tipView: false, tip: this.props.navigation.state.params?.default_tip_percent_val, noTip: false })

        }
        this.getcartDataList()

    }
    componentWillUnmount() {
        this.backHandler.remove()
    }

    onDidFocus = () => {
        debugLog("IS REFRESH :::::", this.isRefresh)
        if (this.isRefresh)
            this.getcartDataList()
    }



    /**
  * Toggle wallet
  */
    toggleWallet = () => {
        if (!this.state.walletApplied) {
            if (parseInt(this.max_used_QR) > parseInt(this.wallet_money)) {
                showValidationAlert(strings("minimum") + this.props.currency + this.max_used_QR + " " + strings("walletRedeemError"));
            } else if (parseInt(this.minimum_subtotal) > parseInt(this.subTotal)) {
                showValidationAlert(strings("minSubtotalError") + this.props.currency + this.minimum_subtotal);
            } else {
                this.getcartDataList();
                this.setState({ walletApplied: true });
            }
        } else {
            this.getcartDataList();
            this.setState({ walletApplied: false });
        }
    }

    toggleTip = () => {
        if (this.state.tipView) {
            const newArr1 = this.tipsArray.map(v => ({ ...v, selected: false }))
            this.tipsArray = newArr1
            this.setState({ noTip: true, tip: '', customTip: '', tipView: false })
            this.tip = ''
            this.isCustom = false
            this.getcartDataList()

        }
        else {
            if (this.props.navigation.state.params?.delivery_status !== 'PickUp' &&
                this.props.navigation.state.params?.default_tip_percent_val !== undefined &&
                this.props.navigation.state.params?.default_tip_percent_val !== null &&
                this.props.navigation.state.params?.default_tip_percent_val !== ""
            ) {
                this.tip = this.props.navigation.state.params?.default_tip_percent_val
                this.isCustom = false
                const newArr1 = this.tipsArray.map(v => ({ ...v, selected: this.props.navigation.state.params?.default_tip_percent_val == v.value ? true : false }))
                this.tipsArray = newArr1
                this.setState({ tipView: false, tip: this.props.navigation.state.params?.default_tip_percent_val, noTip: false })
            }
            this.getcartDataList()

        }
    }


    showCookingInfo = (index) => {
        this.selectedIndex = index
        this.comment = this.cartResponse.items[index].comment
        this.setState({ showInfoModal: true })
    };

    removeCookingInfo = (index) => {
        var array = this.cartResponse;
        array.items[index].comment = ""
        this.getCartData(array.items);
    };

    hideCookingInfo = () => {
        this.selectedIndex = -1
        this.setState({ showInfoModal: false })
    }

    renderCookingInfo = () => {
        return (
            <EDPopupView
                isModalVisible={this.state.showInfoModal}
                shouldDismissModalOnBackButton
                onRequestClose={this.hideCookingInfo}
            >
                <EDCookingInfo
                    hideCookingInfo={this.hideCookingInfo}
                    saveComment={this.saveInstruction}
                    comment={this.comment}
                />
            </EDPopupView>
        )
    }

    saveInstruction = (instruction) => {
        var array = this.cartResponse;
        if (instruction !== undefined &&
            instruction !== null &&
            instruction.trim().length !== 0
        ) {
            array.items[this.selectedIndex].comment = instruction
            this.getCartData(array.items);
        }
        this.hideCookingInfo()
    }

    navigateToRestaurant = () => {
        this.isRefresh = true
        this.props.navigation.push("RestaurantContainer", {
            restId: this.resId,
            content_id: this.content_id
        })
    }

    toggleDescription = () => {
        this.setState({ descriptionVisible: !this.state.descriptionVisible })
    }

    /**
 * Webview Navigation change
 */
    navigationChange = (resp) => {
        // debugLog("NAVIGATION CHANGE CALLED :::::::::::", resp)
        if (resp.url.includes(RETURN_URL + "/?payment_intent")) {
            this.setState({ url: undefined })
            this.checkCardPayment()
        }
    }

    checkCardPayment = () => {
        netStatus(
            status => {
                if (status) {
                    this.setState({ isLoading: true })
                    var params = {
                        trans_id: this.txn_id,
                        language_slug: this.props.lan
                    }
                    checkCardPayment(params, this.onCheckCardPaymentSuccess, this.onCheckCardPaymentFailure, this.props)
                }
                else {
                    showNoInternetAlert();
                    this.setState({ isLoading: false })
                }
            }
        )
    }

    /**
    * On check card payment success
    */
    onCheckCardPaymentSuccess = (onSuccess) => {
        if (onSuccess.status == RESPONSE_SUCCESS) {
            if (onSuccess.stripe_response.error !== undefined && onSuccess.stripe_response.error.message !== undefined) {
                showValidationAlert(strings("paymentFail") + "\n\n" + onSuccess.stripe_response.error.message)
                this.setState({ isLoading: false })

            }
            else if (onSuccess.stripe_response.status == "succeeded") {
                debugLog("Payment Sucessful with 3d secure authentication ::::::")
                this.setState({ isLoading: true, })
                this.txn_id = onSuccess.stripe_response.id;

                this.placeOrder(onSuccess.stripe_response.id, "stripe")
            }
            else {
                debugLog("PAYMENT FAILED ::::")
                showValidationAlert(strings("paymentFail"));
                this.setState({ isLoading: false })
            }
        } else {
            this.setState({ isLoading: false })
            showValidationAlert(strings("paymentFail"));
        }
    }
    /**
     * On check card payment failure
     */
    onCheckCardPaymentFailure = (onFailure) => {
        debugLog("FAILURE :::::", onFailure)
        showValidationAlert((strings("paymentFail") + "\n\n" + (onSuccess.stripe_response.error !== undefined ? onSuccess.stripe_response.error.message : "")));
        this.setState({ isLoading: false })
    }
    onWebViewCloseHandler = () => {
        showPaymentDialogue(
            strings('cancelConfirm'),
            [{
                text: strings('dialogYes'), onPress: () => {
                    this.setState({ url: undefined })
                }
            },
            { text: strings('dialogNo'), onPress: () => { }, isNotPreferred: true }],
            strings('warning'),
        );

    }

    render3DVerificationModal = () => {
        return (
            <EDPopupView isModalVisible={this.state.url !== undefined}
                shouldDismissModalOnBackButton
                onRequestClose={this.onWebViewCloseHandler}>
                <View style={{ margin: 20, marginVertical: 80, borderRadius: 16, flex: 1, overflow: "hidden", backgroundColor: EDColors.white }}>
                    <WebView
                        onLoad={() => this.setState({ isLoading: false })}
                        // onLoadStart={() => this.setState({ isLoading: false })}
                        style={{ width: "100%", height: "100%", borderRadius: 16, }}
                        source={{ uri: this.state.url }}
                        javaScriptEnabled={true}
                        startInLoadingState
                        renderLoading={() => { return <Spinner size="small" color={EDColors.primary} /> }}
                        allowsBackForwardNavigationGestures={true}
                        onNavigationStateChange={this.navigationChange}
                    />
                </View>
            </EDPopupView>
        )
    }


    // RENDER METHOD
    render() {
        if ((this.state.tip == 0 || this.state.tip == '' || this.state.tip == undefined) && (this.state.customTip == 0 || this.state.customTip == '' || this.state.customTip == undefined)) { this.setState({ noTip: true }) }
        return (
            <BaseContainer
                // title={strings("doCheckout")}
                title={this.resName || ""}

                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={this.onLeftPressEvent}
                loading={this.state.isLoading}
            >

                <NavigationEvents onDidFocus={this.onDidFocus} />

                {this.render3DVerificationModal()}

                {/* comment below method due to un necessary modal opens */}

                {/* CATEGORY MODAL */}
                {/* {this.renderCategoryOrder()} */}

                {/* {this.renderCookingInfo()} */}

                {/* ITEM DETAILS */}
                {/* {this.renderItemDetails()} */}

                {/* MAIN VIEW */}
                {this.cartResponse != undefined && this.cartResponse.items.length > 0 ?
                    <View style={{ flex: 1, paddingBottom: 5, backgroundColor: EDColors.radioSelected, marginHorizontal: 10 }}>

                        <ScrollView contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: 'space-between'
                        }}
                            showsVerticalScrollIndicator={false}
                        >

                            {/* DISPLAY CART CARD LIST */}
                            <FlatList

                                data={this.cartResponse != undefined ? this.cartResponse.items : []}
                                showsVerticalScrollIndicator={false}
                                style={{ marginVertical: 10 }}
                                keyExtractor={(item, index) => item + index}
                                ListFooterComponent={() => { return <EDRTLText title={strings("addMore")} style={style.addMoreText} onPress={this.navigateToRestaurant} /> }}
                                renderItem={({ item, index }) => {
                                    return (
                                        <CartItem
                                            key={this.state.key}
                                            index={index}
                                            items={item}
                                            currency={this.props.currency}
                                            price={
                                                item.offer_price !== '' &&
                                                    item.offer_price !== undefined &&
                                                    item.offer_price !== null
                                                    ? item.offer_price
                                                    : item.price
                                            }
                                            addonsItems={item.addons_category_list === undefined ? [] : item.addons_category_list}
                                            iscounts={item.addons_category_list === undefined ? true : false}
                                            quantity={item.quantity}
                                            onPlusClick={this.onPlusEventHandler}
                                            onMinusClick={this.onMinusEventHandler}
                                            deleteClick={this.onDeletEventHandler}
                                            lan={this.props.lan}
                                            showCookingInfo={this.showCookingInfo}
                                            removeCookingInfo={this.removeCookingInfo}
                                        />
                                    );
                                }}
                            />

                            {/* FEATUED ITEMS */}
                            {this.featured_items !== undefined && this.featured_items !== null && this.featured_items.length !== 0 ?
                                <View>
                                    <EDRTLText title={strings("peopleAlsoOrdered")} style={[style.alsoOrderedText]} />
                                    <FlatList
                                        style={{ marginVertical: 5, marginBottom: 10, }}
                                        // showsHorizontalScrollIndicator={false}
                                        data={this.featured_items}
                                        renderItem={this.renderFeaturedItems}
                                        extraData={this.state}
                                    // horizontal
                                    />
                                </View> : null}

                            {/* BOTTOM VIEW */}
                            <View style={{}}>
                                {/* Tip */}
                                {
                                
                                this.props.navigation.state.params?.delivery_status == 'Delivery' ?
                                    <View>

                                        {/* <EDRTLView style={[style.walletContainer, {}]}> */}
                                        {/* <TouchableOpacity onPress={this.toggleTip}> */}
                                        {/* <EDRTLView style={{ alignItems: "center", marginHorizontal: 15, marginVertical: 10 }}> */}
                                        {/* <Icon name="account-balance-wallet" size={25} /> */}
                                        {/* <Icon name={this.state.tipView ? "checkbox-outline" : "square-outline"} type={'ionicon'} color={EDColors.primary} size={getProportionalFontSize(22)} onPress={this.toggleTip} /> */}
                                        {/* <EDRTLText style={[style.walletText, { marginTop: 5, marginHorizontal:0 }]} title={strings("driverTip")} /> */}
                                        {/* </EDRTLView> */}
                                        {/* </TouchableOpacity> */}
                                        {/* </EDRTLView> */}

                                        {this.state.tipView ?
                                            <>
                                                <View style={{
                                                    backgroundColor: "#fff",
                                                    borderRadius: 16,
                                                    // marginTop: -40,
                                                    paddingTop: 10,
                                                    margin: 10,
                                                    // paddingHorizontal: 20,
                                                    paddingBottom: 10
                                                }}>
                                                    <EDRTLText style={[style.walletText, { marginTop: 0, marginHorizontal: 10 }]} title={strings("driverTip")} />
                                                    {/* Tip Buttons */}

                                                    <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} containerStyle={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>

                                                        {this.tipsArray.map((item, key) => {
                                                            return (
                                                                <TouchableOpacity
                                                                    key={key}
                                                                    style={[style.roundButton, { borderWidth: 1, borderColor: item.selected ? EDColors.primary : EDColors.separatorColor, backgroundColor: EDColors.white, borderRadius: 8 }]}
                                                                    onPress={() => {
                                                                        for (let i = 0; i < this.tipsArray.length; i++)
                                                                            if (i == key)
                                                                                this.tipsArray[i].selected = true
                                                                            else
                                                                                this.tipsArray[i].selected = false
                                                                        this.isCustom = false
                                                                        this.setState({ tip: item.value, customTip: '', noTip: false })
                                                                    }}>
                                                                    <Text style={[style.button, { color: item.selected ? EDColors.primary : EDColors.blackSecondary }]}>{item.value + "%"}</Text>
                                                                </TouchableOpacity>
                                                            )
                                                        })}
                                                    </ScrollView>



                                                    {/* <View style={{
                                                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
                                                        borderColor: 'yellow', borderWidth: 1
                                                    }}> */}
                                                    <EDRTLView style={[style.roundButton, {
                                                        width: "100%", flex: 1, marginHorizontal: 10, justifyContent: "space-between",
                                                        backgroundColor: EDColors.white,
                                                        paddingHorizontal: 10, alignItems: 'center', alignSelf: 'center'
                                                    }]}>
                                                        <EDRTLView style={{ alignItems: 'center', flex: 1 }}>

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
                                                                                this.setState({ customTip: customTip, tip: '', noTip: false })
                                                                            }
                                                                        }
                                                                    }}
                                                                    value={this.state.customTip} />
                                                            </EDRTLView>
                                                            {/* <TouchableOpacity
                                                                style={{ alignSelf: "center" }}
                                                                onPress={() => { this.setState({ customTip: '', noTip: true }) }} >
                                                                <Icon name={"close"} size={getProportionalFontSize(18)} />
                                                            </TouchableOpacity> */}
                                                        </EDRTLView>
                                                        <EDRTLView style={{ alignItems: 'center', justifyContent: "flex-end" }}>
                                                            <EDButton
                                                                style={[style.roundButton, { borderColor: EDColors.primary, borderWidth: 1, borderRadius: 8, alignItems: "center", textAlign: "center", padding: 0, margin: 0, marginHorizontal: 10, backgroundColor: "white" }]}
                                                                onPress={() => {
                                                                    const newArr1 = this.tipsArray.map(v => ({ ...v, selected: false }))
                                                                    this.tipsArray = newArr1
                                                                    this.setState({ noTip: true, tip: '', customTip: '' })
                                                                    this.tip = ''
                                                                    this.isCustom = false
                                                                    this.getcartDataList()
                                                                }}
                                                                textStyle={[style.button, { color: EDColors.primary, fontSize: getProportionalFontSize(13), alignSelf: "center", textAlign: "center" }]} label={strings("clearTip")}
                                                            />
                                                            <EDButton
                                                                style={[style.roundButton, { borderRadius: 8, alignItems: "center", textAlign: "center", padding: 0, margin: 0, marginHorizontal: 0 }]}
                                                                disabled={(Number(this.state.customTip) == 0 && this.state.customTip.toString().trim() === '' && this.state.customTip.toString().trim() === undefined) && this.state.tip.toString().trim() === '' && this.state.customTip.toString().trim() == undefined}
                                                                onPress={() => {
                                                                    this.tip = this.state.customTip.toString().trim() != "" && this.state.customTip.toString().trim() != "" && this.state.customTip.toString().trim() != undefined ? this.state.customTip : this.state.tip
                                                                    // this.isCustom = this.state.customTip?.trim() != ""
                                                                    this.getcartDataList()
                                                                }}
                                                                textStyle={[style.button, { fontSize: getProportionalFontSize(13), alignSelf: "center", textAlign: "center" }]} label={strings("submitButton")}
                                                            />

                                                        </EDRTLView>
                                                    </EDRTLView>


                                                </View>
                                                {/* </View> */}
                                            </> : null}
                                    </View> : null

                                    //tip section
                                    }
                                {/* WALLET BALANCE  */}
                                {this.unpaid_orders_status && this.wallet_money !== undefined && this.wallet_money !== null && this.wallet_money !== "0.00" && this.props.userID != undefined && this.props.userID != "" ?
                                   this.payment_option !== 'paystack' && <TouchableOpacity onPress={this.toggleWallet}>
                                        <EDRTLView style={style.walletContainer}>

                                            <EDRTLView style={{ alignItems: "center", marginHorizontal: 15, marginVertical: 10 }}>
                                                {/* <Icon name="account-balance-wallet" size={25} /> */}
                                                <Icon name={this.state.walletApplied ? "checkbox-outline" : "square-outline"} type={'ionicon'} color={EDColors.primary} size={getProportionalFontSize(22)} onPress={this.toggleWallet} />
                                                <EDRTLText style={style.walletText} title={
                                                    strings("applyWallet") + '(' + this.props.currency + this.wallet_money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ')'} />
                                            </EDRTLView>

                                            {/* <Icon name={this.state.walletApplied ? "check-box" : "check-box-outline-blank"} color={EDColors.primary} size={25} onPress={this.toggleWallet} /> */}
                                        </EDRTLView>
                                    </TouchableOpacity>
                                    : null}

                                {this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                                    this.props.navigation.state.params.isDineOrder == true) ?
                                    <TouchableOpacity onPress={this.toggleParcel}>

                                        <EDRTLView style={[style.walletContainer, { marginTop: 5 }]}>

                                            <EDRTLView style={{ alignItems: "center", marginHorizontal: 15, marginVertical: 10 }}>
                                                {/* <Icon name="account-balance-wallet" size={25} /> */}
                                                <Icon name={this.state.isParcel ? "checkbox-outline" : "square-outline"} type={'ionicon'} color={EDColors.primary} size={getProportionalFontSize(22)} onPress={this.toggleParcel} />
                                                <EDRTLText style={style.walletText} title={strings("isParcel")} />
                                            </EDRTLView>
                                        </EDRTLView>
                                    </TouchableOpacity>
                                    : null}

                                {/* PRICE DETAILS */}
                                <View style={style.priceContainer}>
                                    <EDRTLText style={[style.title, { marginVertical: 5, marginHorizontal: 20, fontFamily: EDFonts.semiBold }]} title={strings("priceDetail")} />
                                    <View style={style.divider} />
                                    {this.cartResponse.price != undefined ? (
                                        this.cartResponse.price.filter(data => data.label_key !== undefined).map((item, index) => {
                                            return (
                                                <PriceDetail
                                                    key={item.label}
                                                    title={item.label != undefined ? capiString(item.label) : ""}
                                                    subtitle={item.label2 != undefined ? capiString(item.label2) : ""}
                                                    titleStyle={style.priceLabel}
                                                    priceStyle={style.priceLabel}
                                                    priceDetailsView={style.priceDetailView}
                                                    currency={this.props.currency}
                                                    price={
                                                        //&& !item.label_key.includes("Tip") for hide tip label
                                                        item.value != undefined 
                                                            ? item.label_key.includes("Discount")
                                                                ? isRTLCheck() ? this.props.currency + item.value + " -" : "- " + this.props.currency + funGetFrench_Curr(item.value, 1, this.props.currency)
                                                                : ( item.label_key.includes("Tip") || item.label_key.includes("Fee") || item.label_key.includes("Delivery") || item.label_key.includes("Service") || item.label_key.includes("Credit")) ? (item.value.toString().includes("%") ? isRTLCheck() ? item.value + " +" : "+ " + item.value :
                                                                    isRTLCheck() ? this.props.currency + item.value + " +" : "+ " + this.props.currency + funGetFrench_Curr(item.value, 1, this.props.currency)) :
                                                                    this.props.currency + funGetFrench_Curr(item.value, 1, this.props.currency)
                                                            : ""
                                                    }
                                                    label_key={item.label_key}
                                                    showToolTip={item.showToolTip}
                                                    taxable_fields={this.taxable_fields}
                                                    deleteCoupon={this.deleteCoupon}
                                                    coupon_name={item.coupon_name}

                                                />
                                            );
                                        })) : (<View />)}
                                </View>

                                {/* PROMO CODE VIEW */}
                                {this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                                    this.props.navigation.state.params.isDineOrder == true) ? null :
                                    <View style={style.walletContainer} >
                                        {this.cartResponse.is_apply == true ? (
                                            <>
                                                <View style={style.cartResponse} >
                                                    <EDRTLView style={{ alignItems: 'center', marginVertical: 10 }}>
                                                        <Text style={[style.cartResponseTextStyle, { flex: 1 }]} >
                                                            {this.cartResponse.coupon_arrayapply.length + strings("couponApplied")}
                                                        </Text>
                                                        <Icon //TEMP
                                                            onPress={this.clearPromo}
                                                            name={"close"}
                                                            size={getProportionalFontSize(26)}
                                                            color={EDColors.black}
                                                        />
                                                    </EDRTLView>

                                                </View>
                                                <View style={{ height: 1, backgroundColor: EDColors.separatorColorNew, width: "95%", alignSelf: 'center' }} />
                                                <EDRTLView style={{ alignItems: 'center' }}>
                                                    {/* <Icon name={"local-offer"} size={16} color={EDColors.blackSecondary} style={style.discountIcon} /> */}
                                                    <SvgXml xml={discount_icon} style={{ marginHorizontal: 5 }} />
                                                    <Text
                                                        style={style.promoCode}
                                                        onPress={this.navigateToPromoCode}>
                                                        {strings("applyMore")}
                                                    </Text>
                                                </EDRTLView>
                                            </>
                                        ) : (

                                            <EDRTLView style={{ alignItems: 'center' }}>
                                                {/* <Icon name={"local-offer"} size={16} color={EDColors.blackSecondary} style={style.discountIcon} /> */}
                                                <SvgXml xml={discount_icon} style={{ marginHorizontal: 5 }} />
                                                <Text
                                                    style={style.promoCode}
                                                    onPress={this.navigateToPromoCode}>
                                                    {strings("haveAPromo")}
                                                </Text>
                                            </EDRTLView>
                                        )}
                                    </View>}

                                {this.props.minOrderAmount !== undefined && this.props.navigation.state.params != undefined && this.props.navigation.state.params.isDineOrder !== true ?
                                    (this.cartTotal !== undefined && this.cartTotal >= Number(this.props.minOrderAmount)) || (this.props.navigation.state.params.delivery_status !== undefined && this.props.navigation.state.params.delivery_status.toLowerCase() == 'pickup') ? null :
                                        <View style={{
                                            backgroundColor: EDColors.offWhite, alignItems: 'center', margin: 10, marginBottom: 8,
                                            paddingBottom: 8, borderBottomColor: EDColors.separatorColorNew, borderBottomWidth: 1,
                                            borderRadius: 16
                                        }}>
                                            <Text style={{ color: EDColors.black, fontSize: getProportionalFontSize(14), marginVertical: 5, marginHorizontal: 5, fontFamily: EDFonts.medium, textAlign: 'center', }}>
                                                {isRTLCheck() ? strings('minOrderMsg') + this.props.currency + this.props.minOrderAmount + strings('minOrderMsg2') : strings('minOrderMsg') + this.props.currency + this.props.minOrderAmount + strings('minOrderMsg2')}</Text>
                                        </View> : null}



                            </View>
                        </ScrollView>

                        {/* <TouchableOpacity
                            onPress={this.toggleDescription}
                            style={{ backgroundColor: EDColors.offWhite,  margin: 10, borderRadius: 16, marginTop: 0 }}> */}

                        {/* <EDRTLText style={{ color: EDColors.black, fontSize: getProportionalFontSize(13), marginVertical: 5, marginHorizontal: 5, fontFamily: EDFonts.medium, }}
                                title={strings("note") + " "} /> */}
                        {/* <EDRTLText */}
                        <View style={{
                            marginTop: 10,
                            marginHorizontal: 10,
                            marginBottom: 4
                        }}>
                            <SeeMore
                                numberOfLines={1}
                                style={style.disclaimer}

                                linkColor={EDColors.primary}
                                linkStyle={[style.disclaimer, {
                                    fontFamily: EDFonts.bold,
                                }]}
                            >{strings("orderDisclaimer")}
                            </SeeMore>
                        </View>

                        <Paystack
                            paystackKey={this.publishable_key}
                            paystackSecretKey={this.secret_key}
                            amount={this.cartResponse.total}
                            billingEmail={this.email}
                            // billingMobile={'12345678'}
                            // billingName={'Abbasi'}
                            channels={['card', 'bank']}
                            currency='NGN'
                            onCancel={(e) => {
                                // handle response here
                                console.log('paystack res', e)

                            }}
                            onSuccess={(res) => {
                                // handle response here
                                //console.log('paystack res', JSON.stringify(res))
                                // if (this.selectedCard !== undefined) {
                                //     var params={};
                                //     params = {
                                //         language_slug: this.props.lan,
                                //         amount: parseFloat(this.cartResponse.total).toFixed(2) * 100,
                                //         currency: this.currency_code,
                                //         payment_method: 'paystack',
                                //         user_id: this.props.userID,
                                //         payment_method_id: this.selectedCard.id,
                                //         isLoggedIn: 1
                                //     }
                                // }
                                this.placeOrder(res.transactionRef.reference, "paystack")
                                //createPaymentMethod(params, this.onPaymentMethodSuccess, this.onPaymentMethodFailure, this.props)
                            }}
                            ref={this.paystackWebViewRef}
                        />
                        {/* 
                        </TouchableOpacity> */}

                        {/* CHECK OUT VIEW */}
                        {/* <EDRTLView style={style.checkOutContainer}> */}
                        {/* <EDRTLText style={style.totalPrice}
                                title={this.props.currency + funGetFrench_Curr(this.cartResponse.total, 1, this.props.currency)}
                            /> */}
                        {/* <TouchableOpacity
                                style={style.checkoutButtonView}
                                onPress={this.fetchUpdatedCart}>
                                <Text style={style.checkoutText}>{this.placeOrderFromCheckout ? strings("placeOrder") + " (" + this.props.currency + funGetFrench_Curr(this.cartResponse.total, 1, this.props.currency) + ")" : strings("doCheckout") + " (" + this.props.currency + funGetFrench_Curr(this.cartResponse.total, 1, this.props.currency) + ")"}</Text>
                            </TouchableOpacity> */}
                        {/* </EDRTLView> */}
                        {console.log('uuu--->',this.cartResponse.total)}
                        <EDThemeButton
                            onPress={this.fetchUpdatedCart}
                            label={
                                this.placeOrderFromCheckout ? strings("placeOrder") + " (" + this.props.currency + funGetFrench_Curr(this.cartResponse.total, 1, this.props.currency) + ")" : strings("doCheckout") + " (" + this.props.currency + funGetFrench_Curr(this.cartResponse.total, 1, this.props.currency) + ")"}
                            style={[style.themeButton, {
                                marginBottom: (Platform.OS == "ios" ? initialWindowMetrics.insets.bottom : 0) + 5,
                            }]}
                            textStyle={style.themeButtonText}
                        />

                    </View >
                    : this.cartResponse != undefined &&
                        this.cartResponse.items.length <= 0
                        ? <View style={{ flex: 1, height: metrics.screenHeight * 0.9 }}>
                            <EDPlaceholderComponent
                                title={strings("emptyCartMsg")}
                            />
                        </View>
                        : null
                }
            </BaseContainer>
        );
    }
    //#endregion

    toggleParcel = () => {
        this.setState({ isParcel: !this.state.isParcel })
    }

    onProductPress = item => {
        // this.selectedItem = data
        // this.setState({
        //     visible: true
        // }) 

        let data = JSON.parse(JSON.stringify(item))

        let quantity = 1
        if (data.is_customize == "0") {
            let count = 0
            let same_item_incart = this.cartResponse.items.filter(item => { return item.menu_id === data.menu_id })
            if (same_item_incart !== undefined && same_item_incart !== null && same_item_incart.length !== 0) {
                same_item_incart.map(data => {
                    count = count + data.quantity
                })
            }
            quantity = count
        }
        this.props.navigation.navigate("CategoryDetailContainer",
            {
                refreshScreen: this.getcartDataList,
                subCategoryArray: data,
                resid: this.resId,
                content_id: this.content_id,
                currency_symbol: this.props.currency,
                ItemName: data.name,
                restaurantDetails: {
                    timings: this.cartResponse.restaurant_timings,
                    allow_scheduled_delivery: this.cartResponse.allow_scheduled_delivery
                },
                quantity: quantity,
                takeToCheckout: this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                    this.props.navigation.state.params.isDineOrder == true)

            }
        )

    }


    //#region 
    /** FEATURED ITEMS */
    renderFeaturedItems = (item) => {
        return (
            // <View style={style.featuredProductView} >
            <ProductComponent
                shouldLoadImage={true}
                currency={this.props.currency}
                data={item.item}
                allowPreOrder={this.allowPreOrder}
                addons_category_list={item.item.addons_category_list === undefined ? [] : item.item.addons_category_list}
                cartData={this.cartResponse !== undefined && this.cartResponse.items.length !== 0 ? this.cartResponse.items : []}
                // isLoading={this.props.isLoading}
                isOpen={true}
                plusAction={() => this.onPressAddtoCartItemHandler(item.item, 1)}
                // minusItems={this.props.minusItems}
                addData={() => this.onPressAddtoCartItemHandler(item.item, 1)}
                addOneData={() => this.onPressAddtoCartItemHandler(item.item, 1)}
                onProductPress={() => this.onProductPress(item.item)}
                style={{ marginHorizontal: 5 }}
            />
            // </View>
        )
    }
    onFeaturedPress = item => {
        // // // OPEN THE MODAL FOR PRODUCTS DETAILS
        debugLog("FEATURE PRESS ::::", item)
        this.selectedItem = item
        this.setState({
            visible: true
        })
    }

    onPressAddtoCartItemHandler = (item, qty) => {
        // this.setState({ cartLoading: true })
        console.log('onAddPress::', item)
        if (item.is_customize === "0") {
            this.storeData(item, qty)
        } else {
            if (this.cartResponse.items !== undefined && this.cartResponse.items.length > 0) {
                var repeatItem = this.cartResponse.items.filter(items => {
                    return items.menu_id == item.menu_id
                })

                if (repeatItem.length > 0) {
                    this.selectedItem = item
                    this.setState({
                        isCategory: true,
                        visible: false
                    })
                } else {
                    this.setState({ visible: false })
                    this.onResDetailsAddEvent(item)
                }
            } else {
                this.setState({ visible: false })
                this.onResDetailsAddEvent(item)
            }
        }
    }
    //#endregion

    onNewButtonHandler = () => {
        this.setState({
            isCategory: false
        })
        this.onResDetailsAddEvent(this.selectedItem)
    }

    onRepeatButtonHandler = () => {
        this.setState({
            isCategory: false
        })

        this.selectedArray = this.cartResponse.items.filter((items) => {
            return items.menu_id === this.selectedItem.menu_id
        })
        this.lastSelectedData = this.selectedArray[this.selectedArray.length - 1]
        this.storeData(this.lastSelectedData, 1);
    }


    onResDetailsAddEvent = (addData) => {
        this.props.navigation.navigate("CategoryDetailContainer",
            {
                subCategoryArray: addData,
                resid: this.resId,
                content_id: this.content_id,
                currency_symbol: this.props.currency,
                refreshScreen: this.getcartDataList,
                restaurantDetails: {
                    timings: this.cartResponse.restaurant_timings,
                    allow_scheduled_delivery: this.cartResponse.allow_scheduled_delivery
                },
                ItemName: addData.name,
                takeToCheckout: this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                    this.props.navigation.state.params.isDineOrder == true)
            }
        )
    }

    onDismissHandler = () => {
        this.setState({
            isCategory: false
        })
    }

    /** RENDER CATEGORY MODEL */
    renderCategoryOrder = () => {
        return (
            <EDPopupView isModalVisible={this.state.isCategory}>
                <EDCategoryOrder
                    onDismissHandler={this.onDismissHandler}
                    categoryName={this.selectedItem.name}
                    newButtomHandler={this.onNewButtonHandler}
                    repeatButtonHandler={this.onRepeatButtonHandler}
                />
            </EDPopupView>
        )
    }

    //#region ON CLOSE EVENT HANDLER
    onDismissItemDetailHandler = () => {
        this.setState({ visible: false });
    }
    //#endregion


    //#region ITEM DETAILS
    renderItemDetails = () => {
        return (

            <EDPopupView isModalVisible={this.state.visible}>
                <EDItemDetails
                    data={this.selectedItem}
                    onDismissHandler={this.onDismissItemDetailHandler}
                    onPress={this.onPressAddtoCartItemHandler}
                    isOpen={true}
                    cartData={this.cartResponse !== undefined && this.cartResponse.items.length !== 0 ? this.cartResponse.items : []}
                    navigateToCart={this.onDismissItemDetailHandler}
                // key={this.state.key}
                />
            </EDPopupView>
        )
    }


    //#region STORE
    /** STORE DATA */
    storeData = (data, qty) => {
        var cartArray = [];
        var cartData = {};

        //demo changes
        getCartList(
            success => {
                debugLog("SUCCESS ::::::", success)
                if (success != undefined) {
                    cartArray = success.items;
                    if (cartArray.length > 0) {
                        if (success.resId == this.resId) {
                            var repeatArray = cartArray.filter(item => { return item.menu_id == data.menu_id; });

                            if (repeatArray.length > 0) {
                                repeatArray[repeatArray.length - 1].quantity = repeatArray[repeatArray.length - 1].quantity + qty;
                            } else {
                                data.quantity = 1;
                                cartArray.push(data);
                            }

                            cartData = {
                                resId: this.resId,
                                content_id: this.content_id,
                                items: cartArray.filter(data => data.quantity !== 0),
                                coupon_name:
                                    success.coupon_name.length > 0 ? success.coupon_name : "",
                                cart_id: success.cart_id,
                                table_id: success.table_id !== undefined ? success.table_id : this.props.table_id,
                                resName: this.resName,
                                coupon_array: success.coupon_array

                            };
                            // if (this.props.table_id !== undefined && this.props.table_id !== "")
                            //     cartData.table_id = this.props.table_id;
                            this.updateCount(cartData.items, repeatArray.length == 0);
                            this.saveData(cartData);
                            this.setState({
                                cartData: cartData.items,
                                key: this.state.key + 1
                            })
                        } else {
                            showValidationAlert(strings("pendingItems"));
                            this.setState({
                                visible: false
                            })
                        }
                    } else if (cartArray.length == 0) {
                        //cart empty
                        data.quantity = 1;
                        cartData = {
                            resId: this.resId,
                            content_id: this.content_id,
                            items: [data],
                            coupon_name: "",
                            cart_id: 0,
                            resName: this.resName,
                            coupon_array: []
                        };
                        if (this.props.table_id !== undefined && this.props.table_id !== "")
                            cartData.table_id = this.props.table_id;
                        this.updateCount(cartData.items, true);
                        this.saveData(cartData);
                        this.setState({
                            cartData: cartData.items,
                            // visible: false,
                            key: this.state.key + 1
                        })
                    }
                } else {
                    //cart has no data
                    data.quantity = 1;
                    cartData = {
                        resId: this.resId,
                        content_id: this.content_id,
                        items: [data],
                        coupon_name: "",
                        cart_id: 0,
                        resName: this.resName,
                        coupon_array: []

                    };
                    if (this.props.table_id !== undefined && this.props.table_id !== "")
                        cartData.table_id = this.props.table_id;
                    this.updateCount(cartData.items, true);
                    this.saveData(cartData);
                    this.setState({
                        cartData: cartData.items,
                        // visible: false,
                        key: this.state.key + 1
                    })
                }
                // this.props.navigation.state.params.categoryArray = undefined
            },
            onCartNotFound => {
                //first time insert data
                debugLog("onCartNotFound", onCartNotFound);
                data.quantity = 1;
                cartData = {
                    resId: this.resId,
                    content_id: this.content_id,
                    items: [data],
                    coupon_name: "",
                    cart_id: 0,
                    resName: this.resName,
                    coupon_array: []

                };
                if (this.props.table_id !== undefined && this.props.table_id !== "")
                    cartData.table_id = this.props.table_id;
                this.updateCount(cartData.items, true);
                this.saveData(cartData);
                this.setState({
                    // visible: false
                    cartData: cartData.items,
                    key: this.state.key + 1
                })
            },
            error => {
                debugLog("onCartNotFound", error);
            }
        );
        this.setState({ visible: false })

        // this.getcartDataList()

    }

    saveData(data) {
        debugLog("CALLED FROM CART DATA TO SAVE :::", data)
        saveCartData(data, success => { }, fail => { });
        this.getCartData(data.items)
    }


    //#region 
    /** ON PLUS CLICKED */
    onPlusEventHandler = (value, index) => {
        this.promoCode = "";
        this.promoArray = []
        if (value > 0) {
            this.cartResponse.items[index].quantity = value;
            this.getCartData(this.cartResponse.items);
        }
    }
    //#endregion

    //#region 
    /** ONMINUS CLICKED */
    onMinusEventHandler = (value, index) => {
        this.promoCode = "";
        this.promoArray = []
        if (value > 0) {
            this.cartResponse.items[index].quantity = value;
            this.getCartData(this.cartResponse.items);
        } else if (value == 0) {
            var array = this.cartResponse.items;
            array.splice(index, 1);
            this.getCartData(array);
        }
    }
    //#endregion

    //#region 
    /** ON DLEETE CLICKED */
    onDeletEventHandler = (index) => {
        this.promoCode = "";
        this.promoArray = []
        this.deleteIndex = index;
        showDialogue(
            strings('deleteFromCart'),
            [{ text: strings('dialogYes'), onPress: this.onYesEventHandler, buttonColor: EDColors.offWhite }],
            '',
            this.onNoEventHandler
            ,
            strings('dialogNo'),
            true
        );
    }
    //#endregion

    //#region 
    /** ON CLOASE BUTTON */
    onCloseEventHandler = () => {
        this.promoCode = "";
        this.promoArray = []
        this.getCartData(this.cartResponse.items);
    }
    //#endregion

    //#region 
    /** LEFT PRESS EVENT */
    onLeftPressEvent = () => {
        this.promoCode = ""
        this.promoArray = []

        this.props.navigation.goBack();
    }
    //#endregion



    //#region 
    /** BUTTON PRESSED EVENTS */
    onYesEventHandler = () => {
        var array = this.cartResponse.items;
        array.splice(this.deleteIndex, 1);
        this.getCartData(array);
    }

    onNoEventHandler = () => {
        this.deleteIndex = -1;
    }
    //#endregion


    //#region 
    /** NAVIGATE TO PROMO CODE CONTAINER */
    navigateToPromoCode = () => {
        this.props.navigation.navigate("PromoCodeContainer", {
            promoArray: this.promoArray,
            used_coupons: this.cartResponse.coupon_arrayapply,
            getData: this.passCurrentData,
            subTotal: this.cartResponse.subtotal,
            resId: this.resId,
            order_delivery: this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                this.props.navigation.state.params.isDineOrder == true) ? "DineIn" : this.props.navigation.state.params.delivery_status || "",
        });
    }
    //#endregion

    clearPromo = () => {
        this.promoArray = []
        this.getCartData(this.cartResponse.items)
    }


    fetchUpdatedCart = () => {
        this.getCartData(this.cartResponse.items, true)
    }



    //#region 
    /** CHECKOUT EVENT HANDLER */
    onCheckOutEventHandler = () => {
        if (
            this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" &
            (this.props.phoneNumberInRedux == undefined || this.props.phoneNumberInRedux == null || this.props.phoneNumberInRedux == '')) {
            this.props.saveIsCheckoutScreen(true)
            this.props.navigation.navigate('PhoneNumberInput', {
                social_media_id: this.props.social_media_id,
                isFacebook: this.props.social_media_id !== undefined &&
                    this.props.social_media_id !== null &&
                    this.props.social_media_id !== '',
                user_id: this.props.userID
            })
            return;
        }
        if (this.is_unpaid) {
            if (this.props.res_id == this.resId) {
                var checkoutData = {
                    address_id: this.props.navigation.state.params !== undefined ? this.props.navigation.state.params.address_id : 0,
                    subtotal: this.cartResponse.subtotal,
                    items: '{"items": ' + JSON.stringify(this.cartResponse.items) + "}",
                    coupon_id: this.cartResponse.coupon_id,
                    coupon_type: this.cartResponse.coupon_type,
                    coupon_amount: this.cartResponse.coupon_amount,
                    user_id: this.props.userID,
                    // token: this.props.token,
                    restaurant_id: this.resId,
                    total: this.cartResponse.total,
                    coupon_name: this.cartResponse.coupon_name,
                    coupon_discount: this.cartResponse.coupon_discount,
                    order_date: "",
                    order_delivery: this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                        this.props.navigation.state.params.isDineOrder == true) ? "DineIn" : this.props.navigation.state.params.delivery_status,
                    language_slug: this.props.lan,
                    delivery_charge: this.delivery_charges,
                    delivery_instructions:
                        this.props.navigation !== undefined &&
                            this.props.navigation.state !== undefined &&
                            this.props.navigation.state.params !== undefined ?
                            this.props.navigation.state.params.delivery_instructions
                            : '',
                    extra_comment:
                        this.props.navigation !== undefined &&
                            this.props.navigation.state !== undefined &&
                            this.props.navigation.state.params !== undefined ?
                            this.props.navigation.state.params.comment
                            : '',
                    is_wallet_applied: this.state.walletApplied ? 1 : 0,
                    wallet_balance: parseFloat(this.wallet_money) - parseFloat(this.wallet_discount),
                    debited_amount: this.wallet_discount,
                    is_parcel_order: this.state.isParcel ? "1" : "0",
                    driver_tip: this.cartResponse.driver_tip,
                    tip_percent_val: this.cartResponse.tip_percent_val,
                    is_creditcard:
                        this.props.navigation.state.params !== undefined &&
                            this.props.navigation.state.params.payment_option !== undefined &&
                            this.props.navigation.state.params.payment_option !== "cod" ? "yes" : "no",
                    is_creditcard_fee_applied: this.cartResponse.is_creditcard_fee_applied,
                    is_service_fee_applied: this.cartResponse.is_service_fee_applied,
                    service_feeval: this.cartResponse.service_feeval,
                    service_fee_typeval: this.cartResponse.service_fee_typeval,
                    creditcard_feeval: this.cartResponse.creditcard_feeval,
                    creditcard_fee_typeval: this.cartResponse.creditcard_fee_typeval,
                    service_tax_typeval: this.cartResponse.service_tax_typeval,
                    service_taxval: this.cartResponse.service_taxval,
                    coupon_array: JSON.stringify(this.cartResponse.coupon_arrayapply)
                };

                if (this.isPreOrder == true) {
                    checkoutData.scheduled_date = this.props.navigation.state.params.scheduled_date;
                    checkoutData.slot_open_time = this.props.navigation.state.params.slot_open_time;
                    checkoutData.slot_close_time = this.props.navigation.state.params.slot_close_time;

                }

                if (this.table_id !== undefined && this.table_id !== "") {
                    checkoutData.table_id = this.table_id;
                    checkoutData.order_delivery = "DineIn"
                }
                this.props.saveCheckoutDetails(checkoutData)
                if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.payment_option !== undefined) {

                    this.comment = this.props.navigation.state.params.comment

                    if (this.props.navigation.state.params.payment_option == "cod")
                        this.placeOrder()



                    else
                        this.navigateToPaymentGateway(this.props.navigation.state.params.payment_option)
                }
                else
                    this.props.navigation.navigate("PaymentContainer", {
                        "currency_code": this.currency_code,
                        allowPayLater: this.allowPayLater,
                        addToCartData: this.addToCartData,
                        resContentId: this.content_id
                    })
            } else {
                showProceedDialogue(strings("payPending2"), [{ "text": strings("dialogCancel"), onPress: () => { }, isNotPreferred: true }], strings("appName"), this.navigatetoPending)
            }
        }
        else {
            var checkoutData = {
                address_id: this.props.navigation.state.params !== undefined ? this.props.navigation.state.params.address_id : 0,
                subtotal: this.cartResponse.subtotal,
                items: '{"items": ' + JSON.stringify(this.cartResponse.items) + "}",
                coupon_id: this.cartResponse.coupon_id,
                coupon_type: this.cartResponse.coupon_type,
                coupon_amount: this.cartResponse.coupon_amount,
                user_id: this.props.userID,
                // token: this.props.token,
                restaurant_id: this.resId,
                total: this.cartResponse.total,
                coupon_name: this.cartResponse.coupon_name,
                coupon_discount: this.cartResponse.coupon_discount,
                order_date: "",
                order_delivery: this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                    this.props.navigation.state.params.isDineOrder == true) ? "DineIn" : this.props.navigation.state.params.delivery_status,
                language_slug: this.props.lan,
                delivery_charge: this.delivery_charges,
                extra_comment:
                    this.props.navigation !== undefined &&
                        this.props.navigation.state !== undefined &&
                        this.props.navigation.state.params !== undefined ?
                        this.props.navigation.state.params.comment
                        : '',
                delivery_instructions:
                    this.props.navigation !== undefined &&
                        this.props.navigation.state !== undefined &&
                        this.props.navigation.state.params !== undefined ?
                        this.props.navigation.state.params.delivery_instructions
                        : '',
                is_wallet_applied: this.state.walletApplied ? 1 : 0,
                wallet_balance: parseFloat(this.wallet_money) - parseFloat(this.wallet_discount),
                debited_amount: this.wallet_discount,
                is_parcel_order: this.state.isParcel ? "1" : "0",
                driver_tip: this.cartResponse.driver_tip,
                tip_percent_val: this.cartResponse.tip_percent_val,
                is_creditcard:
                    this.props.navigation.state.params !== undefined &&
                        this.props.navigation.state.params.payment_option !== undefined &&
                        this.props.navigation.state.params.payment_option !== "cod" ? "yes" : "no",
                is_creditcard_fee_applied: this.cartResponse.is_creditcard_fee_applied,
                is_service_fee_applied: this.cartResponse.is_service_fee_applied,
                service_feeval: this.cartResponse.service_feeval,
                service_fee_typeval: this.cartResponse.service_fee_typeval,
                creditcard_feeval: this.cartResponse.creditcard_feeval,
                creditcard_fee_typeval: this.cartResponse.creditcard_fee_typeval,
                service_tax_typeval: this.cartResponse.service_tax_typeval,
                service_taxval: this.cartResponse.service_taxval,
                coupon_array: JSON.stringify(this.cartResponse.coupon_arrayapply)
            };
            if (this.table_id !== undefined && this.table_id !== "") {
                checkoutData.table_id = this.table_id;
                checkoutData.order_delivery = "DineIn"
            }

            if (this.isPreOrder == true) {
                checkoutData.scheduled_date = this.props.navigation.state.params.scheduled_date;
                checkoutData.slot_open_time = this.props.navigation.state.params.slot_open_time;
                checkoutData.slot_close_time = this.props.navigation.state.params.slot_close_time;


            }

            this.props.saveCheckoutDetails(checkoutData)
            debugLog("HERE  :::::", this.props.navigation.state.params !== undefined && this.props.navigation.state.params.payment_option !== undefined)
            if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.payment_option !== undefined) {

                this.comment = this.props.navigation.state.params.comment
                if (this.props.navigation.state.params.payment_option == "cod")
                    this.placeOrder()



                else
                    this.navigateToPaymentGateway(this.props.navigation.state.params.payment_option)
            }
            else
                this.props.navigation.navigate("PaymentContainer", {
                    "currency_code": this.currency_code,
                    allowPayLater: this.allowPayLater,
                    addToCartData: this.addToCartData,
                    resContentId: this.content_id

                })
        }
        // }
        //  else {
        //     this.props.navigation.navigate('PhoneNumberInput', {
        //         isAppleLogin: true
        //     })
        // }

    }

    //#endregion


    //#region ADD ORDER
    /**
     * @param { Success Reponse Object } onSuccess
     */
    onSuccessAddOrder = (onSuccess) => {
        debugLog("ORDER SUCCESS ::::::::::::: ", onSuccess)
        if (onSuccess.error != undefined) {
            showValidationAlert(
                onSuccess.error.message != undefined
                    ? onSuccess.error.message
                    : strings("generalWebServiceError")
            );
        } else {
            if (onSuccess.status == RESPONSE_SUCCESS) {
                this.resObj = onSuccess.restaurant_detail
                this.props.saveCartCount(0);
                clearCartData(
                    response => {

                        this.props.navigation.popToTop();
                        this.props.navigation.navigate("OrderConfirm", { isForDineIn: false, resObj: onSuccess.restaurant_detail, cashback: onSuccess.earned_wallet_money });

                    },
                    error => { }
                );
            }

            else if (onSuccess.status == RESTAURANT_ERROR) {
                this.props.saveCartCount(0);
                clearCurrency_Symbol(onSuccess => { }, onfailure => { })
                clearCartData(
                    response => {
                    },
                    error => { }
                );
                showDialogue(onSuccess.message, [], strings("appName"),
                    () =>
                        this.props.navigation.dispatch(
                            StackActions.reset({
                                index: 0,
                                actions: [
                                    NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
                                ]
                            })
                        ));
            }
            else {
                showValidationAlert(onSuccess.message);
            }
        }
        this.setState({ isLoading: false });
    }
    //#endregion

    /**
     * @param { Failure Response Object } onFailure
     */
    onFailureAddOrder = (onfailure) => {
        showValidationAlert(strings("generalWebServiceError"));
        this.setState({ isLoading: false });
    }

    //#region 
    /** PLACE ORDER API */
    placeOrder = (txn_id, payment_option = "cod") => {
        netStatus(status => {
            let addOrderParams = this.props.checkoutDetail
            // addOrderParams.extra_comment = this.comment
            // addOrderParams.delivery_instructions = this.driver_comment
            addOrderParams.order_date = moment(new Date().toLocaleString('en-US', {
                timeZone: RNLocalize.getTimeZone()
            })).format("DD-MM-YYYY hh:mm A");

            if (txn_id !== undefined && txn_id !== null) {
                addOrderParams.transaction_id = txn_id;
                addOrderParams.payment_option = payment_option

            }
            else
                addOrderParams.payment_option = "cod"

            addOrderParams.isLoggedIn = (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "") ? 1 : 0


            if (this.props.userID == undefined || this.props.userID == null || this.props.userID == "") {
                addOrderParams.first_name = this.props.guestDetails.first_name
                addOrderParams.last_name = this.props.guestDetails.last_name
                addOrderParams.phone_number = this.props.guestDetails.phone_number
                addOrderParams.phone_code = this.props.guestDetails.phone_code
                addOrderParams.email = this.props.guestDetails.email

                if (addOrderParams.order_delivery == "Delivery") {
                    addOrderParams.address_input = this.props.guestAddress.address
                    addOrderParams.landmark = this.props.guestAddress.landmark
                    addOrderParams.latitude = this.props.guestAddress.latitude
                    addOrderParams.longitude = this.props.guestAddress.longitude
                    addOrderParams.zipcode = this.props.guestAddress.zipcode
                    addOrderParams.city = this.props.guestAddress.city
                    addOrderParams.state = this.props.guestAddress.state
                    addOrderParams.country = this.props.guestAddress.country
                    addOrderParams.address_label = this.props.guestAddress.address_label
                    addOrderParams.business = this.props.guestAddress.business
                }
            }

            // console.log("CheckOut request :::::::::: ", JSON.stringify(addOrderParams), addOrderParams.items)
            // return;
            if (status) {
                this.setState({ isLoading: true });
                addOrder(addOrderParams, this.onSuccessAddOrder, this.onFailureAddOrder, this.props, true)
            } else {
                showValidationAlert(strings("noInternet"));
            }
        });
    }
    //#endregion

    /**
     * Start Stripe Payment
     */
    startStripePayment = () => {
        debugLog("CARD DATA :::::", this.cardData)
        netStatus(
            status => {
                if (status) {
                    var params = {}
                    this.setState({ isLoading: true })
                    if (this.cardData !== undefined) {
                        params = {
                            language_slug: this.props.lan,
                            exp_month: this.cardData.values.expiry.substring(0, 2),
                            exp_year: this.cardData.values.expiry.substring(3, 5),
                            card_number: this.cardData.values.number,
                            cvc: this.cardData.values.cvc,
                            amount: parseFloat(this.cartResponse.total).toFixed(2) * 100,
                            // amount: parseFloat(this.checkoutDetail.total),
                            currency: this.currency_code,
                            user_id: this.props.userID,
                            payment_method: 'stripe',
                            save_card_flag: this.isCardSave ? 1 : 0,
                            is_default_card: this.isDefaultCard ? 1 : 0,
                            country_code: this.countryCode,
                            zipcode: this.cardData.values.postalCode,
                            isLoggedIn: this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" ? 1 : 0
                        }
                    }
                    else if (this.selectedCard !== undefined) {
                        params = {
                            language_slug: this.props.lan,
                            amount: parseFloat(this.cartResponse.total).toFixed(2) * 100,
                            currency: this.currency_code,
                            payment_method: 'stripe',
                            user_id: this.props.userID,
                            payment_method_id: this.selectedCard.id,
                            isLoggedIn: 1
                        }
                    }
                    else {
                        this.setState({ isLoading: false })
                        showValidationAlert(strings("generalWebServiceError"))
                        return;
                    }
                    createPaymentMethod(params, this.onPaymentMethodSuccess, this.onPaymentMethodFailure, this.props)
                }
                else {
                    showNoInternetAlert();
                }
            }
        )
    }




    startPaystackPayment = () => {
        netStatus(
            status => {
                if (status) {
                    this.paystackWebViewRef.current.startTransaction();
                }
                else {
                    showNoInternetAlert();
                }
            }
        )
    }


    /**
     * On payment method success
     */
    onPaymentMethodSuccess = (onSuccess) => {
        debugLog("ONSUCCESS::::::::", onSuccess)
        if (onSuccess.status == RESPONSE_SUCCESS) {
            if (onSuccess.stripe_response.error !== undefined) {
                showValidationAlert(((onSuccess.message !== undefined ? onSuccess.message : strings("paymentFail")) + "\n\n" + onSuccess.stripe_response.error.message))
                this.setState({ isLoading: false })

            }
            else if (onSuccess.stripe_response.status == "succeeded") {
                debugLog("Payment Sucessful without 3d secure authentication ::::::")
                this.txn_id = onSuccess.stripe_response.id;
                this.placeOrder(onSuccess.stripe_response.id, "stripe")
                this.setState({ isLoading: false })
            }
            else if (onSuccess.stripe_response.next_action.redirect_to_url.url !== undefined) {
                debugLog("Redirecting for 3d secure authentication ::::::")
                this.txn_id = onSuccess.stripe_response.id;
                this.setState({ url: onSuccess.stripe_response.next_action.redirect_to_url.url, isLoading: false })
            }
        } else {
            this.setState({ isLoading: false })
            showDialogue(onSuccess.message, [], '', () => { })
        }
    }
    /**
     * On payment method failure
     */
    onPaymentMethodFailure = (onFailure) => {
        debugLog("FAILURE :::::", onFailure)
        showDialogue((strings("paymentFail")), [], '', () => {

            if (this.isWithSavedCard) {
                this.onYesClick()
            }
        })

        this.setState({ isLoading: false })

    }



    navigateToPaymentGateway = () => {


        if (this.payment_option == "stripe") {
            // if (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "")
            //     this.props.navigation.navigate("savedCards", {
            //         "currency_code": this.currency_code,
            //         isPendingAdded: false,
            //         pendingTotalPayment: this.cartResponse.total,
            //         extra_comment: this.comment,
            //         delivery_instructions: this.driver_comment,
            //         completeAddress: this.props.navigation.state.params.completeAddress,
            //         isForSelection: true

            //     })
            // else
            //     this.props.navigation.navigate("StripePaymentContainer", {
            //         "currency_code": this.currency_code,
            //         isPendingAdded: false,
            //         pendingTotalPayment: this.cartResponse.total,
            //         extra_comment: this.comment,
            //         delivery_instructions: this.driver_comment,
            //         completeAddress: this.props.navigation.state.params.completeAddress,
            //         isWithSavedCard: false,
            //         isForSelection: true
            //     })
            this.startStripePayment();
        }

        else if (this.payment_option == "paystack") {
            this.startPaystackPayment();
        }

        else if (this.payment_option == "paypal")
            this.props.navigation.navigate("PaymentGatewayContainer", {
                "currency_code": this.currency_code,
                isPendingAdded: false,
                pendingTotalPayment: this.cartResponse.total,
                extra_comment: this.comment,
                delivery_instructions: this.driver_comment,
            })
    }

    //#region 
    /** BACK PRESS EVENT */
    handleBackPress = () => {
        this.promoCode = ""
        this.promoArray = []

        this.getCartData(this.cartResponse.items);
        this.props.navigation.goBack();
        return true;
    }
    //#endregion

    //#region ADD TO CART API
    /**
     * 
     * @param {Success Response Object } onSuccess 
     */
    onSuccessAddCart = (onSuccess) => {
        debugLog("ADD TO CART :::::", onSuccess)
        if (onSuccess.error != undefined) {
            showValidationAlert(
                onSuccess.error.message != undefined
                    ? onSuccess.error.message
                    : strings("generalWebServiceError")
            );
        } else {
            if (onSuccess.status == RESPONSE_SUCCESS) {
                this.props.saveCartPrice(onSuccess.subtotal);

                this.setTipArray(onSuccess.tip_percent_val, onSuccess.driver_tip, onSuccess.driver_tiparr)

                this.wallet_money = onSuccess.wallet_money

                this.isRedeem = onSuccess.is_redeem
                this.subTotal = onSuccess.subtotal



                this.max_used_QR = onSuccess.min_redeem_point_order
                this.minimum_subtotal = onSuccess.minimum_subtotal

                let tempArray = onSuccess.price.filter(data => { return data.label_key == "Wallet Discount" })
                if (tempArray.length !== 0) {
                    this.wallet_discount = tempArray[0].value
                } else {
                    this.setState({ walletApplied: false })
                    this.wallet_discount = 0
                }
                this.delivery_charges = onSuccess.delivery_charge
                this.currency_code = onSuccess.currency_code
                this.table_id = onSuccess.table_id
                this.allowPayLater = onSuccess.pay_later

                this.updateUI(onSuccess);
            } else if (onSuccess.status !== COUPON_ERROR) {
                this.updateUI(onSuccess);
                showValidationAlert(onSuccess.message);
            }
            else {
                showValidationAlert(onSuccess.message);
            }
        }
        this.setState({ isLoading: false, key: this.state.key + 1 });
    }

    /**
     * 
     * @param {Failure REsponse Object} onFailure 
     */
    onFailureAddCart = (onFailure) => {
        this.setState({ isLoading: false, key: this.state.key + 1 });
        if (onFailure.status == RESTAURANT_ERROR) {
            this.props.saveCartCount(0);
            clearCurrency_Symbol(onSuccess => { }, onfailure => { })
            clearCartData(
                response => {
                },
                error => { }
            );
            showDialogue(onFailure.message, [], strings("appName"),
                () =>
                    this.props.navigation.dispatch(
                        StackActions.reset({
                            index: 0,
                            actions: [
                                NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
                            ]
                        })
                    ));
        }
        else
            showValidationAlert(
                onFailure.message != undefined
                    ? onFailure.message
                    : strings("generalWebServiceError")
            );
    }

    /**
     * 
     * @param { Item to be added to Cart } items 
     */
    getCartData = (items, forCartFetch = false) => {

        netStatus(status => {
            if (status) {
                this.forCartFetch = forCartFetch
                this.setState({ isLoading: true });

                var objItems = { items: items };
                this.cartLength = items.length

                let objAddToCart = {
                    language_slug: this.props.lan,
                    user_id: this.props.userID || "",
                    restaurant_id: this.resId,
                    items: objItems,
                    cart_id: this.cart_id,
                    // coupon: this.promoCode,
                    coupon_array: this.promoArray,
                    order_delivery: this.props.navigation.state.params == undefined || (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.isDineOrder !== undefined &&
                        this.props.navigation.state.params.isDineOrder == true) ? "DineIn" : this.props.navigation.state.params.delivery_status,
                    latitude: this.props.navigation.state.params == undefined ? this.latitude : this.props.navigation.state.params.latitude,
                    longitude: this.props.navigation.state.params == undefined ? this.longitude : this.props.navigation.state.params.longitude,
                    is_wallet_applied: this.state.walletApplied ? 1 : 0,
                    earning_points: this.wallet_money,
                    driver_tip: this.tip !== 0 && this.isCustom ? this.tip : "",
                    tip_percent_val: this.tip !== 0 && !this.isCustom ? this.tip : "",
                    is_creditcard:
                        this.props.navigation.state.params !== undefined &&
                            this.props.navigation.state.params.payment_option !== undefined &&
                            this.props.navigation.state.params.payment_option !== "cod" ? "yes" : "no",
                    isLoggedIn: (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "") ? 1 : 0
                }

                if (this.table_id !== undefined && this.table_id !== "")
                    objAddToCart.table_id = this.table_id

                if (this.isPreOrder == true) {
                    objAddToCart.scheduled_date = this.props.navigation.state.params.scheduled_date;
                    objAddToCart.slot_open_time = this.props.navigation.state.params.slot_open_time;
                    objAddToCart.slot_close_time = this.props.navigation.state.params.slot_close_time;

                }

                this.addToCartData = objAddToCart
                addToCart(objAddToCart, this.onSuccessAddCart, this.onFailureAddCart, this.props);
                console.log('objAddToCart',objAddToCart)
            } else {
                showValidationAlert(strings("noInternet"));
            }
        });
    }
    //#endregion
    setTipArray = (driver_tip_percentage, driver_tip, driver_tiparr) => {
        this.tipsArray = driver_tiparr.map(v => ({ value: v, selected: driver_tip_percentage == v ? true : false }))
        if (driver_tip_percentage !== undefined && driver_tip_percentage !== null && driver_tip_percentage == "") {
            this.setState({ customTip: driver_tip })
        }
    }
    //#region 

    /** PASS DATA FUNCTION */
    passCurrentData = data => {
        this.promoArray = data
        this.promoCode = data;
        this.getCartData(this.cartResponse.items);
    };
    //#endregion

    /** DELETE ONE COUPON */
    deleteCoupon = coupon_name => {
        this.promoArray = this.promoArray.filter(data => data !== coupon_name)
        this.getCartData(this.cartResponse.items);
    };
    //#endregion

    //#region 
    /** GET LIST FROM ASYNC */
    getcartDataList = () => {
        this.setState({ isLoading: true })
        if (this.props.navigation.state.params !== undefined && this.props.navigation.state.params.payment_option !== undefined) {
            this.placeOrderFromCheckout = true
        }
        getCartList(
            success => {
                this.resId = success.resId
                this.resName = success.resName
                this.content_id = success.content_id
                this.promoCode = success.coupon_name;
                this.promoArray = success.coupon_array
                this.cart_id = success.cart_id;
                this.table_id = success.table_id;
                this.state.isAsyncSync = true;
                this.cartLength = success.items.length
                this.oldItems = success.items.map(data => data.name)
                this.getCartData(success.items);
                this.setState({ isLoading: false })
            },
            emptyList => {
                this.cartResponse = { items: [] };
                this.setState({ isAsyncSync: true, isLoading: false });
                showDialogue(strings("emptyCartMsg"), [], '', () => {
                    this.props.navigation.dispatch(
                        StackActions.reset({
                            index: 0,
                            actions: [
                                NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
                            ]
                        })
                    );
                })
            },
            error => {
                this.cartResponse = { items: [] };
                this.setState({ isAsyncSync: true, isLoading: false });
                showDialogue(strings("emptyCartMsg"), [], '', () => {
                    this.props.navigation.dispatch(
                        StackActions.reset({
                            index: 0,
                            actions: [
                                NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
                            ]
                        })
                    );
                })
            }
        );
    }
    //#endregion

    navigatetoPending = () => {
        this.props.navigation.popToTop();
        this.props.navigation.navigate("PendingOrders")
    }

    //#region 
    /** UPDATE UI */
    updateUI(response) {
        this.cartResponse = response;
        this.cartResponse.price = this.cartResponse.price.filter(data => { return data.label_key !== undefined })
        if (this.cartResponse.price !== undefined && this.cartResponse.price !== null && this.cartResponse.price instanceof Array) {
            this.taxable_fields = this.cartResponse.price.filter(data => { return data.label_key !== undefined && (data.label_key.toLowerCase().includes("fee") || data.label_key.toLowerCase().includes("tax")) })
            let taxable_fields = this.taxable_fields
            this.cartResponse.price = this.cartResponse.price.filter(function (data) {
                return !taxable_fields.includes(data);
            });
            let total_taxes = 0
            if (taxable_fields.length !== 0) {
                taxable_fields.map(data => {
                    total_taxes = total_taxes + Number(data.value)
                })
            }
            this.cartResponse.price.splice(
                this.cartResponse.price.length - 1, 0, {
                label: strings("taxes&Fees"),
                value: total_taxes.toFixed(2),
                label_key: "Tax and Fee",
                showToolTip: true
            }
            )
        }
        this.cart_id = response.cart_id;
        this.table_id = response.table_id;
        this.cartLength_updated = response.items.length
        this.cartTotal = response.subtotal

        if (response.unpaid_orders == "1")
            this.is_unpaid = true
        else
            this.is_unpaid = false

        if (response.unpaid_orders_status == "1")
            this.unpaid_orders_status = false
        else
            this.unpaid_orders_status = true

        // FEATURED ITEMS TO BE SHOWN
        if (response.menu_suggestion !== undefined && response.menu_suggestion !== null && response.menu_suggestion.length !== 0) {
            let featured_items = response.menu_suggestion
            this.featured_items = response.menu_suggestion
            this.featured_items.map(data => {
                this.featured_items_image.push({ "image": data.image })
            })
            this.featured_items = featured_items.filter(data => { return !response.items.map(itemToIterate => itemToIterate.menu_id).includes(data.menu_id) })
        } else {
            this.featured_items = []
        }


        if (this.cartLength_updated !== 0 && this.cartLength !== this.cartLength_updated) {
            let newItems = response.items.map(data => data.name)
            this.removedItems = this.oldItems.filter(item_name => !newItems.includes(item_name))
            showValidationAlert(strings("cartUpdated"))
        }

        var updatedCart = {
            resId: this.resId,
            content_id: this.content_id,
            items: response.items,
            coupon_name: response.coupon_name,
            cart_id: response.cart_id,
            table_id: response.table_id,
            resName: this.resName,
            coupon_array: response.coupon_array
        };

        saveCartData(updatedCart, success => { }, fail => { });
        if (response.items.length == 0) {
            this.props.saveCartCount(0);
            clearCurrency_Symbol(onSuccess => { }, onfailure => { })
            clearCartData(
                response => {
                },
                error => { }
            );
            if (this.cartLength !== 0) {
                showDialogue(strings("itemsUnavailable"), [], strings("appName"), () => {
                    this.props.navigation.dispatch(
                        StackActions.reset({
                            index: 0,
                            actions: [
                                NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
                            ]
                        })
                    );
                })
            }
            else {
                this.props.navigation.dispatch(
                    StackActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
                        ]
                    })
                );
            }
        } else {
            if (this.forCartFetch) {
                if (this.totalPrice == response.total)
                    this.onCheckOutEventHandler()
                else
                    showDialogue(
                        strings('cartUpdatedPrice'),
                        [{ text: strings('placeOrder'), onPress: this.onCheckOutEventHandler, buttonColor: EDColors.offWhite }],
                        '',
                        () => { }
                        ,
                        strings('reviewCart'),
                        true
                    );
            }
            this.forCartFetch = false
            this.totalPrice = response.total
            this.updateCount(response.items)
        }
    }
    //#endregion

    updateCount(data) {
        var count = 0;
        data.map((item, index) => {
            count = count + item.quantity;
        });
        this.props.saveCartCount(count);

    }
}

export default connect(
    state => {
        return {
            userID: state.userOperations.userIdInRedux,
            token: state.userOperations.phoneNumberInRedux,
            cartCount: state.checkoutReducer.cartCount,
            lan: state.userOperations.lan,
            currency: state.checkoutReducer.currency_symbol,
            table_id: state.userOperations.table_id,
            res_id: state.userOperations.res_id,
            checkoutDetail: state.checkoutReducer.checkoutDetail,
            phoneNumberInRedux: state.userOperations.phoneNumberInRedux,
            social_media_id: state.userOperations.social_media_id,
            minOrderAmount: state.userOperations.minOrderAmount,
            guestDetails: state.checkoutReducer.guestDetails,
            guestAddress: state.checkoutReducer.guestAddress,
            countryArray: state.userOperations.countryArray,
            email: state.userOperations.email,
        };
    },
    dispatch => {
        return {
            saveCheckoutDetails: checkoutData => {
                dispatch(saveCheckoutDetails(checkoutData));
            },
            saveCartCount: data => {
                dispatch(saveCartCount(data));
            },
            saveIsCheckoutScreen: data => {
                dispatch(saveIsCheckoutScreen(data));
            },
            saveCartPrice: data => {
                dispatch(saveCartPrice(data));
            }
        };
    }
)(CheckOutContainer);

export const style = StyleSheet.create({
    priceContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        margin: 10,
        paddingBottom: 10,
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    themeButton: {
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
    themeButtonText: {
        color: EDColors.white,
        textAlign: 'center',
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(17),
    },
    checkoutButtonView: {
        alignSelf: 'center',
        borderRadius: 16,
        alignSelf: 'center',
        backgroundColor: EDColors.primary,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        height: heightPercentageToDP('6%')
    },
    disclaimer: { color: EDColors.black, fontSize: getProportionalFontSize(13), marginVertical: 5, marginHorizontal: 5, fontFamily: EDFonts.regular, },
    checkoutText: {
        color: "#fff",
        fontSize: 16,
        fontFamily: EDFonts.medium
    },
    title: {
        fontFamily: EDFonts.semibold,
        color: "#000",
        fontSize: getProportionalFontSize(16),

    },
    walletText: {
        fontFamily: EDFonts.medium,
        color: "#000",
        fontSize: getProportionalFontSize(14),
        marginTop: 10,
        marginHorizontal: 10,
        marginBottom: 5
    },
    customTipInput: { textAlign: "center", textAlignVertical: "center", marginHorizontal: 10, fontSize: getProportionalFontSize(14) },
    divider: {
        marginVertical: 5,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: EDColors.radioSelected,
        height: 1,
        fontFamily: EDFonts.regular
    },
    discountIcon: {
        alignSelf: "center",
        marginVertical: 20,
        marginHorizontal: 5
    },
    promoCode: {
        alignSelf: "center",
        color: EDColors.blackSecondary,
        fontFamily: EDFonts.medium,
        fontSize: 14,
        marginVertical: 20,
        marginHorizontal: 5
    },
    checkOutContainer: {
        margin: 10,
        // borderRadius: 6,
        alignItems: 'center',
        // backgroundColor: "#fff"
    },
    totalPrice: {
        flex: 1,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(14),
        marginHorizontal: 10
    },
    roundButton: {
        // alignSelf: "center",
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
    cartResponseView: {
        borderRadius: 16,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: "#fff",

    },
    cartResponse: {
        // flexDirection: "row",
        alignItems: "center",
        padding: 5,
    },
    featuredProductView: {
        flex: 1,
        width: '100%',
        marginHorizontal: 10
    },
    cartResponseTextStyle: {
        // flex: 1,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(16),
        alignSelf: "center",
        color: EDColors.black,
        textAlign: "center",
        marginHorizontal: 10,
        // height: 22,
        marginVertical: 4,
    },
    walletContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginVertical: 15,
        justifyContent: "space-between",
        alignItems: "center",
        marginHorizontal: 10,
        paddingRight: 10,
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
        elevation: 2,
    },
    priceBold: {
        fontFamily: EDFonts.bold,
        fontSize: getProportionalFontSize(14),
        color: EDColors.black,
    },
    addBtn: {
        // flex: 1,
        padding: 5,
        borderRadius: 6,
        backgroundColor: EDColors.primary,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: EDColors.white,
        width: metrics.screenWidth * .30 - 10,
        marginBottom: 5,
        marginHorizontal: 5
    },
    price: {
        fontFamily: EDFonts.regular,
        marginHorizontal: 5,
        marginVertical: 5
    },
    priceDetailView: {},
    priceLabel: { fontFamily: EDFonts.medium, fontSize: 14, color: EDColors.black, marginVertical: 2, marginHorizontal: 10 },
    alsoOrderedText: { color: EDColors.black, fontFamily: EDFonts.semiBold, fontSize: 16, marginTop: 10, marginHorizontal: 10, marginBottom: 5 },
    featuredtitle: {
        fontSize: getProportionalFontSize(14),
        fontFamily: EDFonts.bold,
        marginHorizontal: 5,
        marginTop: 5,
        color: EDColors.black
    },
    addMoreText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(16),
        alignSelf: 'center',
        backgroundColor: EDColors.white,
        borderRadius: 14,
        padding: 10,
        paddingVertical: 15,
        width: metrics.screenWidth - 40,
        flex: 1,
        marginHorizontal: 10,
        textAlign: 'center',
        color: EDColors.black,
        borderColor: EDColors.separatorColorNew,
        borderWidth: 1,
        textAlignVertical: "center"
    },
});
