import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, RefreshControl, TouchableOpacity, Clipboard } from 'react-native'
import { connect } from 'react-redux';
import { debugLog, RESPONSE_SUCCESS, funGetDateStr, boldify, isRTLCheck, getProportionalFontSize, TextFieldTypes, API_PAGE_SIZE } from '../utils/EDConstants';
import BaseContainer from './BaseContainer';
import { strings, isRTL } from '../locales/i18n';
import { NavigationActions, NavigationEvents, StackActions } from 'react-navigation';
import { showDialogue } from '../utils/EDAlert';
import { netStatus } from '../utils/NetworkStatusConnection';
import { getWalletHistoryAPI, rechargeWalletAPI, rechargeWalletCashTrfAPI } from '../utils/ServiceManager';
import { EDColors } from '../utils/EDColors';
import { EDFonts } from '../utils/EDFontConstants';
import { Icon } from 'react-native-elements';
import EDPlaceholderComponent from '../components/EDPlaceholderComponent';
import { Spinner } from 'native-base';
import { saveWalletMoneyInRedux } from '../redux/actions/User';
import Assets from '../assets';
import metrics from '../utils/metrics';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import EDPopupView from '../components/EDPopupView';
import EDRTLText from '../components/EDRTLText';
import Share from "react-native-share";
import Toast, { DURATION } from "react-native-easy-toast";
import { saveNavigationSelection } from '../redux/actions/Navigation';
import EDRTLView from '../components/EDRTLView';
import EDEarnMoreComponent from '../components/EDEarnMoreComponent';
import EDButton from '../components/EDButton';
import { TextInput } from 'react-native';
import EDRTLTextInput from '../components/EDRTLTextInput';
import { Paystack, paystackProps } from 'react-native-paystack-webview';
import EDCashTrfComponent from '../components/EDCashTrfComponent';
import WalletPaymentSelectionComponent from '../components/WalletPaymentSelectionComponent'
import { color } from 'react-native-reanimated';

class MyWalletContainer extends React.Component {
    paystackWebViewRef = React.createRef(paystackProps.PayStackRef);
    shouldLoadMore = false
    refreshing = false
    current_balance = undefined
    total_credited = undefined

    //State
    state = {
        isLoading: false,
        moreLoading: false,
        arrayTransactions: undefined,
        earningModal: false,
        rechargePopUp: false,
        rechargeAmount: "",
        cashTrfModal: false,
        cashTrfModal2: false,
        selectedBank: '',
        amount: '',
        trans_id: '',
        description: '',
    }

    handlePaymentMethodSelection = (paymentMethod) => {
        this.setState({ selectedPaymentMethod: paymentMethod });
    }

    handleProceed = () => {
        // Proceed button logic
        console.log("Proceed button pressed!");
    }

    /**
     * On did focus wallet container
     */
    onDidFocusWalletContainer = () => {
        this.props.saveNavigationSelection("Wallet");
        if (this.props.userID !== "" && this.props.userID !== undefined && this.props.userID !== null) {
            this.setState({ arrayTransactions: undefined, rechargeAmount: '' })
            this.getWalletHistory()
        } else {
            showDialogue(strings("loginValidation"), [], strings("appName"), () => {
                this.props.navigation.navigate("LoginContainer")
                // this.props.navigation.dispatch(
                //     StackActions.reset({
                //         index: 0,
                //         actions: [
                //             NavigationActions.navigate({ routeName: "LoginContainer" })
                //         ]
                //     })
                // );
            });
        }
    }

