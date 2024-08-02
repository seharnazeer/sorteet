import Moment from 'moment';
import React from 'react';
import { BackHandler, Keyboard, Platform, StyleSheet, Text, View } from 'react-native';
import { CreditCardInput } from "react-native-credit-card-input";
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as RNLocalize from "react-native-localize";
import { initialWindowMetrics } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { connect } from 'react-redux';
import Assets from '../assets';
import EDRTLText from '../components/EDRTLText';
import EDRTLView from '../components/EDRTLView';
import { strings } from '../locales/i18n';
import { saveCartCount, saveCheckoutDetails } from '../redux/actions/Checkout';
import { saveResIDInRedux, saveTableIDInRedux, saveWalletMoneyInRedux } from '../redux/actions/User';
import { clearCartData } from '../utils/AsyncStorageHelper';
import { showDialogue, showDialogueNew, showNoInternetAlert, showPaymentDialogue, showValidationAlert } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { CARD_BRANDS, debugLog, getProportionalFontSize, GOOGLE_API_KEY, isRTLCheck, RESPONSE_SUCCESS, RETURN_URL } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import { getCountryName } from '../utils/LocationServiceManager';
import metrics from '../utils/metrics';
import { netStatus } from '../utils/NetworkStatusConnection';
import { addNewCard, addOrder, checkCardPayment, createPaymentMethod, driverTipAPI, rechargeWalletAPI } from '../utils/ServiceManager';
import BaseContainer from './BaseContainer';

class StripePaymentContainer extends React.Component {

    checkoutDetail = this.props.checkoutDetail
    txn_id = undefined

    order_delivery = this.props.checkoutDetail.order_delivery
    isForPending = this.props.navigation.state.params.isPending || false
    pendingTotal = this.props.navigation.state.params.pendingTotal || 0
    isPendingAdded = this.props.navigation.state.params.isPendingAdded || false
    pendingTotalPayment = this.props.navigation.state.params.pendingTotalPayment || 0
    tip_percent_val = this.props.navigation.state.params.tip_percent_val || ""
    isCustom = this.props.navigation.state.params.isCustom || false
    isWithSavedCard = this.props.navigation.state.params.isWithSavedCard || false
    isForSelection = this.props.navigation.state.params.isForSelection || false
    isForEditing = this.props.navigation.state.params.isForEditing || false
    selectedCard = this.props.navigation.state.params.selectedCard || {}
    promoObj = this.props.navigation.state.params.promoObj || {}
    extra_comment = this.props.navigation.state.params.extra_comment
    oldOrderID = this.props.navigation.state.params.order_id
    currecy_code = this.props.navigation.getParam("currency_code")
    paymentDetails = this.props.paymentDetails
    completeAddress = this.props.navigation.state.params.completeAddress || {}
    cardCount = this.props.navigation.state.params.cardCount || 0

    selectedCountry = undefined
    isForTip =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.isForTip : false
    isForRecharge =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.isForRecharge : false
    //#region  STATE 
    state = {
        isLoading: false,
        isCardCheckLoading: false,
        cardError: "",
        payment_method: '',
        payment_intent: '',
        url: undefined,
        isPaymentLoading: false,
        backPressed: false,
        countryCode: undefined,
        isCardSave: false,
        isDefaultCard: false
    }



    //#region LIFE CYCLE 

