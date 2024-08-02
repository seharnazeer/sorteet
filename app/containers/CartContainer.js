import React from 'react';
import { Platform } from 'react-native';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationEvents } from 'react-navigation';
import { connect } from 'react-redux';
import CartItem from '../components/CartItem';
import { EDCookingInfo } from '../components/EDCookingInfo';
import EDPlaceholderComponent from '../components/EDPlaceholderComponent';
import EDPopupView from '../components/EDPopupView';
import EDRTLText from '../components/EDRTLText';
import EDRTLTextInput from '../components/EDRTLTextInput';
import EDRTLView from '../components/EDRTLView';
import EDThemeButton from '../components/EDThemeButton';
import { strings } from '../locales/i18n';
import { saveCartCount, saveCartPrice, saveCheckoutDetails, saveIsCheckoutScreen } from '../redux/actions/Checkout';
import { clearCurrency_Symbol, getCartList, saveCartData } from '../utils/AsyncStorageHelper';
import { showDialogue } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize, isRTLCheck } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import metrics from '../utils/metrics';
import BaseContainer from './BaseContainer';

export class CartContainer extends React.PureComponent {
    //#region  LIFE CYCLE EMTHODS

    /**CONSTRUCTOR */
    constructor(props) {
        super(props);

        this.cartData = [];
        this.deleteIndex = -1;
        this.cart_id = 0;
        this.cartResponse = undefined;
        this.itemRateToDelete = 0

        this.isview = this.props.navigation.state.params != undefined &&
            this.props.navigation.state.params.isview != undefined &&
            this.props.navigation.state.params.isview != null
            ? this.props.navigation.state.params.isview : false
    }

    /** STATE */
    state = {
        key: 1,
        isLoading: false,
        isAsyncSync: false,
        cartData: '',
        value: 0,
        curr_latitude: 0.0,
        curr_longitude: 0.0,
        showInfoModal: false
    };

    cartTotalPrice = price => { }
    navigateToRestaurant = () => {
        this.props.navigation.push("RestaurantContainer", {
            restId: this.res_id,
            content_id: this.content_id
        })
    }
    // RENDER METHOD
    render() {
        return (
            <BaseContainer
                title={this.resName || ""}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={this.onBackEventHandler}
                loading={this.state.isLoading}
            >


                {this.renderCookingInfo()}
                {/* NAVIGATION EVENTS */}
                <NavigationEvents onWillFocus={this.onWillFocusEvents} />

                {/* DISPLAY MAIN VIEW */}
                {this.state.cartData != '' && this.state.cartData.items.length > 0
                    ? <View style={{ flex: 1, paddingBottom: 5 }}>
                        <FlatList
                            data={this.state.cartData != '' ? this.state.cartData.items : []}
                            keyExtractor={(item, index) => item + index}
                            showsVerticalScrollIndicator={false}
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
                                        addonsItems={
                                            item.addons_category_list === undefined ? [] : item.addons_category_list
                                        }
                                        iscounts={item.addons_category_list === undefined ? true : false}
                                        quantity={item.quantity}
                                        onPlusClick={this.onPlusEventHandler}
                                        onMinusClick={this.onMinusEventHandler}
                                        deleteClick={this.onDeletEventHandler}
                                        totalRate={this.cartTotalPrice}
                                        showCookingInfo={this.showCookingInfo}
                                        removeCookingInfo={this.removeCookingInfo}

                                    />
                                );
                            }}
                        />