    onDidBlurHandler = () => {
        this.shouldLoadMore = false
        this.state.arrayTransactions = undefined
        this.strOnScreenMessage = ''
        this.strOnScreenSubtitle = ''
    }
    /**
     * Get Wallet Historey
     */
    getWalletHistory = (isForRefresh) => {
        if (this.state.isLoading) {
            return;
        }
        this.strOnScreenMessage = ''
        this.strOnScreenSubtitle = ''
        netStatus(isConnected => {
            if (isConnected) {
                this.setState({ isLoading: true });

                let param = {
                    language_slug: this.props.lan,
                    user_id: parseInt(this.props.userID) || 0,
                    // token: this.props.userToken,
                    count: API_PAGE_SIZE,
                    page_no: (this.state.arrayTransactions && !isForRefresh) ? parseInt(this.state.arrayTransactions.length / API_PAGE_SIZE) + 1 : 1
                }
                getWalletHistoryAPI(param, this.onSuccessFetchWallet, this.onFailureFetchWallet, this.props, true);
            } else {
                this.strOnScreenMessage = strings('noInternetTitle');
                this.strOnScreenSubtitle = strings('noInternet');
                this.setState({ isLoading: false, moreLoading: false })

            }
        })
    }

    /**
     * On success fetch wallet
     */
    onSuccessFetchWallet = (onSuccess) => {
        if (this.state.arrayTransactions == undefined)
            this.state.arrayTransactions = []
        debugLog("getWalletHistory :::::::: Success", this.state.arrayTransactions)

        if (onSuccess != undefined && onSuccess.status == RESPONSE_SUCCESS) {
            let totalTransactions = onSuccess.total_transactions || 0
            let arr = onSuccess.wallet_history
            this.shouldLoadMore = this.state.arrayTransactions.length + arr.length < totalTransactions
            this.current_balance = onSuccess.wallet_money
            this.props.saveWalletMoney(onSuccess.wallet_money)
            this.total_credited = onSuccess.total_money_credited
            this.currency_symbol = onSuccess.currency
            this.currency_code = onSuccess.currency_code
            this.setState({ arrayTransactions: [...this.state.arrayTransactions, ...arr], isLoading: false, moreLoading: false })
        }
        else {
            this.strOnScreenMessage = strings('generalWebServiceError')
            this.setState({ isLoading: false, moreLoading: false })
        }
    }

    /**
    * On failure fetch wallet
    */

    onFailureFetchWallet = (onFailure) => {
        this.strOnScreenMessage = strings('generalWebServiceError')
        this.setState({ isLoading: false, moreLoading: false })
    }

    onBackPressedEvent = () => {
        this.props.navigation.openDrawer();
    }

    renderTransaction = (data) => {
        return (
            <EDRTLView style={style.transactionContainer}>
                <EDRTLView style={{ flex: .75 }}>
                    <View style={style.walletIconView}>
                        <EDRTLView style={style.cashIconView}>
                            <Text style={[style.currentIconStyle]} numberOfLines={1}>
                                {"$"}
                            </Text>
                            <Icon style={style.cashIconStyle} name={data.item.debit == "1" ? "arrow-upward" : "arrow-downward"} color={data.item.debit == "1" ? EDColors.error : "green"} size={getProportionalFontSize(15)} />
                        </EDRTLView>
                    </View>
                    <View>
                        <EDRTLText style={[style.reasonStyle]} numberOfLines={2}
                            title={data.item.reason}
                        />
                        <EDRTLText style={[style.reasonDate]} numberOfLines={1}
                            title={funGetDateStr(data.item.created_date, "MM-DD-YYYY, hh:mm A")} />

                        {
                         data.item.description !== '' &&  data.item.description === 'wallet funding' &&  <EDRTLText style={[style.statusStyle,{color:data.item.is_approved == "2" ? EDColors.error : data.item.is_approved == "1" ?  "#41D634" : data.item.is_approved == "0" ? '#FFC300' : '' }]} numberOfLines={1}
                            title={data.item.is_approved === '0' ? 'Pending' : data.item.is_approved === '1' ? 'Approved' :  data.item.is_approved === '2' ? 'Declined' : ''}
                             />
                        }
                    </View>
                </EDRTLView>
                <View style={{ flex: .25, alignItems: isRTLCheck() ? "flex-start" : "flex-end" }}>
                    <EDRTLText style={[style.cashText, { textAlign: isRTLCheck() ? "left" : "right", color: data.item.debit == "1" || data.item.is_approved == "2"  ? EDColors.error : "#41D634", flex: 1 }]}
                        title={data.item.debit == "1" ?
                            isRTLCheck() ? this.currency_symbol + data.item.amount + " -" : "- " + this.currency_symbol + data.item.amount

                            : isRTLCheck() ? this.currency_symbol + data.item.amount + " +" : "+ " + this.currency_symbol + data.item.amount}
                    />
                </View>
            </EDRTLView>
        )
    }