    componentDidMount = () => {
        if (this.backHandler)
            this.backHandler.remove()
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
        // if (this.order_delivery == "Delivery") {
        if (this.isForSelection)
            getCountryName(this.completeAddress.latitude, this.completeAddress.longitude,
                success => {
                    if (success[0].short_name !== undefined)
                        this.setState({ countryCode: success[0].short_name })

                },
                failure => {
                    debugLog("COUNTRY CODE FAILURE :::::", failure)
                }
                , this.props.googleMapKey || GOOGLE_API_KEY)
        if (!this.isForSelection && !this.isForEditing) {
            this.setState({
                countryCode: this.props.countryArray !== undefined &&
                    this.props.countryArray !== null &&
                    this.props.countryArray.length !== 0 ?
                    this.props.countryArray.map(data => data.iso)[0] : undefined
            })

        }
        if (this.isForEditing) {
            if (this.creditcardRef !== undefined && this.creditcardRef !== null) {
                this.creditcardRef.setValues({
                    number: this.selectedCard.card.last4,
                    expiry: this.selectedCard.card.exp_month.toString().padStart(2, '0') + this.selectedCard.card.exp_year.toString().slice(-2),
                    postalCode: this.selectedCard.billing_details.address.postal_code || "",
                    type: this.selectedCard.card.brand == CARD_BRANDS.visa ? "visa" :
                        this.selectedCard.card.brand == CARD_BRANDS.mastercard ? "master-card" :
                            this.selectedCard.card.brand == CARD_BRANDS.amex ? "american-express" : "default"
                });
                this.selectedCountry = this.selectedCard.billing_details.address.country !== undefined &&
                    this.selectedCard.billing_details.address.country !== null ?
                    this.selectedCard.billing_details.address.country :
                    (this.props.countryArray !== null &&
                        this.props.countryArray.length !== 0 ?
                        this.props.countryArray.map(data => data.iso)[0] : undefined)
                this.setState({
                    isDefaultCard: this.selectedCard.is_default_card == "1",
                    countryCode:
                        this.selectedCard.billing_details.address.country !== undefined &&
                            this.selectedCard.billing_details.address.country !== null ?
                            this.selectedCard.billing_details.address.country :
                            (this.props.countryArray !== null &&
                                this.props.countryArray.length !== 0 ?
                                this.props.countryArray.map(data => data.iso)[0] : undefined)
                })
            }
        }
        else if (this.isWithSavedCard) {
            this.startPayment()
        }
        // }

    }
    componentWillUnmount() {
        this.backHandler.remove()
    }

    handleBackPress = () => {

        this.navigateToBack()
        return true
    }

    toggleCardSave = () => {
        this.setState({ isCardSave: !this.state.isCardSave })
    }

    toggleCardDefault = () => {
        this.setState({ isDefaultCard: !this.state.isDefaultCard })
    }



    /** YES ON CONFIRMATION DIALOGUE */
    onYesClick = () => {
        this.props.navigation.goBack()
    }

    /** NO ON CONFIRMATION DIALOGUE */
    onNoClick = () => {
    }

    //#endregion

    // #NAVIGATIO TO BACK CONTAINER
    navigateToBack = () => {
        Keyboard.dismiss();
        if (!this.isForEditing)
            showPaymentDialogue(
                this.isForSelection ? strings('stopPayment') : strings("confirmAddCard"),
                [{ text: strings('dialogYes'), onPress: this.onYesClick },
                { text: strings('dialogNo'), onPress: this.onNoClick, isNotPreferred: true }],
                strings('warning'),
            );
        else
            this.onYesClick()
    };

    /**
     * On Credit card input
     */
    onCCInput = (data) => {
        this.isCardError = false
        this.isExpiryError = false
        this.isCVCError = false
        this.isCountryError = false
        this.isPostalError = false

        this.setState({ cardError: "" })
        this.cardData = data
    }

    validateCard = () => {
        if (this.cardData !== undefined) {
            if (this.isForEditing || this.cardData.status.number == "valid") {
                if (this.cardData.status.expiry == "valid") {
                    if (this.isForEditing || this.cardData.status.cvc == "valid") {
                        if (this.selectedCountry !== undefined || this.state.countryCode !== undefined) {
                            if (this.cardData.status.postalCode == "valid") {
                                this.isCardError = false
                                this.isExpiryError = false
                                this.isCVCError = false
                                this.isCountryError = false
                                this.isPostalError = false
                                this.setState({ cardError: "" })
                                console.log("Valid Card")
                                this.isForSelection ?
                                    this.startPayment() :
                                    this.saveCard()
                            }
                            else {
                                this.isPostalError = true
                                this.setState({ cardError: strings("invalidPostal") })
                            }
                        }
                        else {
                            this.isCountryError = true
                            this.setState({ cardError: strings("noCountry") })
                        }
                    }
                    else {
                        this.isCVCError = true
                        console.log("Invalid CVC")
                        this.setState({ cardError: strings("invalidCVC") })
                    }
                }
                else {
                    this.isExpiryError = true
                    console.log("Invalid expiry date", this.state.cardError)
                    this.setState({ cardError: strings("invalidExpiry") })
                }
            }
            else {
                this.isCardError = true
                console.log("Invalid card number")
                this.setState({ cardError: this.cardData.values.number == '' ? strings("nocardData") : strings("invalidCard") })
            }
        }
        else {
            this.isCardError = true
            this.setState({ cardError: strings("nocardData") })
        }
    }

