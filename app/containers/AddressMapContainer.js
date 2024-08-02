/* eslint-disable prettier/prettier */
import React from 'react';
import { Image } from 'react-native';
import { TextInput } from 'react-native';
import { AppState, Dimensions, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationEvents } from 'react-navigation';
import { connect } from 'react-redux';
import Assets from '../assets';
import EDButton from '../components/EDButton';
import EDRTLText from '../components/EDRTLText';
import EDRTLTextInput from '../components/EDRTLTextInput';
import EDRTLView from '../components/EDRTLView';
import EDText from '../components/EDText';
import { strings } from '../locales/i18n';
import { showDialogue, showNoInternetAlert, showValidationAlert } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize, GOOGLE_API_KEY, isRTLCheck, RESPONSE_SUCCESS, TextFieldTypes } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import { getAddress, getAddressFromAddressComponent, getCurrentLocation } from '../utils/LocationServiceManager';
import metrics from '../utils/metrics';
import Metrics from '../utils/metrics';
import { netStatus } from '../utils/NetworkStatusConnection';
import { addAddress, deleteAddress } from '../utils/ServiceManager';
import Validations from '../utils/Validations';
import BaseContainer from './BaseContainer';

let { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0022;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class AddressMapContainer extends React.Component {

    //#region LIFE CYCLE METHODS
    constructor(props) {
        super(props);
        this.city = '';
        this.stateName = '';
        this.country = ''
        this.zipCode = '';
        this.allData = this.props.navigation.state.params.getDataAll;
        this.isGuest = this.props.navigation.state.params.isGuest || false;
        this.hideDefaultButton = false
        this.address_id = '';
        this.strAddress2 = ''
        this.validationsHelper = new Validations();
        this.regionComplete = false
        this.loading = false
        this.regionloading = false
        this.isFirstTimeAddressLoad = true
        this.shouldHandleMapChange = true
    }

    deleteAddressPress = () => {
        if (!this.isGuest && this.address_id !== '')
            showDialogue(
                strings('deleteAddressConfirm'),
                [
                    {
                        text: strings('dialogCancel'),
                        isNotPreferred: true
                    },
                ],
                '',
                () => this.deleteAddress()
            );
    }


    //#region DELETE ADDRESS
    /**
     * 
     * @param { Success Response Object } onSuccess 
     */
    onSuccessDeleteAddress = onSuccess => {
        console.log('Address Delete response ::::: ', onSuccess);
        if (onSuccess != undefined) {
            if (onSuccess.status == RESPONSE_SUCCESS) {
                this.navigateToBack();
            } else {
                showValidationAlert(onSuccess.message);
                this.setState({ isLoading: false });
            }
        } else {
            showValidationAlert(strings("generalWebServiceError"));
            this.setState({ isLoading: false });
        }
    };

    /**
     * 
     * @param {Fauilre Response Objewtc} onFailure 
     */
    onFailureDeleteAddress = onFailure => {
        this.setState({ isLoading: false });
        showValidationAlert(onFailure.addAddress || strings("generalWebServiceError"))
    };

    /** DELETE API */
    deleteAddress() {
        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true });
                let param = {
                    language_slug: this.props.lan,
                    user_id: this.props.UserID,
                    address_id: this.address_id,
                    // token: this.props.token,
                };
                deleteAddress(param, this.onSuccessDeleteAddress, this.onFailureDeleteAddress, this.props);
            } else {
                showNoInternetAlert()
            }
        });
    }


    render() {
        return (
            <BaseContainer
                title={this.props.navigation.state.params.isEdit == 2 ? strings("editAddress") : strings('addAddress')}
                left={'arrow-back'}
                // right={[!this.isGuest && this.address_id !== '' ? { url: "delete", name: "delete", type: "ant-design" } : {}]}
                onLeft={this.navigateToBack}
                // onRight={this.deleteAddressPress}
                loading={this.state.isLoading || this.state.isCurrentLoading}
            >
                <View pointerEvents={this.state.isLoading || this.state.isCurrentLoading ? 'none' : 'auto'} style={style.mainContainer}>
                    {/* MAIN VIEW */}
                    <KeyboardAwareScrollView style={{ flex: 1, backgroundColor: EDColors.white }}
                        bounces={false}
                        keyboardShouldPersistTaps="handled"
                        behavior="padding"
                        showsVerticalScrollIndicator={false}
                        enabled
                        enableAutoAutomaticScroll={false}
                        enableOnAndroid={true}
                    >

                        <View style={style.subContainer}>
                            <View style={{
                                position: "absolute",
                                top: metrics.screenHeight * .12,
                                zIndex: 3,
                                alignSelf: 'center'
                            }}>
                                <Image source={Assets.destination} style={{ height: 30, width: 30 }} />
                            </View>
                            <MapView
                                pointerEvents={this.state.isCurrentLoading || this.state.isLoading ? "none" : "auto"}
                                provider={Platform.OS == 'ios' ? null : PROVIDER_GOOGLE}
                                zoomControlEnabled={true}
                                zoomEnabled={true}
                                showsUserLocation={true}
                                zoom={100}
                                initialRegion={this.state.region}
                                style={style.mapView}
                                region={this.state.region}
                                // onRegionChangeComplete={region => this.setState({ region })}
                                onRegionChangeComplete={this.onRegionHandler}
                                onPress={this.onMapChangeHandler}
                            >
                                {/* <Marker
                                    image={Assets.restaurant}
                                    coordinate={{
                                        latitude: this.state.latitude,
                                        longitude: this.state.longitude,
                                    }}
                                /> */}
                            </MapView>

                        </View>
                        <View style={style.pinTextContainer}>
                            <EDRTLText title={strings('adjustPin')} style={style.pinText} />
                        </View>
                        <EDRTLView style={{ alignItems: 'flex-start', flex: 1, marginHorizontal: 15, }}>
                            <Icon name="search1" type="ant-design" size={20} color={EDColors.black} containerStyle={{ marginTop: 10 }} />
                            <GooglePlacesAutocomplete
                                placeholder={this.state.strAddressNew}
                                minLength={2}
                                numberOfLines={2}
                                returnKeyType={'default'}
                                fetchDetails={true}
                                ref={(instance) => { this.locationRef = instance }}
                                nearbyPlacesAPI="GooglePlacesSearch"
                                // renderLeftButton={() => (
                                //     <View style={[style.childContianer, {

                                //         marginLeft: isRTLCheck() ? 0 : 15,
                                //         marginRight: isRTLCheck() ? 15 : 0,
                                //     }]} >
                                //         <Icon name={"location-pin"} type="simple-line-icon" color={EDColors.blackSecondary} size={20} />
                                //     </View>
                                // )}
                                textInputProps={{
                                    onChangeText: (txt) => {
                                        this.setState({ strAddress2: "", searchType: /^[0-9]*$/.test(txt.trim()) ? "geocode" : undefined })
                                    },
                                    placeholder: this.state.strAddressNew,
                                    editable: true,
                                    selection: { start: 0 },
                                    selectionColor :EDColors.primary,
                                    onBlur: () => {
                                        this.setState({
                                            selection: {
                                                start: 0,
                                                end: 0
                                            }
                                        })
                                    },
                                    onFocus: () => {
                                        this.setState({
                                            selection: {
                                                start: this.state.strAddressNew.length,
                                                end: this.state.strAddressNew.length
                                            }
                                        }, () => {
                                            this.setState({ selection: null })
                                        })
                                    },
                                    selection: this.state.selection,
                                    numberOfLines: 2,
                                    placeholder: strings("searchLocation")

                                }}
                                onPress={this.saveAddressFromSearch}
                                enablePoweredByContainer={false}
                                styles={{
                                    container: style.searchContainer,
                                    textInput: style.searchText,
                                    textInputContainer: style.searchInputContainer,
                                    predefinedPlacesDescription: {
                                        color: '#1faadb',
                                    },
                                    listView: { marginTop: -5 },
                                    description: {
                                        fontFamily: EDFonts.regular,
                                        marginLeft: -5
                                    }
                                }}
                                query={{
                                    key: this.props.googleMapKey || GOOGLE_API_KEY,
                                    language: this.props.lan,
                                    location: this.state.latitude !== 0.0 ? `${this.state.latitude},${this.state.longitude}` : undefined,
                                    radius: 1000,
                                    type: this.state.searchType
                                }}
                            />
                        </EDRTLView>
                        <View style={style.checkboxView}>
                            <TextInput
                                style={style.textContainer}
                                value={this.state.objRegistrationDetails.address_label}
                                defaultValue={this.state.objRegistrationDetails.address_label}
                                selectionColor={EDColors.primary}
                                keyboardType={TextFieldTypes.default}
                                placeholder={strings('apt')}
                                onChangeText={(text) => this.textFieldTextDidChangeHandler(text, 'address_label')}
                            />
                            <EDRTLText title={strings('additionalInfo')} style={style.addressLabel} />

                            <TextInput
                                style={style.textContainer}
                                value={this.state.objRegistrationDetails.strAddress1}
                                defaultValue={this.state.objRegistrationDetails.strAddress1}
                                selectionColor={EDColors.primary}
                                keyboardType={TextFieldTypes.default}
                                placeholder={strings('labelPlaceholder')}
                                onChangeText={(text) => this.textFieldTextDidChangeHandler(text, 'strAddress1')}
                            />

                            {this.props.UserID !== undefined && this.props.UserID !== null && this.hideDefaultButton == false ?
                                <TouchableOpacity onPress={this.toggleHomeAddress}  >
                                    <EDRTLView style={style.checkStyle}>
                                        <Icon
                                            name={this.state.isHome ? "checkbox" : "square-o"}
                                            color={EDColors.primary}
                                            size={getProportionalFontSize(20)}
                                            type={this.state.isHome ? 'ionicon' : 'font-awesome'}
                                            onPress={this.toggleHomeAddress}
                                        />
                                        <Text style={style.homeaddress}>
                                            {strings("setDefaultAddress")}
                                        </Text>
                                    </EDRTLView>
                                </TouchableOpacity> : null}
                        </View>



                        {/* <View style={[style.bottonView, { bottom: Platform.OS == "ios" ? 10 + initialWindowMetrics.insets.bottom : 10 }]}>
                            <View style={style.checkboxView}>
                                <EDRTLTextInput
                                    icon="location-pin"
                                    textstyle={{ color: EDColors.black, fontSize: getProportionalFontSize(16), }}
                                    defaultValue={this.state.objRegistrationDetails.address_label}
                                    initialValue={this.state.objRegistrationDetails.address_label}
                                    identifier={'address_label'}
                                    containerStyle={{ marginHorizontal: 14 }}
                                    customIcon={"edit-3"}
                                    customIconFamily={'feather'}
                                    customIconColor={EDColors.black}
                                    focusOnPress={true}
                                    type={TextFieldTypes.default}
                                    placeholder={strings('apt')}
                                    onChangeText={this.textFieldTextDidChangeHandler}

                                />
                              

                                <EDRTLTextInput
                                    icon="location-pin"
                                    textstyle={{ color: EDColors.black, fontSize: getProportionalFontSize(16), }}
                                    defaultValue={this.state.objRegistrationDetails.strAddress1}
                                    initialValue={this.state.objRegistrationDetails.strAddress1}
                                    identifier={'strAddress1'}
                                    containerStyle={{ marginHorizontal: 14 }}
                                    customIcon={"edit-3"}
                                    customIconFamily={'feather'}
                                    customIconColor={EDColors.black}
                                    focusOnPress={true}
                                    type={TextFieldTypes.default}
                                    placeholder={strings('additionalInfo')}
                                    onChangeText={this.textFieldTextDidChangeHandler}
                                />

                                {this.props.UserID !== undefined && this.props.UserID !== null && this.hideDefaultButton == false ?
                                    <TouchableOpacity onPress={this.toggleHomeAddress}  >
                                        <EDRTLView style={style.checkStyle}>
                                            <Icon
                                                name={this.state.isHome ? "checkbox" : "square-o"}
                                                color={EDColors.primary}
                                                size={getProportionalFontSize(20)}
                                                type={this.state.isHome ? 'ionicon' : 'font-awesome'}
                                                onPress={this.toggleHomeAddress}
                                            />
                                            <Text style={style.homeaddress}>
                                                {strings("setDefaultAddress")}
                                            </Text>
                                        </EDRTLView>
                                    </TouchableOpacity> : null}
                            </View>
                            <View style={style.btnView}>
                                <EDButton
                                    style={style.btnStyle}
                                    textStyle={style.btnText}
                                    label={strings('save')}
                                    onPress={this.onAddressSave}
                                />
                            </View>
                        </View> */}

                    </KeyboardAwareScrollView>
                    <View style={[style.btnView, { bottom: Platform.OS == "ios" ? 15 + initialWindowMetrics.insets.bottom : 15 }]}>
                        <EDButton
                            style={style.btnStyle}
                            textStyle={style.btnText}
                            label={strings('save')}
                            onPress={this.onAddressSave}
                        />
                    </View>
                </View>
            </BaseContainer>
        );
    }

    //#endregion

    onExactAddressChange = text => {

    }

    toggleHomeAddress = () => {
        if (this.state.totalCount !== 0)
            this.setState({ isHome: !this.state.isHome })
    }

    //#region STATE

    state = {
        searchType: "geocode",
        isLoading: false,
        isCurrentLoading: false,
        latitude: 0.0,
        longitude: 0.0,
        isHome: true,
        region: {
            latitude: 0.0,
            longitude: 0.0,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
        },
        objRegistrationDetails: { strAddress1: '', address_label: '', building: '' },
        strAddress2: '',
        strAddressNew: '',

        appState: AppState.currentState,
        shouldPerformValidation: false,
        is_default: false,
        totalCount: this.props.navigation.state.params.totalCount, //TEMP
        // totalCount: 5, //TEMP

        selection: {
            start: 0,
            end: 0
        }
    }
    //#endregion

    componentDidMount() {
        AppState.addEventListener('change', this._handleAppStateChange);
        debugLog("TOTAL ::::::", this.state.totalCount)
        if (this.state.totalCount == 0)
            this.setState({ isHome: true })
        this.viewUpdate();
    }
    componentWillUnmount() {
        AppState.removeEventListener('change', this._handleAppStateChange);
    }

    _handleAppStateChange = (nextAppState) => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            debugLog('App has come to the foreground!');
            debugLog('get back result successs');
            this.viewUpdate();
        }
        this.setState({ appState: nextAppState });
    }

    viewUpdate = () => {
        if (this.allData != undefined && !(this.allData.addressId === '') && this.allData.addressId != undefined) {
            debugLog('Adderss Map ::::::::: ', this.allData);
            let addressData = this.allData;
            this.city = addressData.city;
            this.stateName = addressData.state;
            this.country = addressData.country;
            this.strAddress2 = addressData.addressLine2
            this.zipCode = addressData.zipCode,
                this.address_id = addressData.addressId;
            this.state.objRegistrationDetails.strAddress1 = addressData.addressLine1;
            this.state.objRegistrationDetails.address_label = addressData.address_label;
            this.state.objRegistrationDetails.building = addressData.business;

            debugLog("CALLED FROM viewUpdate :::::::", this.allData)
            this.state.strAddressNew = this.allData.addressLine2
            if (addressData.is_main == "1") {
                this.hideDefaultButton = true
            }
            else {
                this.hideDefaultButton = false
            }
            this.setState({
                // strAddress2: addressData.addressLine2,
                region: {
                    latitude: Number(addressData.latitude),
                    longitude: Number(addressData.longitude),
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                },
                latitude: Number(addressData.latitude),
                longitude: Number(addressData.longitude),
                isHome: true
            });
            setTimeout(() =>
                this.locationRef.setAddressText(addressData.addressLine2), 100)
        }

        else {
            if (
                this.props.navigation !== undefined &&
                this.props.navigation.state !== undefined &&
                this.props.navigation.state.params !== undefined &&
                this.props.navigation.state.params.address_id != undefined) {

                this.address_id = this.props.navigation.state.params.address_id;
                debugLog('address_id :::::: ', this.address_id);
            }
            this.getCurrentAddressLocation();
        }
    }

    //#region TEXT CHANGE EVENTS
    /**
     *
     * @param {Value of textfield whatever user type} value
     ** @param {Unique identifier for every text field} identifier
     */

    textFieldTextDidChangeHandler = (value, identifier) => {
        this.state.objRegistrationDetails[identifier] = value;
        this.setState({ shouldPerformValidation: false });
    }

    onFailureGetAddress = onFailure => {
        debugLog('Address Fail:::::::: ', onFailure);
    }

    onRegionHandler = region => {
        if (this.isFirstTimeAddressLoad) {
            this.isFirstTimeAddressLoad = false
            return
        }
        if (!this.loading && !this.regionloading) {

            this.setState({
                region: {
                    latitude: region.latitude,
                    longitude: region.longitude,
                    latitudeDelta: this.regionComplete ? region.latitudeDelta : LATITUDE_DELTA,
                    longitudeDelta: this.regionComplete ? region.longitudeDelta : LONGITUDE_DELTA,
                },
                latitude: region.latitude,
                longitude: region.longitude,
                isLoading: true,
            });
            this.regionComplete = true
            getAddress(region.latitude,
                region.longitude,
                onSucces => {
                    debugLog('address Location :::::::::: ', onSucces);
                    this.city = onSucces.city;
                    this.stateName = onSucces.state;
                    this.country = onSucces.country;
                    this.zipCode = onSucces.zipCode;
                    debugLog("CALLED FROM onRegion")
                    this.setState({
                        strAddress2: onSucces.strAddress,
                        isLoading: false,
                        key: this.state.key + 1
                    });
                    this.locationRef.setAddressText(onSucces.strAddress)

                },
                this.onFailureGetAddress,
                this.props.googleMapsAPIKey || GOOGLE_API_KEY
            );
        }
    }
    onMapChangeHandler = (e) => {
        if (!this.shouldHandleMapChange) {
            this.shouldHandleMapChange = true
            return;
        }
        if (!this.loading && !this.regionloading) {
            this.loading = true
            this.setState({
                region: {
                    latitude: e.nativeEvent.coordinate.latitude,
                    longitude: e.nativeEvent.coordinate.longitude,
                    latitudeDelta: LATITUDE_DELTA,
                    longitudeDelta: LONGITUDE_DELTA,
                },
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
                isLoading: true,
            });
            getAddress(e.nativeEvent.coordinate.latitude,
                e.nativeEvent.coordinate.longitude,
                onSucces => {
                    debugLog('address Location :::::::::: ', onSucces);
                    this.city = onSucces.city;
                    this.stateName = onSucces.state;
                    this.country = onSucces.country;
                    this.zipCode = onSucces.zipCode;
                    debugLog("CALLED FROM onMapChangeHandler")
                    this.setState({
                        strAddress2: onSucces.strAddress,
                        isLoading: false,
                        key: this.state.key + 1
                    });
                    this.locationRef.setAddressText(onSucces.strAddress) //TEMP

                },
                this.onFailureGetAddress,
                this.props.googleMapsAPIKey || GOOGLE_API_KEY
            );
            this.loading = false
        }
    }

    saveAddressFromSearch = (data, details) => {
        debugLog("TEST ADDRESS ::::", data, details, details.geometry)
        this.setState({
            region: {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            },
            latitude: details.geometry.location.lat,
            longitude: details.geometry.location.lng,
            isLoading: true,
        });
        let address = getAddressFromAddressComponent(details.address_components, details.formatted_address)
        debugLog("ADDRESS FORMATTED :::::", address)
        this.city = address.city;
        this.stateName = address.state;
        this.country = address.country;
        this.zipCode = address.zipCode;
        debugLog("CALLED FROM saveAddressFromSearch")

        this.shouldHandleMapChange = false

        this.setState({
            strAddress2: address.strAddress,
            isLoading: false,
        });
        this.locationRef.setAddressText(address.strAddress) //TEMP

    }


    //#region BUTTON EVENTS
    /**
     *
     * @param {Checking all conditions and redirect to Map screen on success}
     */

    onAddressSave = () => {
        this.setState({ shouldPerformValidation: true });
        // if (this.state.objRegistrationDetails.strAddress1.trim() !== '') {

        debugLog("STR ADDRESS CITY ::::", this.state.strAddress2)
        if (this.state.strAddress2.trim() !== '' || this.state.strAddressNew.trim() !== '')
            this.callAddAddressAPI();
        else
            showValidationAlert(strings("properAddressMessage"))

        // } else {
        //     showDialogue(strings("addressNew.addressValidation"))
        // }
    }

    /**
     *
     * @param {The success response object} objSuccess
     */
    onaddAddressSuccess = objSuccess => {
        debugLog('OBJ SUCCESS ADDRESS :: ' + JSON.stringify(objSuccess));
        this.props.navigation.goBack();
        this.setState({ isLoading: false });
    }

    /**
    *
    * @param {The success response object} objSuccess
    */
    onaddAddressFailure = objFailure => {
        this.setState({ isLoading: false });
        debugLog('OBJ FAILURE ADDRESS :: ', objFailure);
        showValidationAlert(objFailure.message);
    }

    callAddAddressAPI = () => {
        if (this.isGuest) {
            this.props.navigation.state.params.getGuestAddress({
                address_label: this.state.objRegistrationDetails.strAddress1,
                address: this.state.strAddress2.trim().length !== 0 ? this.state.strAddress2 : this.state.strAddressNew.trim().length !== 0 ? this.state.strAddressNew : "",
                latitude: this.state.latitude,
                longitude: this.state.longitude,
                city: this.city,
                zipcode: this.zipCode,
                state: this.stateName,
                country: this.country,
                landmark: this.state.objRegistrationDetails.address_label,
                business: this.state.objRegistrationDetails.building
            })
            this.props.navigation.goBack()

        }
        else
            netStatus(isConnected => {
                if (isConnected) {
                    let objaddAddressParams = {
                        language_slug: this.props.lan,
                        address_label: this.state.objRegistrationDetails.strAddress1,
                        address: this.state.strAddress2.trim().length !== 0 ? this.state.strAddress2 : this.state.strAddressNew.trim().length !== 0 ? this.state.strAddressNew : "",
                        latitude: this.state.latitude,
                        longitude: this.state.longitude,
                        city: this.city,
                        zipcode: this.zipCode,
                        state: this.stateName,
                        country: this.country,
                        is_main: this.state.isHome ? "1" : "0",
                        user_id: this.props.UserID,
                        // token: this.props.PhoneNumber,
                        address_id: this.address_id,
                        landmark: this.state.objRegistrationDetails.address_label,
                        business: this.state.objRegistrationDetails.building

                    };
                    debugLog("ADD ADDRESS PARAM ::::", objaddAddressParams)
                    this.setState({ isLoading: true });
                    addAddress(objaddAddressParams, this.onaddAddressSuccess, this.onaddAddressFailure, this.props);
                } else {
                    showNoInternetAlert();
                }
            });
    }

    getCurrentAddressLocation = () => {

        this.setState({
            isCurrentLoading: true,
        });
        getCurrentLocation(
            onSucces => {
                this.city = onSucces.address.city;
                this.stateName = onSucces.address.state;
                this.country = onSucces.address.country;
                this.zipCode = onSucces.address.zipCode;
                debugLog("CALLED FROM getCurrentAddressLocation::::::", onSucces)

                this.setState({
                    region: {
                        latitude: onSucces.latitude,
                        longitude: onSucces.longitude,
                        latitudeDelta: LATITUDE_DELTA,
                        longitudeDelta: LONGITUDE_DELTA,
                    },
                    latitude: onSucces.latitude,
                    longitude: onSucces.longitude,
                    strAddress2: onSucces.address.strAddress,
                    isCurrentLoading: false,
                });
                this.locationRef.setAddressText(onSucces.address.strAddress) //TEMP
            },
            onFailure => {
                debugLog('getLocation Fail ::::::::::: ', onFailure);
                this.setState({ isCurrentLoading: false });
                showValidationAlert(onFailure.message);
            },
            this.props.googleMapsAPIKey || GOOGLE_API_KEY
        );

    }
    navigateToBack = () => {
        this.props.navigation.goBack();
    }

    onWillFocusEvent = () => {
        // this.props.changeCartButtonVisibility({ shouldShowFloatingButton: false, currentScreen: this.props });
    }
}

