import React from 'react';
import { FlatList } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux'
import { strings } from '../locales/i18n';
import { debugLog, funGetFrench_Curr, getProportionalFontSize, isRTLCheck, RESPONSE_SUCCESS } from '../utils/EDConstants';
import BaseContainer from './BaseContainer';
import { EDCardComponent } from '../components/EDCardComponent'
import { EDColors } from '../utils/EDColors';
import EDThemeButton from '../components/EDThemeButton';
import { EDFonts } from '../utils/EDFontConstants';
import { netStatus } from '../utils/NetworkStatusConnection';
import { showConfirmationDialogue, showDialogueNew, showNoInternetAlert, showValidationAlert } from '../utils/EDAlert';
import { NavigationEvents } from 'react-navigation';
import { getSavedCardsAPI, deleteCardAPI, addNewCard } from '../utils/ServiceManager';
import EDPlaceholderComponent from '../components/EDPlaceholderComponent';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { Platform } from 'react-native';
import { initialWindowMetrics } from 'react-native-safe-area-context';

class SavedCardsContainer extends React.Component {

    isForSelection =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.isForSelection : false


    isForAddressList =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.isForAddressList : false

    isForRecharge =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.isForRecharge : false
    isForTip =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.isForTip : false

    isCustom =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.isCustom : false

    tip_percent_val =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.tip_percent_val : ""

    order_id =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.order_id : ""

    refreshDefaultCard =
        this.props.navigation.state !== undefined &&
            this.props.navigation.state.params !== undefined ?
            this.props.navigation.state.params.refreshDefaultCard : undefined


    strOnScreenMessage = ""
    strOnScreenSubtitle = ""
    state = {
        isLoading: false,
        selectedCard: {},
        cards: []
    }


    componentDidMount = () => {
        // this.isForSelection ?
        //     this.setState({
        //         selectedCard:
        //             cards.filter(cardData => { return new Date() < new Date().setFullYear(cardData.exp_year, cardData.exp_month, 1) })[0]
        //     }) : null
    }

    onWillFocus = () => {
        this.fetchCards()
    }