    /**
     * Load More On end reached
     */

    loadMoreTransaction = () => {
        if (this.shouldLoadMore && !this.state.moreLoading && !this.state.isLoading) {
            this.setState({ moreLoading: true })
            this.getWalletHistory()
        }
    }

    /**
     * Pull to refresh
     */

    pullToRefresh = () => {
        this.refreshing = false
        this.shouldLoadMore = false
        this.state.arrayTransactions = undefined
        this.strOnScreenMessage = ''
        this.strOnScreenSubtitle = ''
        this.getWalletHistory(true)
    }

    //#region  Network

    networkConnectivityStatus = () => {
        if (this.total_credited == undefined || this.state.arrayTransactions == undefined) {
            this.state.arrayTransactions = undefined
            this.setState({ isLoading: true });
            this.getWalletHistory()
        }
    }

    showEarnPopup = () => {
        this.setState({ earningModal: true })
    }

    showCashTrfPopup = () => {
        this.setState({ cashTrfModal: true })
    }

    showCashTrfPopup2 = () => {
        this.setState({ cashTrfModal2: true })
    }



    closeCashTrfModal = () => {
        this.setState({ cashTrfModal: false })
    }

    closeCashTrfModal2 = () => {
        this.setState({ cashTrfModal2: false })
    }



    closeEarningModal = () => {
        this.setState({ earningModal: false })
    }

    CardPaymentPress = () => {
        this.rechargeWallet();
        this.closeCashTrfModal2()
    }

    CashTrfPress = () => {
        this.showCashTrfPopup();
        this.closeCashTrfModal2()
    }

    handleFundWalletButton = (selectedBank, amount, trans_id, description) => {
        // API Call Here...
        console.log(selectedBank, amount, trans_id, description)

        this.closeCashTrfModal();

        if (this.props.userID !== "" && this.props.userID !== undefined && this.props.userID !== null) {
            this.rechargeWalletCashTrf(trans_id, amount, description, selectedBank)
        }
        else {
            showDialogue(strings("loginValidation"), [], strings("appName"), () => {
                this.props.navigation.navigate("LoginContainer")
            });
        }

    }

    /**
     * Copy to clipboard
     */

    copyToClipboard = () => {
        this.refs.toast.show(strings("codeCopied"), DURATION.LENGTH_SHORT);
        Clipboard.setString(this.props.referral_code)
    }

    /**
     * Share app
     */
    shareApp = () => {
        const shareOptions = {
            title: strings("shareApp"),
            message: strings("shareAppMessage") + '\niOS: ' + this.props.storeURL.app_store_url +
                '\nAndroid: ' + this.props.storeURL.play_store_url + '\n' + strings('usePromo') + boldify(this.props.referral_code || '') +
                strings('rewardMsg'),
        };
        console.log("SHARE OPTION{}{}", shareOptions)
        Share.open(shareOptions);
    }

    renderEarningModal = () => {
        return (
            <EDPopupView isModalVisible={this.state.earningModal} shouldDismissModalOnBackButton={true} onRequestClose={this.closeEarningModal}>


                <EDEarnMoreComponent
                    closeEarningModal={this.closeEarningModal}
                    // copyToClipboard={this.copyToClipboard}
                    referral_code={this.props.referral_code}
                    shareApp={this.shareApp}
                    isClose={true}
                />

            </EDPopupView>
        )
    }