                        {/* NEXT VIEW */}
                        <View style={{}}>
                            {this.isview === true
                                ? <View />
                                :
                                <>

                                    {/* <EDRTLView style={style.checkOutContainer}>

                                        <TouchableOpacity style={style.roundButton} onPress={this.props.userID != undefined && this.props.userID != '' ? this.onNextEventHandler : this.navigateToLogin}>
                                            <Text style={[style.button, { fontFamily: EDFonts.medium, fontSize: getProportionalFontSize(16) }]}>
                                                {this.props.userID != undefined && this.props.userID != '' ? strings('next') : strings('loginTitle')}
                                            </Text>
                                        </TouchableOpacity>
                                    </EDRTLView> */}
                                    <View style={{ marginHorizontal: 10 }}>
                                        {this.props.userID != undefined && this.props.userID != '' ? null :

                                            <EDThemeButton
                                                style={[style.themeButton, {
                                                    backgroundColor: EDColors.white,
                                                    borderColor: EDColors.separatorColorNew,
                                                    borderWidth: 1.5,
                                                    marginBottom: 0
                                                }]}
                                                textStyle={[style.themeButtonText, { color: EDColors.black }]}
                                                label={strings('guestCheckout')}
                                                onPress={this.onNextEventHandler}
                                            />
                                        }
                                        <EDThemeButton
                                            style={[style.themeButton, {
                                                marginBottom: (Platform.OS == "ios" ? initialWindowMetrics.insets.bottom : 0) + 5,
                                            }]}
                                            textStyle={style.themeButtonText}
                                            label={this.props.userID != undefined && this.props.userID != '' ? strings('next') : strings('loginTitle')}
                                            onPress={this.props.userID != undefined && this.props.userID != '' ? this.onNextEventHandler : this.navigateToLogin}
                                        />
                                    </View>
                                    {/* TEMPORARY */}
                                    {/* <EDRTLView style={style.checkOutContainer}>

                                        <TouchableOpacity style={style.roundButton} onPress={this.onNextEventHandler}>
                                            <Text style={[style.button, { fontFamily: EDFonts.medium, fontSize: getProportionalFontSize(16) }]}>
                                                {strings('next')}
                                            </Text>
                                        </TouchableOpacity>
                                    </EDRTLView> */}
                                </>
                            }
                        </View>
                    </View>
                    : this.state.cartData != '' && this.state.cartData.items.length <= 0
                        ? <View style={{ flex: 1, height: metrics.screenHeight * 0.9 }}>
                            <EDPlaceholderComponent
                                title={strings('emptyCartMsg')}
                            // subTitle={this.strOnScreenSubtitle}
                            />
                        </View>
                        : null}
            </BaseContainer>
        );
    }
    //#endregion

    //#region
    /** BACK EVENT HANDLER */
    onBackEventHandler = () => {
        this.props.navigation.goBack();
    };
    //#endregion


    showCookingInfo = (index) => {
        this.selectedIndex = index
        this.comment = this.state.cartData.items[index].comment
        this.setState({ showInfoModal: true })
    };

    removeCookingInfo = (index) => {
        var array = this.state.cartData;
        array.items[index].comment = ""
        this.updateUI(array);
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
                // style={{ justifyContent: 'flex-end' }}
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
        var array = this.state.cartData;
        if (instruction !== undefined &&
            instruction !== null &&
            instruction.trim().length !== 0
        ) {
            array.items[this.selectedIndex].comment = instruction
            this.updateUI(array);
        }
        this.hideCookingInfo()
    }

    //#region
    /** ON PLUS CLICKED */
    onPlusEventHandler = (value, index) => {
        if (value > 0) {
            this.state.cartData.items[index].quantity = value;
            this.updateUI(this.state.cartData);
        }
    };
    //#endregion

    //#region
    /** ONMINUS CLICKED */
    onMinusEventHandler = (value, index) => {
        if (value > 0) {
            this.state.cartData.items[index].quantity = value;
            this.updateUI(this.state.cartData);
        } else if (value == 0) {
        }
    };
    //#endregion

    //#region
    /** ON DLEETE CLICKED */
    onDeletEventHandler = (index, rate) => {
        this.itemRateToDelete = rate
        this.deleteIndex = index;
        // this.setState({ isDeleteVisible: true });
        showDialogue(
            strings('deleteFromCart'),
            [{ text: strings('dialogYes'), onPress: this.onYesEventHandler, buttonColor: EDColors.offWhite }],
            '',
            this.onNoEventHandler
            ,
            strings('dialogNo'),
            true
        );
    };
    //#endregion

    //#region
    // /** NEXT BUTTON EVENT  */ TO BE USED DURING GUEST CHECKOUT
    onNextEventHandler = () => {
        // if (this.props.userID != undefined && this.props.userID != '') {
        saveCartData(
            this.state.cartData,
            onSuccess => {
                this.props.navigation.navigate('AddressListContainer', {
                    isSelectAddress: true,
                    resId: this.res_id,
                    cartItems: this.state.cartData.items
                });
            },
            onfalilure => { }
        );

    };

    //#endregion
    navigateToLogin = () => {
        this.props.saveIsCheckoutScreen(true)
        this.props.navigation.navigate('LoginContainer', {
            isCheckout: true,
        });
    }



    //#region
    /** BUTTON PRESSED EVENTS */
    onYesEventHandler = () => {
        var array = this.state.cartData.items;
        if (this.props.cartPrice != undefined && this.props.cartPrice !== null && Number(this.props.cartPrice) >= Number(this.itemRateToDelete)) {
            var price = Number(this.props.cartPrice) - Number(this.itemRateToDelete)
            this.props.saveCartPrice(price)
        }
        array.splice(this.deleteIndex, 1);
        this.updateUI(this.state.cartData);
    };

    onNoEventHandler = () => {
        this.deleteIndex = -1;
    };
    //#endregion

    //#region NETWORK
    //#region CART LIST
    /** GET CART LIST FROM ASYNC */
    getCartDataList = () => {
        this.setState({ isLoading: true });
        getCartList(
            success => {
                var cartArray = success;
                this.promoCode = success.coupon_name;
                this.promoArray = success.coupon_array;
                debugLog("PROMO ARRAY :::::", this.promoArray)
                this.res_id = success.resId;
                this.content_id = success.content_id;
                this.cart_id = success.cart_id;
                this.resName = success.resName
                this.state.isAsyncSync = true;
                if (success.items.length == 0) {
                    this.props.navigation.goBack();
                }
                this.setState({ cartData: cartArray, key: this.state.key + 1, isLoading: false });
            },
            emptyList => {
                this.cartResponse = { items: [] };
                this.setState({ isAsyncSync: true, isLoading: false });
            },
            error => {
                this.cartResponse = { items: [] };
                this.setState({ isAsyncSync: true, isLoading: false });
            }
        );
    };
    //#endregion

    //#region UPDATE UI
    updateUI(response) {
        this.cart_id = response.cart_id;
        this.res_id = response.resId;
        this.content_id = response.content_id;
        var updatedCart = {
            resId: response.resId,
            content_id: response.content_id,
            items: response.items,
            coupon_name: response.coupon_name,
            coupon_array: response.coupon_array,
            cart_id: response.cart_id,
            resName: response.resName,
        };

        saveCartData(updatedCart, success => { }, fail => { });
        if (response.items.length == 0) {
            this.props.saveCartCount(0);
            clearCurrency_Symbol(onSuccess => { }, onfailure => { });
            this.props.navigation.goBack();
        } else {
            this.updateCount(response.items);
        }
        this.setState({
            cartData: response,
            key: this.state.key + 1,
        });
    }
    //#endregion

    updateCount(data) {
        var count = 0;
        var price = 0
        var array = []
        var subArray = []
        data.map((item, index) => {
            count = count + item.quantity;
            price = item.offer_price !== undefined && item.offer_price !== ''
                ? Number(price) + (item.quantity * Number(item.offer_price))
                : Number(price) + (item.quantity * Number(item.price))
            if (item.addons_category_list != undefined && item.addons_category_list != []) {
                array = item.addons_category_list
                array.map(data => {
                    subArray = data.addons_list
                    subArray.map(innerData => {
                        price = Number(price) + (item.quantity * Number(innerData.add_ons_price))
                    })
                })
            }
        });
        this.props.saveCartCount(count);
        this.props.saveCartPrice(price);
    }

    //#region
    onWillFocusEvents = payload => {
        this.getCartDataList();
    };
    //#endregion

}

