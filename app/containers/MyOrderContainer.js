import React from "react";
import { AppState } from "react-native";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { NavigationActions, NavigationEvents, StackActions } from "react-navigation";
import { connect } from "react-redux";
import EDCancelReasonsList from "../components/EDCancelReasonList";
import EDOrdersViewFlatList from '../components/EDOrdersViewFlatList';
import EDPlaceholderComponent from "../components/EDPlaceholderComponent";
import EDPopupView from '../components/EDPopupView';
import EDTopTabBar from "../components/EDTopTabBar";
import EDWriteReview from "../components/EDWriteReview";
import { strings } from "../locales/i18n";
import { saveNavigationSelection } from "../redux/actions/Navigation";
import { saveCancellationReason, saveWalletMoneyInRedux } from "../redux/actions/User";
import { showDialogue, showNoInternetAlert, showValidationAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import { debugLog, getProportionalFontSize, RESPONSE_SUCCESS } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import { netStatus } from "../utils/NetworkStatusConnection";
import { addReviewAPI, cancelOrderAPI, getCancelReasonList, getOrderListingAPI, getWalletHistoryAPI } from "../utils/ServiceManager";
import BaseContainer from "./BaseContainer";
import AsyncStorage from '@react-native-async-storage/async-storage';

class MyOrderContainer extends React.Component {
    //#region LIFE CYCLE METHODS

    constructor(props) {
        super(props);

        this.checkoutDetail = this.props.checkoutDetail;
        var userObj = null;
        this.strOnScreenMessageInProcess = '';
        this.strOnScreenSubtitleinProcess = '';
        this.strOnScreenMessagePast = '';
        this.strOnScreenSubtitlePast = '';
        this.arrayUpcoming = [];
        this.currency_symbol = ""
        this.refreshing = false
        this.cancelReasonArray = [
            { label: strings('otherReason'), value: strings('otherReason') },
        ]



    }

    state = {
        isLoading: false,
        selectedIndex: 0,
        isEnable: false,
        isReview: false,
        reviewStar: "",
        reviewText: "",
        restaurant_id: "",
        ratingObj: undefined,
        isCancelModalVisible: false,
        isReasonLoading: false
    };

    async componentDidMount() {
        // AppState.addEventListener('change', this._handleAppStateChange);

        var a = await AsyncStorage.getItem('ratingData');
        // console.log("NOTI REST ID" + JSON.stringify(a));
        // console.log("NOTI REST ID WITHOUT JSON" + a);
        if (a !== null && a !== undefined)
            this.setState({ restaurant_id: a.restaurant_id, ratingObj: a })
        console.log("IS REVIEW :::::", this.state.isReview)
        this.props.saveNavigationSelection("Order");
    }

    /**
     * @param { Applications status Active or Background } nextAppState
     */
    _handleAppStateChange = async (nextAppState) => {
        this.strOnScreenMessagePast = this.strOnScreenMessageInProcess = ''
        this.strOnScreenSubtitlePast = this.strOnScreenSubtitleinProcess = ''
        this.refreshing = false
        this.arrayPast = []
        this.arrayUpcoming = []
        this.setState({ isLoading: true })
        this.getOrderListingData();
        var a = await AsyncStorage.getItem('ratingData');
        if (a !== null && a !== undefined) {
            // this.scrollView.scrollTo({
            //     x: metrics.screenWidth,
            //     y: 0,
            //     animated: false,
            // });
            this.setState({ restaurant_id: a.restaurant_id, ratingObj: a })
        }
        this.props.saveNavigationSelection("Order");

    }
    //#endregion

    componentWillUnmount = () => {
        AppState.removeEventListener('change', this._handleAppStateChange);
    }

    componentWillReceiveProps = (newProps) => {
        if (this.props.screenProps.isRefresh !== newProps.screenProps.isRefresh) {
            this.strOnScreenMessage = ""
            this.strOnScreenSubtitle = ""
            this.refreshing = false
            this.arrayPast = []
            this.arrayUpcoming = []
            this.setState({ isLoading: true })
            this.getOrderListingData();
            this.props.saveNavigationSelection("Order");
            var a = undefined
            AsyncStorage.getItem('ratingData').then(
                success => {
                    a = success
                    console.log("NOTI REST ID" + JSON.stringify(a));
                    console.log("NOTI REST ID WITHOUT JSON" + a);
                    if (a !== null && a !== undefined)
                        this.setState({ restaurant_id: a.restaurant_id, ratingObj: a })
                }
            );

            // console.log("IS REVIEW :::::", this.state.isReview)

        }
    }

    //#region 
    /** NETWORK CONNECTIVITY */
    networkConnectivityStatus = () => {

    }
    //#endregion

    //#region ON BLUR EVENT
    onDidFocusContainer = () => {
        this.checkUser()
        this.props.saveNavigationSelection("Order");
    }
    //#endregion

    //#region 
    /** ON LEFT PRESSED */
    onBackPressedEvent = () => {
        this.props.navigation.openDrawer();
    }
    //#endregion

    navigateToRestaurant = (res_id, res_content_id) => {
        this.props.navigation.push("RestaurantContainer", {
            restId: res_id,
            content_id: res_content_id
        })
    }

    // RENDER METHOD
    render() {
        return (
            <BaseContainer
                title={strings("myOrder")}
                left={'menu'}
                right={[]}
                onLeft={this.onBackPressedEvent}
                onConnectionChangeHandler={this.networkConnectivityStatus}
                loading={this.state.isLoading || this.state.isReasonLoading}
            >

                {/* FOCUS EVENTS */}
                <NavigationEvents onWillFocus={this.onDidFocusContainer} />


                {/* REVIEW DIALOG */}
                {this.renderReviewSubmitDialogue()}

                {/* CANCELLATION REASON DIALOGUE */}
                {this.cancelOrderModalRender()}

                <EDTopTabBar
                    data={[{ title: strings("inProcessOrder"), onPress: this.handleIndexChange, index: 0 },
                    { title: strings("pastOrder"), onPress: this.handleIndexChange, index: 1 }]}
                    selectedIndex={this.state.selectedIndex}
                />

                <ScrollView style={styles.scrollContent}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    pagingEnabled
                    ref={ref => this.scrollView = ref}
                    horizontal
                    scrollEnabled={false}
                >


                    {this.renderCurrentOrder()}
                    {this.renderPastOrders()}
                </ScrollView>
            </BaseContainer>
        );
    }
    //#endregion

    /** CURRENT ORDER TAB */
    renderCurrentOrder = () => {
        return this.arrayUpcoming !== undefined && this.arrayUpcoming.length > 0 ? (
            <EDOrdersViewFlatList
                style={styles.orderParentView}
                arrayOrders={this.arrayUpcoming}
                onPressHandler={this.navigateToCurrentOrderDetails}
                onPullToRefreshHandler={this.onPullToRefreshHandler}
                lan={this.props.lan}
                onTrackOrder={this.onTrackOrderPressHandler}
                onCancelOrder={this.cancelOrderPressed}
                navigateToRestaurant={this.navigateToRestaurant}

            />
        ) : (this.strOnScreenMessageInProcess || '').trim().length > 0 ? (
            <View>
                <ScrollView
                    contentContainerStyle={styles.scrollContainerStyle}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.refreshing || false}
                            titleColor={EDColors.textAccount}
                            title={strings("refreshing")}
                            tintColor={EDColors.textAccount}
                            colors={[EDColors.textAccount]}
                            onRefresh={this.onPullToRefreshHandler}
                        />
                    }>
                    <EDPlaceholderComponent
                        title={this.strOnScreenMessageInProcess}
                        subTitle={this.strOnScreenSubtitleinProcess}
                    />
                </ScrollView>
            </View>
        ) : null;
    };

    navigateToCurrentOrderDetails = (currentOrderDetails) => {
        this.props.navigation.navigate('CurrentOrderContainer', { currentOrder: currentOrderDetails });
    }

    /** PAST ORDERS TAB */
    renderPastOrders = () => {
        return this.arrayPast !== undefined && this.arrayPast.length > 0 ? (
            <EDOrdersViewFlatList
                forPast={true}
                style={styles.orderParentView}
                arrayOrders={this.arrayPast}
                onPressHandler={this.navigateToOrderDetails}
                onPullToRefreshHandler={this.onPullToRefreshHandler}
                lan={this.props.lan}
                navigateToRestaurant={this.navigateToRestaurant}

            />
        ) : (this.strOnScreenMessagePast || '').trim().length > 0 ? (
            <View>
                <ScrollView
                    contentContainerStyle={styles.scrollContainerStyle}
                    refreshControl={
                        <RefreshControl
                            refreshing={this.refreshing || false}
                            title={strings("refreshing")}
                            titleColor={EDColors.textAccount}
                            tintColor={EDColors.textAccount}
                            colors={[EDColors.textAccount]}
                            onRefresh={this.onPullToRefreshHandler}
                        />
                    }
                >
                    <EDPlaceholderComponent
                        title={this.strOnScreenMessagePast}
                        subTitle={this.strOnScreenSubtitlePast}
                    />
                </ScrollView>
            </View>
        ) : null;
    };

    /** NAVIGATE TO ORDER DETAILS */
    navigateToOrderDetails = (item) => {
        this.props.navigation.navigate("OrderDetailContainer", { OrderItem: item });
    }
    //#endregion


    onPullToRefreshHandler = () => {
        this.strOnScreenMessageInProcess = ""
        this.strOnScreenSubtitleinProcess = ""
        this.strOnScreenSubtitlePast = ""
        this.strOnScreenMessagePast = ""
        this.refreshing = false
        this.arrayPast = []
        this.arrayUpcoming = []
        this.setState({ isLoading: true })
        this.getOrderListingData();
    }

    //#region CLOSE REQUEST HANDLER
    onDismissReviewSubmitHandler = () => {
        AsyncStorage.removeItem("ratingData")
        this.checkUser();
        this.setState({ isReview: false, ratingObj: undefined });
    }
    onDismissReviewAndReload = () => {
        AsyncStorage.removeItem("ratingData")
        this.checkUser();
        this.setState({ isReview: false, ratingObj: undefined });
    }
    //#endregion

    //#region REVIEW SUBMIT MODEL
    /** RENDER REVIEW DIALOGUE */
    renderReviewSubmitDialogue = () => {
        return (
            <EDPopupView isModalVisible={this.state.isReview}
                style={{ justifyContent: "flex-end" }}>
                {this.orderToRate !== undefined && this.orderToRate !== null ?
                    <EDWriteReview
                        containerProps={this.props}
                        orderData={this.orderToRate[0]}
                        dismissWriteReviewDialogueHandler={this.onDismissReviewSubmitHandler}
                        onDismissReviewAndReload={this.onDismissReviewAndReload}
                    /> : null}
            </EDPopupView>
        )

    }
    //#endregion

    cancelOrderModalRender = () => {
        return (
            <EDPopupView isModalVisible={this.state.isCancelModalVisible}

            >
                <EDCancelReasonsList reasonData={this.cancelReasonArray} onDismissCancellationReasonDialogueHandler={this.onDismissCancellationReasonDialogueHandler} />
            </EDPopupView>
        )
    }

    onDismissCancellationReasonDialogueHandler = (flag) => {
        if (flag == undefined || flag == null || flag == '') {
            this.setState({ isCancelModalVisible: false })
            return;
        }
        this.strCancelReason = flag
        this.cancelOrderCheck()
    }

    cancelOrderCheck = () => {
        netStatus(status => {
            if (status) {
                this.setState({
                    isCancelModalVisible: false,
                    isLoading: true,
                })
                let objCancelParams = {
                    user_id: this.props.userID,
                    order_id: this.orderToCancel,
                    cancel_reason: this.strCancelReason,
                    language_slug: this.props.lan
                }
                cancelOrderAPI(
                    objCancelParams, this.onSuccessCancelOrder, this.onFailureCancelOrder, this.props
                )
            } else {
                this.setState({
                    isCancelModalVisible: false,
                })
                showNoInternetAlert()
            }
        })
    }

    onSuccessCancelOrder = (response) => {
        this.getWalletHistory()
        showDialogue(response.message, [], "", () => {
            this.onPullToRefreshHandler()
        })
        // this.setState({
        //     isLoading: false
        // })
    }
    onFailureCancelOrder = (response) => {
        this.setState({
            isLoading: false
        })
        showDialogue(response.message)
    }


    /**
     * Get Wallet Historey
     */
    getWalletHistory = () => {
        netStatus(isConnected => {
            if (isConnected) {
                let param = {
                    language_slug: this.props.lan,
                    user_id: parseInt(this.props.userID) || 0,
                    count: 10,
                    page_no: 1
                }
                getWalletHistoryAPI(param, this.onSuccessFetchWallet, this.onFailureFetchWallet, this.props, true);
            }
        })
    }

    /**
     * On success fetch wallet
     */
    onSuccessFetchWallet = (onSuccess) => {
        if (onSuccess != undefined && onSuccess.status == RESPONSE_SUCCESS) {
            this.props.saveWalletMoney(onSuccess.wallet_money)
        }
    }

    /**
    * On failure fetch wallet
    */

    onFailureFetchWallet = (onFailure) => {
    }


    cancelOrderPressed = orderData => {
        this.orderToCancel = orderData.order_id
        this.setState({ isCancelModalVisible: true })
    }




    //#region 
    /** TRACK ORDER PRESSEDD */
    onTrackOrderPressHandler = (orderItem, taxable_fields) => {
        if (orderItem.third_party_tracking_url !== undefined &&
            orderItem.third_party_tracking_url !== null &&
            orderItem.third_party_tracking_url.trim().length !== 0
        ) {
            this.props.navigation.navigate("TrackOrderContainer", {
                trackOrder: orderItem,
                currency_symbol: orderItem.currency_symbol,
                is_third_party: true
            })
        }
        else if (orderItem.driver !== undefined &&
            orderItem.driver !== null &&
            orderItem.driver.latitude !== undefined &&
            orderItem.driver.latitude !== null &&
            orderItem.driver.longitude !== undefined &&
            orderItem.driver.longitude !== null
        ) {
            this.props.navigation.navigate("TrackOrderContainer", {
                trackOrder: orderItem,
                currency_symbol: orderItem.currency_symbol,
                taxable_fields: taxable_fields
            })
        } else {
            showDialogue(strings("driverLocationError"), [], "")//TEMP

        }
    }
    //#endregion



    //#region  NETWORK
    /** CHECK USER DEATILS */
    checkUser() {
        if (this.props.userID !== "" && this.props.userID !== undefined && this.props.userID !== null) {
            this.getOrderListingData();
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
    //#endregion

    fetchCancelReasons = () => {
        netStatus(status => {
            if (status) {
                let objPickUpParams = {
                    language_slug: this.props.lan,
                    reason_type: "cancel",
                    user_type: "Customer"
                }
                this.setState({ isReasonLoading: true })
                getCancelReasonList(objPickUpParams, this.onSuccessReasonList, this.onFailureReasonList, this.props)
            }
        })
    }

    onSuccessReasonList = (onSuccess) => {
        if (onSuccess.status == RESPONSE_SUCCESS && onSuccess.reason_list !== undefined && onSuccess.reason_list !== null &&
            onSuccess.reason_list.length !== 0) {
            let reasons = []
            onSuccess.reason_list.map(data => {
                reasons.push({
                    label: data.reason,
                    value: data.reason
                })
            })
            this.cancelReasonArray = [...reasons, { label: strings('otherReason'), value: strings('otherReason') }]
            this.props.saveCancellationReasons(reasons)
        } else {
            this.cancelReasonArray = [{ label: strings('otherReason'), value: strings('otherReason') }]
        }
        this.setState({ isReasonLoading: false })
    }

    onFailureReasonList = (onFailure) => {
        console.log('fail::')
        this.setState({ isReasonLoading: false })

    }

    //#region 
    /**
    * @param { Success Reponse Object } onSuccess
    */
    onSuccessOrderListing = (onSuccess) => {
        if (onSuccess != undefined && onSuccess.status == RESPONSE_SUCCESS) {
            if (onSuccess.in_process.length > 0) {
                this.arrayUpcoming = onSuccess.in_process;
                // if (this.props.arrayCancelReasons == undefined)
                this.fetchCancelReasons()
                // else
                //     this.cancelReasonArray = [...this.props.arrayCancelReasons,  { label: strings('otherReason'), value: strings('otherReason') }]

            } else {
                this.strOnScreenMessageInProcess = strings('noDataFound')
            }

            if (onSuccess.past.length > 0) {
                this.arrayPast = onSuccess.past;
            } else {
                this.strOnScreenMessagePast = strings('noDataFound')
            }
            if (this.state.ratingObj !== undefined)
                this.orderToRate = this.arrayPast.filter(data => { return data.order_id == this.state.ratingObj })


            this.scrollView.scrollTo({
                x:
                    (this.state.ratingObj !== undefined && this.orderToRate[0].show_restaurant_reviews !== undefined && this.orderToRate[0].show_restaurant_reviews !== null && this.orderToRate[0].show_restaurant_reviews ? 1 : 0) *
                    metrics.screenWidth,
                y: 0,
                animated: true,
            });
            this.setState({ selectedIndex: this.state.ratingObj !== undefined && this.orderToRate[0].show_restaurant_reviews !== undefined && this.orderToRate[0].show_restaurant_reviews !== null && this.orderToRate[0].show_restaurant_reviews ? 1 : 0, isLoading: false, isReview: this.state.ratingObj !== undefined && this.orderToRate[0].show_restaurant_reviews !== undefined && this.orderToRate[0].show_restaurant_reviews !== null && this.orderToRate[0].show_restaurant_reviews });

        } else {
            this.strOnScreenMessagePast = strings("generalWebServiceError")
            this.strOnScreenMessageInProcess = strings("generalWebServiceError")
            this.setState({ isLoading: false });
        }
    }


    /**
     * @param { Failure Response Object } onFailure
     */
    onFailureOrderListing = (onFailure) => {
        this.strOnScreenMessagePast = strings("generalWebServiceError")
        this.strOnScreenMessageInProcess = strings("generalWebServiceError")
        this.setState({ isLoading: false });
    }

    /** GET CURRENT ORDER API */
    getOrderListingData() {
        netStatus(isConnected => {
            if (isConnected) {
                this.arrayUpcoming = []
                this.arrayPast = []
                this.strOnScreenMessagePast = this.strOnScreenMessageInProcess = ''
                this.strOnScreenSubtitlePast = this.strOnScreenSubtitleinProcess = ''
                this.setState({ isLoading: true });
                let param = {
                    language_slug: this.props.lan,
                    user_id: parseInt(this.props.userID) || 0,
                    // token: this.props.token
                }
                getOrderListingAPI(param, this.onSuccessOrderListing, this.onFailureOrderListing, this.props);
            } else {
                this.strOnScreenMessagePast = this.strOnScreenMessageInProcess = strings('noInternetTitle');
                this.strOnScreenSubtitlePast = this.strOnScreenSubtitleinProcess = strings('noInternet');
                this.setState({ isLoading: false })

            }
        })
    }
    //#endregion

    //#region 
    /** HANDLE INDEX SELECTION */
    handleIndexChange = index => {
        this.scrollView.scrollTo({
            x: metrics.screenWidth * index,
            y: 0,
            animated: true,
        });
        this.setState({
            selectedIndex: index
        });

    };
    //#endregion

    //#region ADD REVIEW
    /**
     * @param { Success Reponse Object For Review } onSuccess
     */
    onSuccessAddReview = (onSuccess) => {
        if (onSuccess.error != undefined) {
            showValidationAlert(
                onSuccess.error.message != undefined
                    ? onSuccess.error.message
                    : strings("generalWebServiceError")
            );
            this.setState({ isLoading: false, isReview: false, reviewText: "", reviewStar: 0 });
        } else {
            if (onSuccess.status == RESPONSE_SUCCESS) {
                AsyncStorage.removeItem("ratingData")
                this.setState({ isLoading: false, isReview: false, reviewText: "", reviewStar: 0 });
                this.checkUser();
            } else {
                showValidationAlert(onSuccess.message);
                this.setState({ isLoading: false, isReview: false, reviewText: "", reviewStar: 0 });
                AsyncStorage.removeItem("ratingData");
                this.checkUser();
            }
        }
    }

    /**
     * @param { Failure Response Object For Rivew } onFailure
     */
    onFailureAddReview = (onFailure) => {
        AsyncStorage.removeItem("ratingData");
        this.checkUser();
    }

    /** ADD REVIEW API */
    addReview() {
        netStatus(status => {
            if (status) {
                if (this.state.reviewText !== "" && this.state.reviewStar !== 0) {

                    this.setState({ isLoading: true });
                    let param = {
                        language_slug: this.props.lan,
                        restaurant_id: this.state.restaurant_id,
                        user_id: this.props.userID,
                        rating: this.state.reviewStar,
                        review: this.state.reviewText
                    }
                    addReviewAPI(param, this.onSuccessAddReview, this.onFailureAddReview, this.props);
                }
            } else {
                showValidationAlert(strings("noInternet"));
            }
        });
    }
    //#endregion


}

const styles = StyleSheet.create({
    itemContainer: {
        margin: 5,
        padding: 4,
        borderRadius: 4,
        backgroundColor: EDColors.primary
    },
    addonView: {
        marginHorizontal: 15,
        marginVertical: 2
    },
    itemTitle: {
        flex: 3,
        color: "#fff",
        padding: 10,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(20),
    },
    rightImage: {
        alignSelf: "center",
        marginHorizontal: 10
    },
    nestedContainer: {
        borderRadius: 6,
        backgroundColor: EDColors.white,
        marginLeft: 15,
        marginRight: 15,
        padding: 2,
        flex: 1
    },
    tabStyle: {
        backgroundColor: EDColors.white,
        borderColor: EDColors.primary,
        alignSelf: "flex-start",

    },
    tabTextStyle: {
        color: EDColors.primary,
        marginLeft: 5,
        marginRight: 5,
        alignSelf: "flex-start",
    },
    activeTabStyle: {
        backgroundColor: EDColors.primary
    },
    activeTabTextStyle: {
        color: "#fff"
    },
    headerViewStyle: {
        flex: 1,
        marginTop: 5,
        backgroundColor: EDColors.white,
        padding: 5,
        borderRadius: 5,
        borderBottomColor: EDColors.primary,
        borderBottomWidth: .5,
        paddingBottom: 10,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    dateStyle: {
        color: EDColors.primary,
        fontSize: getProportionalFontSize(20),
        fontFamily: EDFonts.regular
    },
    textStyle: {
        // flex: 1,
        color: EDColors.black,
        fontSize: getProportionalFontSize(20),
        fontFamily: EDFonts.regular,
        // marginHorizontal: 10
    },
    upcomingView: {
        marginHorizontal: 10,
        alignItems: "center",
        marginTop: 5,
        width: metrics.screenWidth * .85,
        justifyContent: "space-between",
        backgroundColor: EDColors.offWhite,
        paddingHorizontal: 5,
        borderRadius: 5,
        width: "100%",
        elevation: 1,
        alignSelf: "center"
    },
    waitingText: { fontFamily: EDFonts.bold, color: EDColors.primary, flex: 1 },
    loaderImage: { height: metrics.screenHeight * 0.04, width: metrics.screenWidth * 0.04, resizeMode: 'contain' },
    orderStatusView: {
        height: 0.5,
        // flex: 1,
        width: (metrics.screenWidth - 20) / 7 - 10,
        alignSelf: "flex-end",
        marginBottom: 45
    },
    buttonTrackStyle: { flex: 1, alignItems: 'center', backgroundColor: EDColors.primary, borderRadius: 5, marginTop: 10, marginLeft: 5, marginRight: 5 },
    pastOrderView: {
        flex: 1,
        marginTop: 8,
        backgroundColor: EDColors.white,
        paddingHorizontal: 5,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 5
    },
    pastOrderText: {
        color: EDColors.primary,
        fontSize: getProportionalFontSize(16),
        fontFamily: EDFonts.regular
    },
    pastOrderTextStyle: {
        flex: 1,
        color: EDColors.black,
        fontSize: getProportionalFontSize(16),
        fontFamily: EDFonts.regular,
    },
    nestedSubContainer: { marginHorizontal: 10, justifyContent: "space-between", flexDirection: "row", marginTop: 5, marginBottom: 10 },
    textStylePrice: { alignItems: "center", justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 10 },
    mainContainer: { flex: 1, margin: 10 },
    scrollViewStyle: { flex: 1, padding: 5 },
    orderParentView: { width: metrics.screenWidth },
    headerPriceTxt: { fontSize: getProportionalFontSize(17), fontFamily: EDFonts.regular },
    headerFlatList: { marginTop: 15, alignSelf: "center" },
    trackOrderText: { marginVertical: 10, fontSize: getProportionalFontSize(20), color: EDColors.white },
    commentContainer: { marginHorizontal: 10, flexDirection: "row", marginTop: 5, marginBottom: 10 },
    scrollContainerStyle: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: metrics.screenWidth,
    },
    scrollContent: { backgroundColor: EDColors.offWhite, flexDirection: 'row' },

})

export default connect(
    state => {
        return {
            titleSelected: state.navigationReducer.selectedItem,
            checkoutDetail: state.checkoutReducer.checkoutDetail,
            lan: state.userOperations.lan,
            userID: state.userOperations.userIdInRedux,
            token: state.userOperations.phoneNumberInRedux,
            arrayCancelReasons: state.userOperations.cancellationReasons
        };
    },
    dispatch => {
        return {
            saveNavigationSelection: dataToSave => {
                dispatch(saveNavigationSelection(dataToSave));
            },
            saveCancellationReasons: dataToSave => {
                dispatch(saveCancellationReason(dataToSave));
            },
            saveWalletMoney: token => {
                dispatch(saveWalletMoneyInRedux(token))
            }
        };
    }
)(MyOrderContainer);

