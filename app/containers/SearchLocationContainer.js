import React from "react";
import { FlatList, Linking, Platform, StyleSheet, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { PERMISSIONS } from "react-native-permissions";
import { NavigationEvents } from "react-navigation";
import { connect } from "react-redux";
import AddressComponent from "../components/AddressComponent";
import EDPlaceholderComponent from "../components/EDPlaceholderComponent";
import EDRTLText from "../components/EDRTLText";
import EDRTLView from "../components/EDRTLView";
import EDThemeButton from "../components/EDThemeButton";
import { strings } from "../locales/i18n";
import { saveCurrentLocation } from "../redux/actions/User";
import { showDialogue, showNoInternetAlert, showValidationAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import { debugLog, getProportionalFontSize, isRTLCheck, RESPONSE_SUCCESS, GOOGLE_API_KEY } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import { checkPermission } from "../utils/PermissionServices";
import metrics from "../utils/metrics";
import { netStatus } from "../utils/NetworkStatusConnection";
import { deleteAddress, getAddress, getAddressListAPI } from "../utils/ServiceManager";
import BaseContainer from "./BaseContainer";
import { Icon } from "react-native-elements";
import { getCurrentLocation } from "../utils/LocationServiceManager";
import { TouchableOpacity } from "react-native";

class SearchLocationContainer extends React.PureComponent {
    //#region LIFE CYCLE METHODS

    constructor(props) {
        super(props);

        this.strOnScreenMessage = '';
        this.strOnScreenSubtitle = '';

        this.state = {
            isLoading: false,
            locationLoading: false,
            isAsyncSync: false,
            cartData: "",
            addressLine1: "",
            addressLine2: "",
            value: 0,
            latitude: 0.0,
            longitude: 0.0,
            city: "",
            zipCode: "",
            addressId: "",
            selectedIndex: -1,
            sendLocationDetailsBack: this.props.navigation !== undefined && this.props.navigation.state !== undefined && this.props.navigation.state.params !== undefined ?
                this.props.navigation.state.params.getNewLocation : undefined,
            currentLocation: undefined,
            searchType: "geocode"
        };
    }

    componentDidMount = () => {
        this.getCurrentLocation()
        debugLog("PROPS :::", this.props.currentLocation)
    }

    onDidFocus = () => {
        // this.getCurrentLocation()
        this.getAddressList()
    }

    getCurrentLocation = () => {
        netStatus(status => {
            if (status) {
                this.state.currentLocation = undefined
                var paramPermission =
                    Platform.OS === 'ios'
                        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
                        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
                checkPermission(
                    paramPermission,
                    () => {
                        this.setState({ locationLoading: true })
                        getCurrentLocation(
                            onSucces => {
                                debugLog("CALLED FROM getCurrentAddressLocation::::::", onSucces)
                                this.setState({
                                    locationLoading: false,
                                    currentLocation: {
                                        latitude: onSucces.latitude,
                                        longitude: onSucces.longitude,
                                        areaName: onSucces.address.strAddress.split()[0],
                                        address: onSucces.address.strAddress
                                    }
                                })
                            },
                            onFailure => {
                                debugLog('getLocation Fail ::::::::::: ', onFailure);
                                this.setState({ locationLoading: false })

                                showValidationAlert(onFailure.message);
                            },
                            this.props.googleMapKey || GOOGLE_API_KEY
                        );
                    },

                    () => {
                        this.setState({ locationLoading: false })

                        showDialogue(
                            strings('locationPermission'),
                            [{ text: strings("dialogCancel"), isNotPreferred: true }],
                            "",
                            () => {
                                if (Platform.OS == "ios")
                                    Linking.openURL('app-settings:');
                                else
                                    Linking.openSettings()
                            },
                        );
                    })
            }
        })
    }

    setCurrentLocation = () => {
        this.props.saveCurrentLocation(this.state.currentLocation)
        this.navigateToBack()
    }

    onSearchBoxChange = txt => {
        this.setState({ searchType: /^[0-9]*$/.test(txt.trim()) ? "geocode" : undefined })
    }

    /** RENDER METHOD */
    render() {
        return (
            <BaseContainer
                title={strings("changeLocation")}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={this.onBackEventHandler}
                loading={this.state.isLoading || this.state.locationLoading}
                onConnectionChangeHandler={this.getAddressList}>

                {/* MAIN VIEW */}
                <View pointerEvents={this.state.isLoading || this.state.locationLoading ? "none" : 'auto'} style={{ flex: 1, backgroundColor: EDColors.white, padding: 15 }}>

                    {/* NAVIGATION EVENTS */}
                    <NavigationEvents onDidFocus={this.onDidFocus} />

                    {/* GOOGLE PLACES SEARCH */}
                    <GooglePlacesAutocomplete
                        placeholder={strings("searchLocation")}
                        minLength={2}
                        autoFocus={true}
                        returnKeyType={'default'}
                        fetchDetails={true}
                        onPress={this.saveAddressFromSearch}
                        textInputProps={{
                            onChangeText: this.onSearchBoxChange,
                            selectionColor :EDColors.primary,

                        }}
                        nearbyPlacesAPI="GooglePlacesSearch"
                        renderLeftButton={() => {
                            return <Icon name="search" type={"font-awesome"} color={EDColors.blackSecondary} size={22} containerStyle={{ alignSelf: 'center', marginLeft: 10 }} />
                        }}
                        styles={{
                            container: style.locationContainer,
                            textInput: style.searchText,
                            textInputContainer: { justifyContent: "center", paddingVertical: 0 },
                            predefinedPlacesDescription: {
                                color: '#1faadb'
                            },
                            description: {
                                fontFamily: EDFonts.regular
                            },
                            listView: {
                                marginTop: 15,
                            }
                        }}
                        query={{
                            key: this.props.googleMapKey || GOOGLE_API_KEY,
                            language: this.props.lan,
                            location: this.state.currentLocation !== undefined ? `${this.state.currentLocation.latitude},${this.state.currentLocation.longitude}` : undefined,
                            radius: 1000,
                            type: this.state.searchType
                        }}
                    />
                    {this.state.currentLocation !== undefined ?
                        <View style={{ marginTop: 70 }}>
                            <EDRTLText title={strings("nearBy")} style={[style.titleText, { flex: undefined }]} />
                            <TouchableOpacity activeOpacity={1} onPress={this.setCurrentLocation}>
                                <EDRTLView style={style.currentAddress}>
                                    <Icon name="location-arrow" type="font-awesome" color={EDColors.primary} size={25} containerStyle={{ marginRight: 20 }} />
                                    <View style={{ flex: 1 }}>
                                        <EDRTLText title={strings("currentLocation")} style={style.currentLocationText} />
                                        <EDRTLText title={this.state.currentLocation.address} style={style.currentLocationSubText} />

                                    </View>
                                </EDRTLView>
                            </TouchableOpacity>
                        </View>
                        : null}
                    {/* ADD ADDRESS */}
                    {this.props.userID !== undefined && this.props.userID !== null && this.props.userID.trim().length !== 0 ?
                        <EDRTLView style={[style.addView, { marginTop: this.state.currentLocation == undefined ? 60 : 10 }]} >
                            <EDRTLText style={style.titleText}
                                title={strings("addressTitle")}
                            />
                            <EDThemeButton
                                label={strings("addAddress")}
                                style={{ flex: 1, marginTop: 0, height: 40 }}
                                textStyle={{ fontSize: getProportionalFontSize(14) }}
                                onPress={this.onAddAddressEventHandler}
                            />
                        </EDRTLView> : null}

                    {/* ADDRESS LIST */}
                    {this.arrayAddress != undefined && this.arrayAddress != null && this.arrayAddress.length > 0 ? (
                        <FlatList
                            data={this.arrayAddress}
                            extraData={this.state}
                            showsVerticalScrollIndicator={false}
                            ref="flatList"
                            keyExtractor={(item, index) => item + index}
                            renderItem={this.renderAddressList}
                            ItemSeparatorComponent={
                                () => {
                                    return <View style={{ width: "100%", height: 1, backgroundColor: EDColors.separatorColorNew, marginVertical: 0 }} />

                                }
                            }
                        />
                    ) : this.strOnScreenMessage.trim().length > 0 ? (
                        <View style={{ flex: 1 }}>
                            <EDPlaceholderComponent
                                title={this.strOnScreenMessage}
                                subTitle={this.strOnScreenSubtitle}
                            />
                        </View>) : (<View />)}

                    {this.props.userID !== undefined && this.props.userID !== null && this.props.userID.trim().length !== 0 ? null :
                        <EDPlaceholderComponent
                            style={{ marginTop: 20 }}
                            title={strings("savedAddressError")}
                            subTitle={this.strOnScreenMessage}
                            buttonTitle={strings('loginTitle')}
                            onBrowseButtonHandler={this.buttonloginPressed} />
                    }
                </View>

                {/* IF SELECT ADDRESS */}
                {/* {this.arrayAddress != undefined && this.arrayAddress != null && this.arrayAddress.length > 0 ? (
                    <View style={style.continueStyle}>
                        <EDThemeButton
                            isLoading={this.state.isLoading}
                            style={style.contButtonStyle}
                            onPress={this.saveAddressFromList}
                            label={strings("continue")}
                            textStyle={style.orderText}
                        />
                    </View>) : null} */}
            </BaseContainer>
        );
    }
    //#endregion
    saveAddressFromSearch = (data, details) => {
        var localArea = details.address_components.filter(
            x =>
                x.types.filter(t => t == "sublocality_level_1" || t == "locality").length > 0
        )

        if (localArea.length !== 0) {
            localArea = localArea[0].long_name;
        } else {
            localArea = "Untitled"
        }
        let addressData = {
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            areaName: details.formatted_address,
            address: localArea
        }

        this.props.saveCurrentLocation(addressData)
        this.navigateToBack()
    }

    saveAddressFromList = (index) => {
        // if (this.state.selectedIndex == -1)
        //     showValidationAlert(strings("addressSelectionValidation"))
        // else {
        let addressData = {
            latitude: this.arrayAddress[index].latitude,
            longitude: this.arrayAddress[index].longitude,
            areaName: this.arrayAddress[index].address_label !== undefined &&
                this.arrayAddress[index].address_label !== null &&
                this.arrayAddress[index].address_label.trim().length !== 0 ?
                this.arrayAddress[index].address_label :
                this.arrayAddress[index].address.split(',')[0]
            ,
            address: this.arrayAddress[index].address,
            address_id: this.arrayAddress[index].address_id
        }
        this.props.saveCurrentLocation(addressData)
        this.navigateToBack()
        // }
    }
    navigateToBack = () => {
        if (this.state.sendLocationDetailsBack !== undefined)
            this.state.sendLocationDetailsBack()
        this.props.navigation.goBack();
    };
    //#region 
    /** BACK EVENT HANDLER */
    onBackEventHandler = () => {
        this.props.navigation.goBack();
    }
    //#endregion
    buttonloginPressed = () => {
        this.props.navigation.navigate('LoginContainer')
    }
    //#region 
    /** GET DATA */
    getData = () => {
        this.getAddressList();
    };
    //#endregion

    //#region 
    /** INDEX SELECTION */
    onSelectedIndex = (value) => {
        this.setState({ value: value })
    }
    //#endregion

    //#region 
    /** CONTINUE EVENT HANDLER */
    onContinueEventHandler = () => { }
    //#endregion

    //#region ADD ADRRESS
    onAddAddressEventHandler = () => {
        this.navigateTomap("", 1)
    }
    //#endregion

    //#region 
    /** on EDIT PRESSSEDD */

    navigateTomap = (item, index) => {

        netStatus(isConnected => {
            if (isConnected) {
                var paramPermission =
                    Platform.OS === 'ios'
                        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
                        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
                checkPermission(
                    paramPermission,
                    () => {
                        switch (index) {
                            case 1:
                                this.props.navigation.navigate("AddressMapContainer", {
                                    getData: this.getData
                                });
                            case 2:
                                var sendData = {
                                    addressId: item.address_id,
                                    addressLine1: item.address_label,
                                    addressLine2: item.address,
                                    latitude: item.latitude,
                                    longitude: item.longitude,
                                    city: item.city,
                                    zipCode: item.zipcode,
                                    address_label: item.landmark,
                                    state: item.state,
                                    country: item.country
                                };
                                this.props.navigation.navigate("AddressMapContainer",
                                    {
                                        getDataAll: sendData,
                                        getData: this.getData
                                    }
                                );
                                break;
                        }
                    },
                    () => {
                        showDialogue(
                            strings('locationPermission'),
                            [{ text: strings("dialogCancel"), isNotPreferred: true }],
                            '',
                            () => {
                                Linking.openURL('app-settings:');
                            },
                        );
                    }
                )
            } else {
                showNoInternetAlert()
            }
        })
    }


    //#region 
    /** ADRESS ID EEVENT HANDLER */
    onDeleteAddressEventHandler = (address_id) => {
        showDialogue(strings("deleteAddressConfirm"), [{ text: strings("dialogCancel"), isNotPreferred: true }], "", () => this.deleteAddress(address_id));
    }
    //#endregion

    //#region 
    /** CREATE ADDRESS LIST */
    renderAddressList = ({ item, index }) => {
        return (
            <AddressComponent
                data={item}
                index={index}
                isSelectedAddress={this.state.isSelectAddress}
                isSelected={this.props.currentLocation.address_id == item.address_id}
                onPress={this.addressSelectionAction}
                deleteAddress={this.onDeleteAddressEventHandler}
                editAddress={this.navigateTomap}
            />
        );
    }
    //#endregion


    //#region LOAD ADDRESS
    /**
     * @param { Success Response Object } onSuccess
     */
    onSuccessLoadAddress = (onSuccess) => {
        this.strOnScreenMessage = ''

        if (onSuccess != undefined) {
            if (onSuccess.status == RESPONSE_SUCCESS) {
                if (onSuccess.address !== undefined && onSuccess.address.length > 0) {
                    this.arrayAddress = onSuccess.address
                } else {
                    this.arrayAddress = []
                    this.strOnScreenMessage = strings("noDataFound")
                }

                this.setState({ isLoading: false });
            } else {
                this.strOnScreenMessage = strings("noDataFound")
                this.setState({ isLoading: false });
            }
        } else {
            this.strOnScreenMessage = strings("generalWebServiceError");
            this.setState({ isLoading: false });
        }
    }

    /**
     * @param { FAilure Response Objetc } onfailure
     */
    onFailureLoadAddress = (onFailure) => {
        this.strOnScreenMessage = ''
        this.strOnScreenSubtitle = ''
        this.strOnScreenMessage = strings("generalWebServiceError");
        this.setState({ isLoading: false });
    }

    /** GET ADDRESS API */
    getAddressList = () => {
        if (this.props.userID !== undefined && this.props.userID !== null && this.props.userID.trim().length !== 0) {
            this.strOnScreenMessage = '';
            this.strOnScreenSubtitle = '';
            this.setState({ isLoading: true });
            netStatus(status => {
                if (status) {

                    let param = {
                        language_slug: this.props.lan,
                        user_id: this.props.userID || 0,
                        // token: this.props.token
                    }
                    getAddressListAPI(param, this.onSuccessLoadAddress, this.onFailureLoadAddress, this.props);
                } else {
                    this.strOnScreenMessage = strings("noInternetTitle");
                    this.strOnScreenSubtitle = strings("noInternet");
                    this.setState({ isLoading: false });
                }
            });
        }

    }
    //#endregion

    //#region DELETE ADDRESS
    /**
     * 
     * @param { Success Response Object } onSuccess 
     */
    onSuccessDeleteAddress = (onSuccess) => {
        console.log("Address Delete response ::::: ", onSuccess)
        if (onSuccess != undefined) {
            if (onSuccess.status == RESPONSE_SUCCESS) {
                this.props.saveCurrentLocation(undefined)
                this.getAddressList();
            } else {
                showValidationAlert(onSuccess.message);
                this.setState({ isLoading: false });
            }
        } else {
            this.strOnScreenMessage = strings("generalWebServiceError")
            this.setState({ isLoading: false });
        }
    }

    /**
     * 
     * @param {Fauilre Response Objewtc} onFailure 
     */
    onFailureDeleteAddress = (onFailure) => {
        this.setState({ isLoading: false });
        this.strOnScreenMessage = strings("noInternet")
    }

    /** DELETE API */
    deleteAddress(addId) {
        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true , selectedIndex : -1});
                let param = {
                    language_slug: this.props.lan,
                    user_id: this.props.userID,
                    address_id: addId,
                    // token: this.props.token
                }
                deleteAddress(param, this.onSuccessDeleteAddress, this.onFailureDeleteAddress, this.props);
            } else {
                this.strOnScreenMessage = strings('noInternetTitle');
                this.strOnScreenSubtitle = strings('noInternet');
            }
        });
    }
    //#endregion

    addressSelectionAction = (index) => {
        // this.setState({ selectedIndex: index });
        this.saveAddressFromList(index)
    }

}
//#endregion