    saveCard = () => {
        netStatus(
            status => {
                if (status) {
                    this.setState({ isLoading: true })
                    var params = {}
                    if (this.isForEditing) {
                        params = {
                            is_default_card: this.state.isDefaultCard ? 1 : 0,
                            isForEditing: this.isForEditing,
                            country_code: this.state.countryCode || this.selectedCountry.cca2,
                            language_slug: this.props.lan,
                            exp_month: this.cardData.values.expiry.substring(0, 2),
                            exp_year: this.cardData.values.expiry.substring(3, 5),
                            user_id: this.props.UserID,
                            payment_method_id: this.selectedCard.id,
                            zipcode: this.cardData.values.postalCode,
                            isLoggedIn: this.props.UserID !== undefined && this.props.UserID !== null && this.props.UserID !== "" ? 1 : 0
                        }
                    }
                    else {
                        params = {
                            is_default_card: this.cardCount == 0 || (this.state.isDefaultCard ? 1 : 0),
                            country_code: this.state.countryCode || this.selectedCountry.cca2,
                            language_slug: this.props.lan,
                            exp_month: this.cardData.values.expiry.substring(0, 2),
                            exp_year: this.cardData.values.expiry.substring(3, 5),
                            card_number: this.cardData.values.number,
                            cvc: this.cardData.values.cvc,
                            user_id: this.props.UserID,
                            zipcode: this.cardData.values.postalCode,
                            isLoggedIn: this.props.UserID !== undefined && this.props.UserID !== null && this.props.UserID !== "" ? 1 : 0
                        }
                    }
                    addNewCard(params, this.onCardSaveSuccess, this.onCardSaveFailure, this.props)
                }
                else {
                    showNoInternetAlert();
                }
            }
        )
    }

    onCardSaveSuccess = (onSuccess) => {
        if (onSuccess.status == RESPONSE_SUCCESS) {
            showDialogueNew(onSuccess.message, [], strings("appName"), () => {
                this.props.navigation.goBack();
            });
        }
        else {
            showValidationAlert(onSuccess.message)
        }
        this.setState({ isLoading: false })

    }

    onCardSaveFailure = (onFailure) => {
        showValidationAlert(onFailure.message || strings('generalWebServiceError'))
        this.setState({ isLoading: false })

    }