    renderCashTrfModal = () => {
        return (
            <EDPopupView isModalVisible={this.state.cashTrfModal} shouldDismissModalOnBackButton={true} onRequestClose={this.closeCashTrfModal}>

                <EDCashTrfComponent
                    closeEarningModal={this.closeCashTrfModal}
                    isClose={true}
                    handleCashTransferPress={this.handleFundWalletButton}
                />

            </EDPopupView>
        )
    }

    renderSelectionModal = () => {

        return (
            <EDPopupView isModalVisible={this.state.cashTrfModal2} shouldDismissModalOnBackButton={true} onRequestClose={this.closeCashTrfModal2}>

                <WalletPaymentSelectionComponent
                    closeEarningModal={this.closeCashTrfModal2}
                    isClose={true}
                    cardPaymentPress={this.CardPaymentPress}
                    cashTrfPress={this.CashTrfPress}
                    popUpTitle={"Select Funding Method"}
                    btnCardPayTitle={"Card Payment"}
                    btnOtherTitle={"Cash Trf"}
                />

            </EDPopupView>
        )
    }

    renderFooter = () => {
        return (
            <>
                {this.state.moreLoading ? <Spinner size="large" color={EDColors.primary} style={{ height: 40 }} /> : null}
            </>
        )
    }

    navigateToPaymentGateway = () => {
        this.props.navigation.navigate("savedCards", {
            "currency_code": this.currency_code,
            isPendingAdded: false,
            pendingTotalPayment: Number(this.state.rechargeAmount),
            isForSelection: true,
            isForTip: true,
            isCustom: true,
            isForRecharge: true
        })
    }

    startPaystackPayment = () => {
        netStatus(
            status => {
                if (status) {
                    this.paystackWebViewRef.current.startTransaction();

                }
                else {
                    this.strOnScreenMessage = strings('noInternetTitle');
                    this.strOnScreenSubtitle = strings('noInternet');
                    this.setState({ isLoading: false, moreLoading: false })
                }
            }
        )
    }

    rechargeWallet = () => {
        this.setState({ rechargePopUp: true })
    }

    hideRechargeWallet = () => {
        this.setState({ rechargePopUp: false, rechargeAmount: '' })
    }

    doRecharge = () => {

        if (this.props.userID !== "" && this.props.userID !== undefined && this.props.userID !== null) {

            if (!this.validateAmount())
                return;
            this.setState({ rechargePopUp: false })
            this.startPaystackPayment()
        }

        else {
            showDialogue(strings("loginValidation"), [], strings("appName"), () => {
                this.props.navigation.navigate("LoginContainer")
            });
        }

        // this.navigateToPaymentGateway()
    }

    textFieldTextDidChangeHandler = (text) => {
        let newText = text.replace(/[^0-9.\\]/g, "");
        this.setState({ rechargeAmount: newText })
    }

    validateAmount = () => {
        let reg = /^\$?\d+(,\d{3})*(\.\d*)?$/
        return reg.test(this.state.rechargeAmount) && (Number(this.state.rechargeAmount) !== 0)
    }