//#region STYLES
const style = StyleSheet.create({
    locationContainer: {
        width: "100%",
        position: "absolute",
        zIndex: 999,
        backgroundColor: EDColors.offWhite,
        justifyContent: "center",
        paddingHorizontal: 0,
        paddingVertical: 15,
        alignSelf: 'center',
        marginTop: 10
        // shadowColor: EDColors.text,
        // shadowOffset: { height: 0, width: 0 },
        // shadowRadius: 5,
        // elevation: Platform.OS == "android" ? 1 : 0
    },
    searchText: {
        color: EDColors.secondary,
        fontSize: getProportionalFontSize(16),
        borderRadius: 6,
        height: undefined,
        fontFamily: EDFonts.regular,
        backgroundColor: EDColors.transparent,
        paddingVertical: 0,
        marginBottom: 0
    },
    continueStyle: { width: "100%", height: metrics.screenHeight * 0.08, backgroundColor: EDColors.white, marginBottom: 10 },
    contButtonStyle: {
        alignSelf: "center",
        backgroundColor: EDColors.primary,
        justifyContent: "center",
        marginTop: 10,
        width: "50%",
    },
    addView: {
        alignItems: "center",
        marginBottom: 20
        // padding: 10,
        // marginTop: 60
    },
    titleText: {
        color: EDColors.black,
        fontSize: getProportionalFontSize(15),
        fontFamily: EDFonts.medium,
        marginHorizontal: 5,
        flex: 1
    },
    textStyle: {
        fontSize: getProportionalFontSize(14),
        fontFamily: EDFonts.regular,
        flex: 1,
        padding: 5
    },
    orderText: { fontSize: getProportionalFontSize(14) },
    currentAddress: {
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 10
        // flex: 1
    },
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

});
//#endregion

export default connect(
    state => {
        return {
            userID: state.userOperations.userIdInRedux,
            token: state.userOperations.phoneNumberInRedux,
            lan: state.userOperations.lan,
            googleMapKey: state.userOperations.googleMapKey,
            currentLocation: state.userOperations.currentLocation || {},
        };
    },
    dispatch => {
        return {
            saveCurrentLocation: data => {
                dispatch(saveCurrentLocation(data));
            }
        };
    }
)(SearchLocationContainer);