    /**
     * Start Payment
     */
    startPayment = () => {
        netStatus(
            status => {
                if (status) {
                    var params = {}
                    this.setState({ isLoading: true })
                    if (this.isWithSavedCard) {
                        params = {
                            language_slug: this.props.lan,
                            amount: this.isForTip ? parseFloat(this.pendingTotalPayment).toFixed(2) * 100 : ((parseFloat(this.isForPending ? this.pendingTotal : (this.isPendingAdded && this.promoObj.coupon_id == undefined ? parseFloat(this.checkoutDetail.total) + parseFloat(this.pendingTotalPayment) : this.checkoutDetail.total)).toFixed(2).toString()) * 100),
                            currency: this.currecy_code,
                            payment_method: 'stripe',
                            user_id: this.props.UserID,
                            payment_method_id: this.selectedCard.id,
                            isLoggedIn: this.props.UserID !== undefined && this.props.UserID !== null && this.props.UserID !== "" ? 1 : 0
                        }
                    } else {
                        params = {
                            language_slug: this.props.lan,
                            exp_month: this.cardData.values.expiry.substring(0, 2),
                            exp_year: this.cardData.values.expiry.substring(3, 5),
                            card_number: this.cardData.values.number,
                            cvc: this.cardData.values.cvc,
                            amount: this.isForTip ? parseFloat(this.pendingTotalPayment).toFixed(2) * 100 : ((parseFloat(this.isForPending ? this.pendingTotal : (this.isPendingAdded && this.promoObj.coupon_id == undefined ? parseFloat(this.checkoutDetail.total) + parseFloat(this.pendingTotalPayment) : this.checkoutDetail.total)).toFixed(2).toString()) * 100),
                            // amount: parseFloat(this.checkoutDetail.total),
                            currency: this.currecy_code,
                            user_id: this.props.UserID,
                            payment_method: 'stripe',
                            save_card_flag: this.state.isCardSave ? 1 : 0,
                            is_default_card: this.cardCount == 0 || (this.state.isDefaultCard ? 1 : 0),
                            country_code: this.state.countryCode || this.selectedCountry.cca2,
                            zipcode: this.cardData.values.postalCode,
                            isLoggedIn: this.props.UserID !== undefined && this.props.UserID !== null && this.props.UserID !== "" ? 1 : 0
                        }
                    }
                    createPaymentMethod(params, this.onPaymentMethodSuccess, this.onPaymentMethodFailure, this.props)
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
                showDialogue(((onSuccess.message !== undefined ? onSuccess.message : strings("paymentFail")) + "\n\n" + onSuccess.stripe_response.error.message), [], '', () => {
                    if (this.isWithSavedCard) {
                        this.onYesClick()
                    }
                })
                this.setState({ isLoading: false })

            }
            else if (onSuccess.stripe_response.status == "succeeded") {
                debugLog("Payment Sucessful without 3d secure authentication ::::::")
                this.txn_id = onSuccess.stripe_response.id;
                this.cardData = undefined
                if (this.isForTip) {
                    if (this.isForRecharge)
                        this.rechargeWallet()
                    else
                        this.payTip()
                }
                else {

                    this.addOrderData()
                }
                this.setState({ isLoading: false })
            }
            else if (onSuccess.stripe_response.next_action.redirect_to_url.url !== undefined) {
                debugLog("Redirecting for 3d secure authentication ::::::")
                this.txn_id = onSuccess.stripe_response.id;
                this.setState({ url: onSuccess.stripe_response.next_action.redirect_to_url.url, isLoading: true })
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

    /**
     * Webview Navigation change
     */
    navigationChange = (resp) => {
        // debugLog("NAVIGATION CHANGE CALLED :::::::::::", resp)
        if (resp.url.includes(RETURN_URL + "/?payment_intent")) {
            this.setState({ url: "" })
            this.checkCardPayment()
        }
    }

    checkCardPayment = () => {
        netStatus(
            status => {
                if (status) {
                    this.setState({ isCardCheckLoading: true })
                    var params = {
                        trans_id: this.txn_id,
                        lan: this.props.lan
                    }
                    checkCardPayment(params, this.onCheckCardPaymentSuccess, this.onCheckCardPaymentFailure, this.props)
                }
                else {
                    showNoInternetAlert();
                    this.setState({ isCardCheckLoading: false })
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
                showDialogue((strings("paymentFail") + "\n\n" + onSuccess.stripe_response.error.message), [], '', () => {
                    if (this.isWithSavedCard) {
                        this.onYesClick()
                    }
                })
                this.setState({ isCardCheckLoading: false })

            }
            else if (onSuccess.stripe_response.status == "succeeded") {
                debugLog("Payment Sucessful with 3d secure authentication ::::::")
                this.setState({ isPaymentLoading: true, })
                this.txn_id = onSuccess.stripe_response.id;
                this.cardData = undefined
                if (this.isForTip) {
                    if (this.isForRecharge)
                        this.rechargeWallet()
                    else
                        this.payTip()
                }

                else {

                    this.addOrderData()
                }
            }
            else {
                debugLog("PAYMENT FAILED ::::")
                this.cardData = undefined
                showDialogue(strings("paymentFail"), [], '', () => {
                    if (this.isWithSavedCard) {
                        this.onYesClick()
                    }
                });
                this.setState({ isCardCheckLoading: false })
            }
        } else {
            this.setState({ isCardCheckLoading: false })
            showDialogue(strings("paymentFail"), [], '', () => {
                if (this.isWithSavedCard) {
                    this.onYesClick()
                }
            });
        }
    }
    /**
     * On check card payment failure
     */
    onCheckCardPaymentFailure = (onFailure) => {
        debugLog("FAILURE :::::", onFailure)
        showDialogue((strings("paymentFail") + "\n\n" + (onSuccess.stripe_response.error !== undefined ? onSuccess.stripe_response.error.message : "")), [], '', () => {
            if (this.isWithSavedCard) {
                this.onYesClick()
            }
        });
        this.setState({ isLoading: false, isCardCheckLoading: false })
    }


    /**
     *
     * @param {The success response object} objSuccess
     */
    onAddOrderSuccess = objSuccess => {
        debugLog('OBJ SUCCESS ADDORDER :: ' + JSON.stringify(objSuccess));
        this.resObj = objSuccess.restaurant_detail
        this.props.saveWalletMoney(objSuccess.wallet_money)

        if (this.isPendingAdded)
            this.updatePendingOrders()
        else {
            clearCartData(
                () => {
                    if (this.order_delivery == "DineIn") {
                        this.props.saveTableID(undefined);
                        this.props.saveResID(undefined);
                    }
                    this.backHandler.remove()
                    this.props.navigation.popToTop();
                    this.props.navigation.navigate("OrderConfirm", { isForDineIn: this.order_delivery == "DineIn" ? true : false, resObj: objSuccess.restaurant_detail, navigateToOrder: true, cashback: objSuccess.earned_wallet_money });
                },
                () => {
                    this.setState({
                        isLoading: false,
                        isCardCheckLoading: false
                    });
                },
            );
        }
    };

    /**
     *
     * @param {The success response object} objSuccess
     */
    onAddOrderFailure = objFailure => {
        this.setState({ isLoading: false, isCardCheckLoading: false });
        debugLog('OBJ FAILURE ADDORDER :: ', objFailure);
        showDialogue(objFailure.message, [], '', () => { });
    };

    /**
     *
     * @param {The call API for create a order}
     */

    addOrderData = () => {
        netStatus(isConnected => {
            if (isConnected) {
                var objaddOrderParams = this.props.checkoutDetail;
                objaddOrderParams.items = this.props.checkoutDetail.items;
                objaddOrderParams.transaction_id = this.txn_id;
                if (this.extra_comment !== undefined && this.extra_comment !== null)
                    objaddOrderParams.extra_comment = this.extra_comment
                if (this.oldOrderID !== undefined && this.oldOrderID !== null)
                    objaddOrderParams.order_id = this.oldOrderID
                objaddOrderParams.order_date = Moment(new Date().toLocaleString('en-US', {
                    timeZone: RNLocalize.getTimeZone()
                })).format('DD-MM-YYYY hh:mm A');
                objaddOrderParams.payment_option = 'stripe'

                objaddOrderParams.isLoggedIn = this.props.UserID !== undefined && this.props.UserID !== null && this.props.UserID !== "" ? 1 : 0

                if (this.props.UserID == undefined || this.props.UserID == null || this.props.UserID == "") {
                    objaddOrderParams.first_name = this.props.guestDetails.first_name
                    objaddOrderParams.last_name = this.props.guestDetails.last_name
                    objaddOrderParams.phone_number = this.props.guestDetails.phone_number
                    objaddOrderParams.phone_code = this.props.guestDetails.phone_code
                    objaddOrderParams.email = this.props.guestDetails.email

                    if (this.order_delivery == "Delivery") {
                        objaddOrderParams.address_input = this.props.guestAddress.address
                        objaddOrderParams.landmark = this.props.guestAddress.landmark
                        objaddOrderParams.latitude = this.props.guestAddress.latitude
                        objaddOrderParams.longitude = this.props.guestAddress.longitude
                        objaddOrderParams.zipcode = this.props.guestAddress.zipcode
                        objaddOrderParams.city = this.props.guestAddress.city
                        objaddOrderParams.state = this.props.guestAddress.state
                        objaddOrderParams.country = this.props.guestAddress.country
                        objaddOrderParams.address_label = this.props.guestAddress.address_label
                        objaddOrderParams.business = this.props.guestAddress.business
                    }
                }
                this.setState({ isLoading: true });
                addOrder(
                    objaddOrderParams,
                    this.onAddOrderSuccess,
                    this.onAddOrderFailure,
                    this.props,
                    true
                );
            } else {
                showNoInternetAlert();
            }
        });
    };

    
    rechargeWallet = () => {

        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true })
                let walletParams = {
                    language_slug: this.props.lan,
                    user_id: this.props.UserID,
                    transaction_id: this.txn_id,
                    amount: parseFloat(this.pendingTotalPayment).toFixed(2)
                }
                rechargeWalletAPI(walletParams, this.onSucessWalletRechage, this.onFailureWalletRecharge, this.props)
            }
            else
                showValidationAlert(strings("noInternet"));
        })

    }