    renderRechargePopUp = () => {
        return (
            <EDPopupView isModalVisible={this.state.rechargePopUp}
                shouldDismissModalOnBackButton={true}
                onRequestClose={this.hideRechargeWallet}>

                <View style={{ flex: 1, justifyContent: "flex-end" }}>
                    <TouchableOpacity onPress={this.hideRechargeWallet} style={{ flex: 1 }} />
                    <View style={{ backgroundColor: EDColors.white, borderRadius: 16, marginBottom: -16, zIndex: 1, padding: 10 }}>
                        <View style={style.lineView}>
                            <View style={style.line}></View>
                        </View>

                        <EDRTLTextInput
                            containerStyle={{ marginTop: 0 }}
                            textstyle={{ color: EDColors.black }}
                            type={TextFieldTypes.amount}
                            placeholder={strings('addMoney')}
                            onChangeText={this.textFieldTextDidChangeHandler}
                            initialValue={this.state.rechargeAmount}
                        />
                        <EDRTLView style={{ justifyContent: "space-between", marginBottom: 16 }}>
                            <EDButton onPress={this.hideRechargeWallet} label={strings("dialogCancel")} textStyle={{ fontSize: getProportionalFontSize(14), color: EDColors.primary }} style={style.cancelBtn} />
                            <EDButton
                                disabled={!this.validateAmount()}
                                onPress={this.doRecharge} label={strings("submitButton")} textStyle={{ fontSize: getProportionalFontSize(14) }} style={[style.submitBtn, {
                                    backgroundColor: this.validateAmount() ? EDColors.primary : EDColors.buttonUnreserve
                                }]} />

                        </EDRTLView>
                    </View>
                </View>

            </EDPopupView>
        )
    }