export default connect(
    state => {
        return {
            UserID: state.userOperations.userIdInRedux,
            PhoneNumber: state.userOperations.phoneNumberInRedux,
            lan: state.userOperations.lan,
            googleMapsAPIKey: state.userOperations.googleMapKey || '',

        };
    },
    dispatch => {
        return {

        };
    }
)(AddressMapContainer);

export const style = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: EDColors.white,
    },
    mapView: {
        height: Metrics.screenHeight * .3,
    },
    textContainer: {
        color: EDColors.black,
        fontSize: getProportionalFontSize(14),
        backgroundColor: EDColors.radioSelected,
        marginVertical: 10,
        fontFamily: EDFonts.regular,
        paddingHorizontal: 10,
        paddingVertical: 15
    },
    addressLabel: {
        marginHorizontal: 5,
        color: EDColors.black,
        marginTop: 10,
        fontSize: getProportionalFontSize(15),
        fontFamily: EDFonts.semiBold,
        borderTopColor: EDColors.separatorColorNew,
        borderTopWidth: 1,
        paddingTop: 10
    },
    pinTextContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
        backgroundColor: EDColors.white,
        alignSelf: 'center',
        marginTop: -60,
        marginBottom: 25

    },
    pinText: {
        color: EDColors.black,
        fontSize: getProportionalFontSize(13),
        fontFamily: EDFonts.medium
    },
    subContainer: {
        // height: Metrics.screenHeight / 2, padding: 20,
        flex: 1,
    },
    btnStyle: {
        alignSelf: 'center', marginHorizontal: 0, backgroundColor: EDColors.primary,
        width: metrics.screenWidth - 30,
        borderRadius: 0,
        height: metrics.screenHeight * 0.075,
        marginTop: 15
    },
    btnView: {
        alignItems: 'center',
        backgroundColor: EDColors.white,
        borderTopColor: EDColors.separatorColorNew,
        borderTopWidth: 2
    },
    btnText: { textAlign: 'center', fontSize: getProportionalFontSize(16), fontFamily: EDFonts.medium },
    checkStyle: { alignItems: 'center', paddingHorizontal: 0, marginTop: 15, alignItems: 'center' },
    searchContainer: {
        // flex: 1
        // marginTop: 30
    },
    searchInputContainer: {
        backgroundColor: EDColors.white, borderTopColor: EDColors.transparent,
        flex: 1,
        borderBottomColor: EDColors.transparent,
        borderTopWidth: 0,
        borderBottomWidth: 0,
        height: undefined
    },
    checkboxView: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    homeaddress: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(14),
        color: EDColors.black,
        paddingHorizontal: 5
    },
    searchText: {
        // marginHorizontal: 10,
        flex: 1,
        height: undefined,
        // marginTop: 10,
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(15),
        color: EDColors.black,
        // paddingVertical: 5,
        borderBottomColor: EDColors.black,
        borderBottomWidth: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 0

    },
    searchTitle: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(12),
        color: EDColors.text,
        marginHorizontal: 15
    },
    searchView: {
        backgroundColor: EDColors.white,
        borderRadius: 16,
        position: 'absolute',
        marginVertical: 15,
        width: '90%',
        alignSelf: 'center',
        padding: 10,
        paddingTop: 10,
        paddingBottom: 0
        // alignItems: 'center'

    },
    bottonView: {
        // position: 'absolute',
        bottom: 10,
        width: '100%',
    },
    childContianer: {
        // paddingHorizontal: 10,
        backgroundColor: EDColors.transparent,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