    onSucessWalletRechage = onSuccess => {
        this.setState({ isLoading: false, isCardCheckLoading: false });
        if (onSuccess.status == RESPONSE_SUCCESS) {
            showDialogue(strings("walletRechargeSuccess"), [], "", () => {
                this.props.navigation.navigate("myWalletContainer")
            })
        }
        else {
            showValidationAlert(onSuccess.message || strings("generalWebServiceError"))

        }
    }

    onFailureWalletRecharge = (onfailure) => {
        this.setState({ isLoading: false, isCardCheckLoading: false });
        showValidationAlert(onfailure.message || strings("generalWebServiceError"))
    }


    payTip = () => {
        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true });
                let tipParams = {
                    language_slug: this.props.lan,
                    user_id: this.props.UserID,
                    order_id: this.oldOrderID,
                    transaction_id: this.txn_id,
                    driver_tip: this.pendingTotalPayment,
                    tip_percent_val: !this.isCustom ? this.tip_percent_val : '',
                    payment_option: "stripe"

                }
                driverTipAPI(tipParams, this.onSuccessTip, this.onFailureTip, this.props)
            } else {
                showValidationAlert(strings("noInternet"));
            }
        });
    }

    onSuccessTip = onSuccess => {
        this.setState({ isLoading: false, isCardCheckLoading: false });
        if (onSuccess.status == RESPONSE_SUCCESS) {
            showDialogue(onSuccess.message, [], '', () => {
                this.props.navigation.popToTop();
                this.props.navigation.navigate("Home");
            })
        }
        else {
            showValidationAlert(onSuccess.message || strings("generalWebServiceError"))

        }
    }

    onFailureTip = (onfailure) => {
        this.setState({ isLoading: false, isCardCheckLoading: false });
        showValidationAlert(onfailure.message || strings("generalWebServiceError"))
    }

    myValidatePostalCode(postalCode) {
        return postalCode.match(/^\d{5,6}$/) ? "valid" :
            postalCode.length > 6 ? "invalid" :
                "incomplete";
    }

    onCountrySelect = country => {
        this.isCountryError = false
        this.selectedCountry = country
        this.setState({ cardError: '', countryCode: undefined })
    }

    //#region  Render
    render() {
        return (
            <BaseContainer title={
                this.isForEditing ? strings("editCard") :
                    this.isForSelection ?
                        strings('paymentGateway') : strings("addCard")}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={this.navigateToBack}
                loading={this.state.isLoading || this.state.isCardCheckLoading}
            >
                {/* <NavigationEvents onWillBlur={this.onBlurPaymentGateway} /> */}
                <View style={styles.mainContainer} pointerEvents={this.state.isLoading || this.state.isCardCheckLoading ? "none" : "auto"}>
                    {this.state.url !== undefined && this.state.url.trim().length !== 0 ?
                        <WebView
                            onLoad={() => this.setState({ isLoading: false })}
                            // onLoadStart={() => this.setState({ isLoading: false })}
                            style={{ width: "100%", height: "100%" }}
                            source={{ uri: this.state.url }}
                            javaScriptEnabled={true}
                            allowsBackForwardNavigationGestures={true}
                            onNavigationStateChange={this.navigationChange}
                        /> :
                        (!this.state.isCardCheckLoading ?
                            (this.isWithSavedCard ? null :
                                <View style={styles.cardContainer}>
                                    <KeyboardAwareScrollView contentContainerStyle={{ flexGrow: 1 }}>
                                        <View style={styles.card}>
                                            <CreditCardInput
                                                ref={ref => this.creditcardRef = ref}
                                                autoFocus={false}
                                                onChange={this.onCCInput}
                                                cardFontFamily={EDFonts.regular}
                                                cardImageFront={Assets.card_front}
                                                cardImageBack={Assets.card_back}
                                                errorMessage={this.state.cardError}
                                                isCardError={this.isCardError}
                                                isExpiryError={this.isExpiryError}
                                                isCVCError={this.isCVCError}
                                                isPostalError={this.isPostalError}
                                                isCountryError={this.isCountryError}
                                                onCountrySelect={this.onCountrySelect}
                                                requiresPostalCode
                                                requiresCVC={!this.isForEditing}
                                                // requiresCountry={this.order_delivery == "Delivery"}
                                                requiresCountry={true}
                                                dialCode={this.state.countryCode}
                                                isReadOnly={this.isForEditing}
                                                validatePostalCode={this.myValidatePostalCode}
                                                countryData={this.props.countryArray}
                                                expiryStyle={this.isForEditing ? { width: metrics.screenWidth - 40 } : {}}
                                                selectionColor={EDColors.primary}
                                            />

                                            {/* {this.state.cardError !== "" ?
                                    <EDRTLText style={styles.cardError}
                                        title={this.state.cardError}
                                    /> : null} */}
                                            {this.props.UserID !== undefined && this.props.UserID !== null && this.props.UserID !== "" && this.isForSelection ?
                                                <TouchableOpacity onPress={this.toggleCardSave} activeOpacity={1}>
                                                    <EDRTLView style={{ alignItems: 'center', marginTop: 20 }}>
                                                        <Icon name={this.state.isCardSave ? "check-square-o" : "square-o"}
                                                            color={EDColors.primary}
                                                            size={20}
                                                            type="font-awesome"
                                                        />
                                                        <EDRTLText title={strings("askSaveCard")} style={{ fontFamily: EDFonts.medium, color: EDColors.black, marginHorizontal: 7.5, flex: 1, fontSize: getProportionalFontSize(15) }} />
                                                    </EDRTLView>
                                                </TouchableOpacity> : null}
                                            {this.props.UserID !== undefined && this.props.UserID !== null && this.props.UserID !== "" && this.cardCount !== 0 ?
                                                this.selectedCard.is_default_card == "1" ?
                                                    <EDRTLText title={strings("defaultCard")} style={{ fontFamily: EDFonts.regular, color: EDColors.textNew, marginHorizontal: 5, fontSize: getProportionalFontSize(14), marginTop: 10 }} />
                                                    :
                                                    <TouchableOpacity onPress={this.toggleCardDefault} activeOpacity={1}>
                                                        <EDRTLView style={{ alignItems: 'center', marginTop: 20 }}>
                                                            <Icon name={this.state.isDefaultCard ? "check-square-o" : "square-o"}
                                                                color={EDColors.primary}
                                                                size={20}
                                                                type="font-awesome"
                                                            />
                                                            <EDRTLText title={strings("setDefaultCard")} style={{ fontFamily: EDFonts.medium, color: EDColors.black, marginHorizontal: 7.5, flex: 1, fontSize: getProportionalFontSize(15) }} />
                                                        </EDRTLView>
                                                    </TouchableOpacity> : null}
                                        </View>
                                    </KeyboardAwareScrollView>
                                    <EDRTLView style={[styles.checkOutContainer, {
                                        marginBottom: Platform.OS == "ios" ? initialWindowMetrics.insets.bottom : 0
                                    }]}>
                                        <EDRTLText style={styles.totalPrice} title={
                                            this.isForSelection ?
                                                (this.props.currencySymbol +
                                                    (this.isForTip ?
                                                        parseFloat(this.pendingTotalPayment).toFixed(2).toString() :
                                                        (parseFloat(this.isForPending ? this.pendingTotal :
                                                            (this.isPendingAdded && this.promoObj.coupon_id == undefined ?
                                                                parseFloat(this.checkoutDetail.total) + parseFloat(this.pendingTotalPayment)
                                                                : this.checkoutDetail.total)).toFixed(2).toString()))) : ''
                                            // this.checkoutDetail !== undefined
                                            // ? this.props.currencySymbol + funGetFrench_Curr(this.checkoutDetail.total, 1, this.props.lan)
                                            // : ''
                                        } />
                                        <TouchableOpacity
                                            style={styles.roundButton}
                                            onPress={this.validateCard}>
                                            <Text style={styles.button}>{
                                                this.isForSelection ?
                                                    strings('payNow') : strings('save')}</Text>
                                        </TouchableOpacity>
                                    </EDRTLView>
                                </View>) : null)
                    }

                </View>

            </BaseContainer>
        )
    }

    //#endregion
}