    rechargeWalletTopUp = (transaction_id, amount) => {

        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true })
                let walletParams = {
                    language_slug: this.props.lan,
                    user_id: parseInt(this.props.userID),
                    transaction_id: transaction_id,
                    amount: amount
                }
                rechargeWalletAPI(walletParams, this.onSucessWalletRechage, this.onFailureWalletRecharge, this.props)
            }
            else
                showValidationAlert(strings("noInternet"));
        })

    }


    rechargeWalletCashTrf = (transaction_id, amount, description, selectedBank) => {

        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true })
                let walletParams = {
                    language_slug: this.props.lan,
                    user_id: parseInt(this.props.userID),
                    transaction_id: transaction_id,
                    amount: amount,
                    description: description,
                    reason: selectedBank
                }
                rechargeWalletCashTrfAPI(walletParams, this.onSucessWalletCashTrfRechage, this.onFailureWalletRecharge, this.props)
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
                this.getWalletHistory(true)
            })
        }
        else {
            showValidationAlert(onSuccess.message || strings("generalWebServiceError"))

        }
    }

    onSucessWalletCashTrfRechage = onSuccess => {
        this.setState({ isLoading: false, isCardCheckLoading: false });
        if (onSuccess.status == RESPONSE_SUCCESS) {
            showDialogue(strings("walletRechargeSuccessCashTrf"), [], "", () => {
                this.props.navigation.navigate("myWalletContainer")
                this.getWalletHistory(true)
            })
        }
        else {
            showValidationAlert(onSuccess.message || strings("generalWebServiceError"))

        }
    }

    onFailureWalletRecharge = (onfailure) => {
        console.log("onfailure", onfailure);
        this.setState({ isLoading: false, isCardCheckLoading: false });
        showValidationAlert(onfailure.message || strings("generalWebServiceError"))
    }


    render() {
        return (
            <BaseContainer
                title={strings("myWallet")}
                left={'menu'}
                right={[]}
                onLeft={this.onBackPressedEvent}
                loading={this.state.isLoading && !this.state.moreLoading}
            >
                <NavigationEvents onWillFocus={this.onDidFocusWalletContainer} />

                {this.state.isLoading && !this.state.moreLoading ? null :
                    <View style={style.mainContainer}>
                        {this.renderEarningModal()}
                        {this.renderRechargePopUp()}
                        {this.renderCashTrfModal()}
                        {this.renderSelectionModal()}

                        {this.current_balance !== undefined ?
                            <>

                                <View style={{
                                    backgroundColor: EDColors.white,
                                    borderRadius: 16,
                                    padding: 10,
                                    elevation: 1,
                                }}>
                                    {/* VIKRANT 30-07-21 */}
                                    <EDRTLView style={style.header}>
                                        <View style={style.walletView}>
                                            <EDRTLView style={{ alignItems: "center" }}>
                                                <Text style={style.walletHeader}>
                                                    {strings("yourWalletBalance")}
                                                </Text>
                                            </EDRTLView>

                                            <Text style={[style.walletText, { fontFamily: EDFonts.bold, textAlign: isRTLCheck() ? 'right' : 'left' }]}>
                                                {this.currency_symbol + this.current_balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                            </Text>



                                        </View>
                                        {/* <Image source={this.props.image !== undefined && this.props.image !== null && this.props.image.trim() !== "" ? { uri: this.props.image } : Assets.user_placeholder} style={style.headerImage} /> */}
                                        <Icon name="wallet-outline" type={'ionicon'} reverse size={getProportionalFontSize(30)} color={'#EFEFEF'} reverseColor={EDColors.black} />
                                    </EDRTLView>
                                    <EDRTLView style={{ alignItems: "center", justifyContent: "space-between", paddingHorizontal: 5, }}>
                                        {/* <TouchableOpacity onPress={this.rechargeWallet}>
                                            <EDRTLView style={{ alignItems: "center", }}>
                                                <Icon name="wallet-plus-outline" type="material-community" size={25} color={EDColors.primary} />
                                                <EDRTLText
                                                    title={strings("addMoney")}
                                                    icon={'attach-money'}
                                                    style={style.addMoney}
                                                />
                                            </EDRTLView>
                                        </TouchableOpacity> */}
                                        <TouchableOpacity onPress={this.showEarnPopup} activeOpacity={1}>
                                            <EDRTLView style={style.shareBtn}>
                                                <Text style={[style.btnText]} >{strings("earnMore")} </Text>
                                            </EDRTLView>
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={this.showCashTrfPopup2} activeOpacity={1}>
                                            <EDRTLView style={style.shareBtn}>
                                                <Text style={[style.btnText]} >{strings("fundWallet")} </Text>
                                            </EDRTLView>
                                        </TouchableOpacity>
                                    </EDRTLView>
                                </View>
                                <View style={style.earning}>
                                    <EDRTLView style={style.earningView}>
                                        <Text style={[style.headerText]}>
                                            {strings("transactions")}
                                        </Text>
                                        {this.total_credited !== undefined && this.total_credited !== 0 && this.total_credited !== "0.00" ?
                                            <Text style={[style.normalHeader]}>
                                                {isRTLCheck() ?
                                                    strings("totalEarned") + parseFloat(this.total_credited).toFixed(2) + this.currency_symbol :
                                                    strings("totalEarned") + this.currency_symbol + parseFloat(this.total_credited).toFixed(2)}
                                            </Text> : null}
                                    </EDRTLView>
                                    {this.state.arrayTransactions !== undefined && this.state.arrayTransactions !== null && this.state.arrayTransactions.length !== 0 ?
                                        <FlatList
                                            ListFooterComponent={this.renderFooter()}
                                            showsVerticalScrollIndicator={false}
                                            data={this.state.arrayTransactions}
                                            keyExtractor={(item, index) => item + index}
                                            renderItem={this.renderTransaction}
                                            onEndReached={this.loadMoreTransaction}
                                            onEndReachedThreshold={0.5}
                                            refreshControl={<RefreshControl
                                                refreshing={this.refreshing}
                                                title={strings('refreshing')}
                                                titleColor={EDColors.textAccount}
                                                tintColor={EDColors.textAccount}
                                                colors={[EDColors.primary]}
                                                onRefresh={this.pullToRefresh} />}

                                        />
                                        :
                                        <EDPlaceholderComponent
                                            placeholderIcon={Assets.logo}
                                            title={this.strOnScreenMessage !== undefined && this.strOnScreenMessage.trim().length !== 0 ? this.strOnScreenMessage : strings("noTransactions")} />}
                                </View>
                            </> :
                            (this.strOnScreenMessage !== undefined && this.strOnScreenMessage.trim().length !== 0) ?
                                <EDPlaceholderComponent
                                    placeholderIcon={Assets.logo}
                                    title={this.strOnScreenMessage} onBrowseButtonHandler={this.getWalletHistory} buttonTitle={strings("reloadScreen")} /> : null
                        }
                    </View>
                }

                <Paystack
                    paystackKey={"pk_live_bfc11b8453878af90c9b4e6afd44b7e1eb210e8c"}
                    paystackSecretKey={"sk_live_cac2abb9eb7c60ceb0b97c6fdd04aa86f8eea020"}
                    amount={Number(this.state.rechargeAmount)}
                    billingEmail={this.props.email}
                    channels={['card', 'bank']}
                    currency='NGN'
                    onCancel={(e) => {
                        // handle response here
                        console.log('paystack res', e)
                        this.hideRechargeWallet()
                    }}
                    onSuccess={(res) => {
                        // handle response here
                        //console.log('paystack res', JSON.stringify(res))
                        // API here
                        this.rechargeWalletTopUp(res.transactionRef.reference, this.state.rechargeAmount)
                        this.hideRechargeWallet()
                    }}
                    ref={this.paystackWebViewRef}
                />
            </BaseContainer>
        )
    }
}