    fetchCards = () => {
        this.strOnScreenMessage = "";
        this.strOnScreenSubtitle = "";
        this.state.cards = []

        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true })
                let userParams = {
                    language_slug: this.props.lan,
                    user_id: this.props.userID,
                    isLoggedIn: 1
                }
                getSavedCardsAPI(userParams, this.onSuccessFetchCards, this.onFailureFetchCards, this.props)
            }
            else {
                this.strOnScreenMessage = strings('noInternetTitle');
                this.strOnScreenSubtitle = strings('noInternet');
                this.setState({ isLoading: false });

            }
        })
    }

    onSuccessFetchCards = onSuccess => {
        if (onSuccess.stripe_response !== undefined &&
            onSuccess.stripe_response !== null &&
            onSuccess.stripe_response.length !== 0
        ) {
            let valid_cards = []
            if (this.isForSelection || this.isForAddressList) {
                valid_cards = onSuccess.stripe_response.filter(cardData => { return new Date() < new Date().setFullYear(cardData.card.exp_year, cardData.card.exp_month, 1) })

            }
            this.setState({
                cards: onSuccess.stripe_response,
                selectedCard: valid_cards !== undefined && valid_cards !== null && valid_cards.length !== 0 ? valid_cards[0] : {}
            })
        }
        else {
            this.strOnScreenMessage = strings("noCards");
            this.strOnScreenSubtitle = "";
        }

        this.setState({ isLoading: false });
    }

    onFailureFetchCards = onFailure => {
        this.strOnScreenMessage = onFailure.message || strings("generalWebServiceError");
        this.strOnScreenSubtitle = "";
        this.setState({ isLoading: false });
    }

    onPayment = () => {
        debugLog("this.props.navigation.state.params.pendingTotalPayment ::::", this.props.navigation.state.params.pendingTotalPayment)
        this.props.navigation.navigate("StripePaymentContainer", {
            "currency_code": this.props.navigation.state.params.currency_code,
            isPendingAdded: false,
            pendingTotalPayment: this.props.navigation.state.params.pendingTotalPayment,
            extra_comment: this.props.navigation.state.params.delivery_instructions,
            delivery_instructions: this.props.navigation.state.params.delivery_instructions,
            completeAddress: this.props.navigation.state.params.completeAddress,
            isWithSavedCard: true,
            selectedCard: this.state.selectedCard,
            isForSelection: true,
            isForTip: this.isForTip,
            isForRecharge: this.isForRecharge,
            isCustom: this.isCustom,
            tip_percent_val: this.tip_percent_val,
            order_id: this.order_id,
            cardCount: this.state.cards.length
            
        })
    }


    onNewCard = () => {
        this.isForSelection ?
            this.props.navigation.navigate("StripePaymentContainer", {
                "currency_code": this.props.navigation.state.params.currency_code,
                isPendingAdded: false,
                pendingTotalPayment: this.props.navigation.state.params.pendingTotalPayment,
                extra_comment: this.props.navigation.state.params.delivery_instructions,
                delivery_instructions: this.props.navigation.state.params.delivery_instructions,
                completeAddress: this.props.navigation.state.params.completeAddress,
                isWithSavedCard: false,
                isForSelection: true,
                isForTip: this.isForTip,
                isForRecharge: this.isForRecharge,
                order_id: this.order_id,
                cardCount: this.state.cards.length

            }) :
            this.props.navigation.navigate("StripePaymentContainer", {
                isWithSavedCard: false,
                isForSelection: false,
                isForTip: this.isForTip,
                isForRecharge: this.isForRecharge,
                order_id: this.order_id,
                cardCount: this.state.cards.length

            })
    }

    deleteCard = (card) => {
        showConfirmationDialogue(strings('askDeleteCard'), [], strings("appName"), () => {
            this.deleteCardAPI(card)
        })
    }


    deleteCardAPI = (card) => {
        netStatus(
            status => {
                if (status) {
                    this.setState({ isLoading: true })
                    var params = {
                        language_slug: this.props.lan,
                        payment_method_id: card.id,
                        user_id: this.props.userID,
                        isLoggedIn: this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" ? 1 : 0
                    }
                    deleteCardAPI(params, this.onCardDeleteSuccess, this.onCardDeleteFailure, this.props)
                }
                else {
                    showNoInternetAlert();
                }
            }
        )
    }

    onCardDeleteSuccess = (onSuccess) => {
        if (onSuccess.status == RESPONSE_SUCCESS) {
            showDialogueNew(onSuccess.message, [], strings("appName"), () => {
                this.fetchCards()
            });
        }
        else {
            showValidationAlert(onSuccess.message)
        }
        this.setState({ isLoading: false })

    }

    onCardDeleteFailure = (onFailure) => {
        showValidationAlert(onFailure.message || strings('generalWebServiceError'))
        this.setState({ isLoading: false })

    }

    updateCardAPI = (cardData) => {
        netStatus(
            status => {
                if (status) {
                    this.setState({ isLoading: true })
                    var params = {
                        is_default_card: 1,
                        isForEditing: true,
                        country_code: cardData.billing_details.address.country,
                        language_slug: this.props.lan,
                        exp_month: cardData.card.exp_month,
                        exp_year: cardData.card.exp_year,
                        user_id: this.props.userID,
                        payment_method_id: cardData.id,
                        zipcode: cardData.billing_details.address.postal_code,
                        isLoggedIn: 1
                    }

                    addNewCard(params, this.onCardUpdateSuccess, this.onCardUpdateFailure, this.props)
                }
                else {
                    showNoInternetAlert();
                }
            }
        )
    }

    onCardUpdateSuccess = (onSuccess) => {
        if (onSuccess.status == RESPONSE_SUCCESS) {
            this.isForAddressList ?
                this.onBackEventHandler() :
                this.fetchCards()
        }
        else {
            showValidationAlert(onSuccess.message)
        }
        this.setState({ isLoading: false })

    }

    onCardUpdateFailure = (onFailure) => {
        showValidationAlert(onFailure.message || strings('generalWebServiceError'))
        this.setState({ isLoading: false })

    }

    onBackEventHandler = () => {
        this.props.navigation.goBack()
    }

    onCardPress = cardData => {
        if (new Date() < new Date().setFullYear(cardData.card.exp_year, cardData.card.exp_month, 1))
            this.setState({ selectedCard: cardData })
        // if (this.isForAddressList) {
        //     // if (this.refreshDefaultCard)
        //     //     this.refreshDefaultCard(cardData)
        //     // this.onBackEventHandler()
        //     this.updateCardAPI(cardData)
        // }
    }

    renderCard = ({ item }) => {
        return <EDCardComponent data={item} isForListing={this.isForSelection} isForAddressList={this.isForAddressList} onCardPress={this.onCardPress} selectedCard={
            this.state.selectedCard !== undefined &&
                this.state.selectedCard.card !== undefined


                ?
                this.state.selectedCard.card.fingerprint : ""}
            deleteCard={this.deleteCard}
            editCard={this.editCard}

        />
    }

    editCard = card => {
        this.props.navigation.navigate("StripePaymentContainer", {
            isWithSavedCard: false,
            isForSelection: false,
            isForEditing: true,
            selectedCard: card

        })
    }


    render() {
        return (
            <BaseContainer
                title={strings("savedCards")}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={this.onBackEventHandler}
                loading={this.state.isLoading}
            >
                <NavigationEvents onWillFocus={this.onWillFocus} />

                <View style={styles.mainContainer} pointerEvents={this.state.isLoading ? "none" : "auto"}>
                    {this.state.isLoading ? null : <>
                        {this.state.cards.length !== 0 ?
                            <FlatList
                                data={this.state.cards}
                                extraData={this.state}
                                keyExtractor={(item) => item.fingerprint}
                                renderItem={this.renderCard}
                                showsVerticalScrollIndicator={false}
                            /> :
                            (this.strOnScreenMessage || '').trim().length > 0 ? (
                                <EDPlaceholderComponent
                                    title={this.strOnScreenMessage}
                                    subTitle={this.strOnScreenSubtitle}
                                />) : null}
                        {
                            this.isForSelection && this.state.cards.length !== 0 ?
                                <EDThemeButton label={

                                    strings('payNow') + " - " +
                                    this.props.currency +
                                    funGetFrench_Curr(this.props.navigation.state.params.pendingTotalPayment, 1, this.props.lan
                                    )} style={[styles.btnStyle, {
                                        marginVertical: 10,
                                        marginBottom: 0,
                                    }]} textStyle={[styles.btnText]}
                                    onPress={this.onPayment}
                                /> : null
                        }

                        {!this.isForSelection &&
                            this.state.selectedCard.card !== undefined && this.state.selectedCard.is_default_card != "1" ?
                            <EDThemeButton label={

                                strings('setDefaultCard')}
                                onPress={() => this.updateCardAPI(this.state.selectedCard)}
                                style={[styles.btnStyle, {
                                    marginVertical: 10,
                                    marginBottom: 0,
                                }]} textStyle={[styles.btnText]}
                            /> : null
                        }
                        < EDThemeButton label={strings('addCard')}
                            onPress={this.onNewCard}
                            style={[styles.btnStyle, {
                                marginTop: 10,
                                width: "100%",
                                backgroundColor: EDColors.white,
                                borderColor: EDColors.primary,
                                borderWidth: 1,
                                marginBottom: (Platform.OS == "ios" ? initialWindowMetrics.insets.bottom : 0) + 0,
                            }]} textStyle={[styles.btnText, { color: EDColors.primary }]} />
                    </>}
                </View>

            </BaseContainer>
        )
    }
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: EDColors.white,
        padding: 15,
        paddingBottom: 10
    },
    payButton: {
        marginVertical: 10,
        paddingVertical: 12,
        width: "100%",
        height: undefined
    },
    addNewBtn: {
        marginTop: 0,
        width: "100%",
        backgroundColor: EDColors.white,
        borderColor: EDColors.primary,
        borderWidth: 1,
        paddingVertical: 12,
        height: undefined

    },
    btnStyle: {
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
    btnText: {
        color: EDColors.white,
        textAlign: 'center',
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(17),
    },
})

export default connect(
    state => {
        return {

            lan: state.userOperations.lan,
            userID: state.userOperations.userIdInRedux,
            currency: state.checkoutReducer.currency_symbol,

        };
    },
    dispatch => {
        return {

        };
    }
)(SavedCardsContainer);