//#region  StyleSheet

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: EDColors.white
        // padding: 10,
        // justifyContent: "center"
    },
    roundButton: {
        alignSelf: "center",
        margin: 10,
        backgroundColor: EDColors.primary,
        borderRadius: 16,
        paddingHorizontal: 30
    },
    button: {
        paddingTop: 10,
        paddingRight: 20,
        paddingLeft: 20,
        paddingBottom: 10,
        color: "#fff",
        fontFamily: EDFonts.regular
    },
    cardContainer: {
        flex: 1,
        // marginTop: 30,
        justifyContent: "space-between"
    },
    card: {
        padding: 20,
        paddingTop: 10
    },
    cardError: {
        fontFamily: EDFonts.regular,
        color: EDColors.error,
        fontSize: getProportionalFontSize(12),
        marginHorizontal: 20,
        marginTop: 10
    },
    checkOutContainer: {
        marginTop: 10,
        marginLeft: 10,
        marginRight: 10,
        marginBottom: 0,
        borderRadius: 6,
        alignSelf: "flex-end",
        backgroundColor: "#fff"
    },
    totalPrice: {
        flex: 1,
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(16),
        alignSelf: "center",
        marginHorizontal: 10,
        color: "#000"
    },
})
//#endregion

//#region REDUX
export default connect(
    state => {
        return {
            currencySymbol: state.checkoutReducer.currency_symbol,
            lan: state.userOperations.lan,
            UserID: state.userOperations.userIdInRedux,
            checkoutDetail: state.checkoutReducer.checkoutDetail,
            guestDetails: state.checkoutReducer.guestDetails,
            guestAddress: state.checkoutReducer.guestAddress,
            countryArray: state.userOperations.countryArray,
            googleMapKey: state.userOperations.googleMapKey

        };
    },
    dispatch => {
        return {
            saveCartCount: data => {
                dispatch(saveCartCount(data));
            },
            saveWalletMoney: token => {
                dispatch(saveWalletMoneyInRedux(token))
            },
            saveTableID: table_id => {
                dispatch(saveTableIDInRedux(table_id))
            },
            saveResID: table_id => {
                dispatch(saveResIDInRedux(table_id))
            },
            saveCheckoutDetails: checkoutData => {
                dispatch(saveCheckoutDetails(checkoutData));
            },
        };
    },
)(StripePaymentContainer);
//#endregion