//#region STYLES
export const style = StyleSheet.create({
    checkOutContainer: {
        margin: 10,
        borderRadius: 16,
        alignSelf: 'center',
        backgroundColor: EDColors.primary,
        width: '90%',
        alignItems: 'center',
        justifyContent: 'center'
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
        paddingHorizontal: 10,
    },
    themeButtonText: {
        color: EDColors.white,
        textAlign: 'center',
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(17),
    },
    addMoreText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(16),
        alignSelf: 'center',
        backgroundColor: EDColors.white,
        borderRadius: 16,
        padding: 10,
        paddingVertical: 15,
        width: metrics.screenWidth - 20,
        flex: 1,
        marginHorizontal: 10,
        textAlign: 'center',
        color: EDColors.black,
        borderColor: EDColors.separatorColorNew,
        borderWidth: 1,
        textAlignVertical: "center"
    },
    totalPrice: {
        flex: 1,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(22),
        alignSelf: 'center',
        marginLeft: 10,
    },
    roundButton: {
        alignSelf: 'center',
        margin: 10,
        borderRadius: 16,
        alignSelf: 'center',
        backgroundColor: EDColors.primary,
        width: '90%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    button: {
        paddingTop: 10,
        paddingRight: 20,
        paddingLeft: 20,
        paddingBottom: 10,
        color: '#fff',
        fontFamily: EDFonts.regular,
    },
});
//#endregion

export default connect(
    state => {
        return {
            userID: state.userOperations.userIdInRedux,
            token: state.userOperations.phoneNumberInRedux,
            cartCount: state.checkoutReducer.cartCount,
            lan: state.userOperations.lan,
            currency: state.checkoutReducer.currency_symbol,
            cartPrice: state.checkoutReducer.cartPrice,
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
            saveCartPrice: data => {
                dispatch(saveCartPrice(data));
            },
            saveIsCheckoutScreen: data => {
                dispatch(saveIsCheckoutScreen(data));
            },
        };
    }
)(CartContainer);