/**
 * StyleSheet
 */

const style = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: 10,
    },
    submitBtn: {
        flex: 2,
        marginHorizontal: 0,
        paddingVertical: 5,
        borderRadius: 9
    },
    cancelBtn: {
        flex: 2,
        marginHorizontal: 0,
        paddingVertical: 5,
        borderRadius: 9,
        backgroundColor: EDColors.white,
        borderWidth: 1, borderColor: EDColors.primary,
        marginRight: 10
    },
    addMoney: {
        fontSize: getProportionalFontSize(14),
        fontFamily: EDFonts.semiBold,
        marginHorizontal: 5
    },
    codeBox: {
        fontFamily: EDFonts.bold,
        fontSize: 14,
        textAlign: "center",
        color: EDColors.black,
        marginTop: 10,
        padding: 5,
        borderWidth: .5,
        backgroundColor: EDColors.backgroundDark,
        width: widthPercentageToDP("35%"),
        alignSelf: "center"
    },
    normalText: {
        fontFamily: EDFonts.bold,
        fontSize: 14,
        textAlign: "center",
        color: EDColors.black,
        margin: 10
    },
    earningModal: {
        backgroundColor: EDColors.white,
        borderRadius: 6,
        width: metrics.screenWidth * .9,
        alignSelf: "center",
        padding: 10
    },
    referBody: {
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: 10
    },
    break: {
        height: 1,
        backgroundColor: EDColors.primary,
        marginTop: 10
    },
    referText: {
        fontSize: 14,
        fontFamily: EDFonts.regular,
        flex: 1,
        marginHorizontal: 10
    },
    share: {
        backgroundColor: "green",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        marginTop: 15,
        paddingVertical: 5,
        borderRadius: 25,
        elevation: 1,
        width: widthPercentageToDP("35%"),
    },
    shareBtn: {
        backgroundColor: EDColors.primary,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 15,
        // marginTop: 15,
        paddingVertical: 10,
        borderRadius: 11,
        elevation: 1,
    },
    fundBtn: {
        backgroundColor: EDColors.transparentBackground,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 15,
        // marginTop: 15,
        paddingVertical: 10,
        borderRadius: 11,
        elevation: 8,
    },
    headerImage: {
        borderWidth: 2,
        borderColor: EDColors.primary,
        width: metrics.screenWidth * 0.15,
        height: metrics.screenWidth * 0.15,
        borderRadius: metrics.screenWidth * 0.15 / 2,
    },
    shareImage: {
        height: 40,
        width: 40,
        resizeMode: "contain"
    },
    header: {
        marginBottom: 5,
        justifyContent: "space-between",
        // alignItems: "center"
    },
    earning: {
        flex: 1,
        marginVertical: 5,
        backgroundColor: EDColors.white,
        borderRadius: 16,
        marginTop: 10
    },
    walletHeader: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(18),
        color: EDColors.black,
        // textAlign: isRTLCheck() ? 'right' : 'left'
    },
    walletText: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(32),
        color: EDColors.black,
        marginRight: 5,
        // marginTop: 5
        // textAlign: isRTLCheck() ? 'right' : 'left'
    },
    normalHeader: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(15),
        color: EDColors.black,
    },
    transactionContainer: {
        padding: 10,
        alignItems: "center",
        marginVertical: 5,
        justifyContent: "space-between",
        borderRadius: 6,
        flex: 1
    },
    reasonText: {
        fontFamily: EDFonts.regular,
        fontSize: 18,
    },
    cashIconStyle: { marginTop: 3 },
    cashIconView: { paddingHorizontal: 5 },
    currentIconStyle: { fontSize: getProportionalFontSize(32), color: EDColors.white, fontFamily: EDFonts.semiBold, textAlign: 'center' },
    walletMainView: { paddingHorizontal: 5, flex: 1 },
    walletIconView: { backgroundColor: EDColors.primary, width: metrics.screenWidth * 0.15, height: metrics.screenWidth * 0.15, borderRadius: metrics.screenWidth * 0.75, justifyContent: 'center', alignItems: 'center' },
    cashText: { fontSize: getProportionalFontSize(13), fontFamily: EDFonts.semiBold, paddingHorizontal: 5, },
    reasonDate: { marginHorizontal: 20, fontSize: getProportionalFontSize(14), marginTop: 10, fontFamily: EDFonts.boldItalic, color: EDColors.black, fontFamily: EDFonts.semiBold, },
    statusStyle: { marginHorizontal: 20, fontSize: getProportionalFontSize(14), marginTop: 10, fontFamily: EDFonts.boldItalic, fontFamily: EDFonts.semiBold, },
    reasonStyle: { marginHorizontal: 20, fontSize: getProportionalFontSize(14), maxWidth: metrics.screenWidth * .5, fontFamily: EDFonts.medium, color: EDColors.blackSecondary },
    headerText: { fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(16), color: EDColors.black },
    earningView: { alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingVertical: 15, borderBottomColor: EDColors.radioSelected, borderBottomWidth: 1 },
    // btnText:{ fontSize: getProportionalFontSize(16) , color: EDColors.white, marginHorizontal: 10 , fontFamily: EDFonts.semiBold},
    btnText: { fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(14), color: EDColors.white },
    fundText: { fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(14), color: EDColors.black },
    walletView: { padding: 5, flex: 1 },
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
        justifyContent: 'flex-end', marginVertical: 5,
        // marginHorizontal: 5,
        backgroundColor: EDColors.white
    },
    customTipInput: { marginHorizontal: 10, fontSize: getProportionalFontSize(14) },
    whatIsYourRating: { marginHorizontal: 5, color: EDColors.primary, fontSize: getProportionalFontSize(16), fontFamily: EDFonts.bold, },
})

export default connect(
    state => {
        return {
            titleSelected: state.navigationReducer.selectedItem,
            userToken: state.userOperations.phoneNumberInRedux,
            userID: state.userOperations.userIdInRedux,
            firstName: state.userOperations.firstName,
            lastName: state.userOperations.lastName,
            image: state.userOperations.image,
            token: state.userOperations.token,
            lan: state.userOperations.lan,
            referral_code: state.userOperations.referral_code,
            wallet_money: state.userOperations.wallet_money,
            storeURL: state.userOperations.storeURL,
            email: state.userOperations.email

        };
    },
    dispatch => {
        return {
            saveWalletMoney: token => {
                dispatch(saveWalletMoneyInRedux(token))
            },
            saveNavigationSelection: dataToSave => {
                dispatch(saveNavigationSelection(dataToSave));
            },
        };
    }
)(MyWalletContainer);
