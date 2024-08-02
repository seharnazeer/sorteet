import React from 'react';
import { AppState, Clipboard, Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch } from 'react-native';
import Toast, { DURATION } from "react-native-easy-toast";
import { Icon } from 'react-native-elements';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import Share from "react-native-share";
import { connect } from 'react-redux';
import Assets from '../assets';
import EDEarnMoreComponent from '../components/EDEarnMoreComponent';
import EDProfilePicture from '../components/EDProfilePicture';
import EDRTLText from '../components/EDRTLText';
import EDRTLTextInput from '../components/EDRTLTextInput';
import EDRTLView from '../components/EDRTLView';
import { strings } from '../locales/i18n';
import { saveCartCount } from '../redux/actions/Checkout';
import { saveLanguageInRedux, saveUserDetailsInRedux, saveUserFCMInRedux } from '../redux/actions/User';
import { flushAllData, getUserFCM, saveLanguage, saveUserFCM, saveUserLogin } from '../utils/AsyncStorageHelper';
import { showDialogue, showDialogueNew, showValidationAlert } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { boldify, debugLog, getProportionalFontSize, GOOGLE_WEBCLIENT_ID, isRTLCheck, RESPONSE_SUCCESS, TextFieldTypes } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import { checkFirebasePermission } from '../utils/FirebaseServices';
import metrics from '../utils/metrics';
import { netStatus } from '../utils/NetworkStatusConnection';
import { deleteUser, qrPoints, updateProfile } from '../utils/ServiceManager';
import BaseContainer from './BaseContainer';
import Validations from '../utils/Validations';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager } from 'react-native-fbsdk-next';

// const APP_STORE_LINK = this.props.storeURL.app_store_url;
// const PLAY_STORE_LINK = this.props.storeURL.play_store_url;

class ProfileContainer extends React.PureComponent {
    //#region LIFE CYCLE METHODS

    constructor(props) {
        super(props);

        this.firebaseOff = false;
        this.qr_points = 0
        this.validationsHelper = new Validations()

        this.state = {
            isLoading: false,
            ImageSource: this.props.image || undefined,
            isNotification: this.props.notification === '0' ? false : true,
            firstName: this.props.firstName || '',
            lastName: this.props.lastName || '',
            PhoneNumber: this.props.token || '',
            phoneCode: this.props.phoneCode || '',
            email: this.props.email || '',
            txtFocus: false,
            appState: AppState.currentState,
            firebaseToken: '',
            changedPhone: this.props.token || '',
        };
    }

    componentDidMount() {
        this.checkPushPermission();
        // this.getUserqrPoint();
        AppState.addEventListener('change', this._handleAppStateChange);
    }
    /**
      * @param { Applications status Active or Background } nextAppState
      */
    _handleAppStateChange = nextAppState => {
        if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
            this.getToken();
        }
        this.setState({ appState: nextAppState });
    };
    //#endregion
    checkPushPermission = () => {
        getUserFCM(
            success => {
                if (success.length > 0) {
                    this.firebaseOff = false;
                } else {
                    this.firebaseOff = true;
                    this.setState({ isNotification: false });
                    this.getToken();
                }
            },
            failure => {
                this.firebaseOff = true;
                this.setState({ isNotification: false });
            }
        );
    };

    getUserqrPoint = () => {
        let qrParams = {
            // token: this.props.token,
            user_id: this.props.userID || 0,
        }
        this.setState({ isLoading: true })
        qrPoints(
            qrParams,
            this.onSuccessqrPoints,
            this.onFailureqrPoints
        )
    }
    //#endregion

    onSuccessqrPoints = (onSuccess) => {
        if (onSuccess.status == RESPONSE_SUCCESS) {
            this.qr_points = onSuccess.EarningPoints

        } else {
            showValidationAlert(onSuccess.message);
        }
        this.setState({ isLoading: false })
    }

    onFailureqrPoints = () => {
        this.setState({ isLoading: false })
        showValidationAlert(strings("generalWebServiceError"));
    }

    /** DID MOUNT */
    getToken = () => {
        if (
            this.props.firebaseToken === undefined ||
            this.props.firebaseToken === null ||
            this.props.firebaseToken === ''
        ) {
            checkFirebasePermission(
                onSuccess => {
                    this.props.saveToken(onSuccess);
                    this.firebaseOff = false;
                    this.setState({ firebaseToken: onSuccess });
                    saveUserFCM(onSuccess, success => { }, failure => { });
                },
                error => {
                    this.firebaseOff = true;
                }
            );
        } else {
            this.firebaseOff = false;
            this.props.saveToken(this.props.firebaseToken);
            saveUserFCM(this.props.firebaseToken, success => { }, failure => { });
            this.setState({ firebaseToken: this.props.firebaseToken });
        }
    };

    onDeletePress = () => {
        showDialogue(
            strings('deleteAccountConfirm'),
            [{ text: strings('dialogYes'), onPress: this.callDeleteAPI }],
            strings('appName'),
            () => { }
            ,
            strings('dialogNo'),
            true
        );
    }

    changeName = () => {
        this.firstName.focus()
    }
    //#endregion

    // RENDER METHOD
    render() {
        return (
            <BaseContainer
                title={strings('myAccount')}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[{ url: 'done', type: 'MaterialIcons' }]}
                onRight={this.onRightEventHandler}
                onLeft={this.onBackEventHandler}
                loading={this.state.isLoading}
            >



                {/* TOAST */}
                <Toast ref="toast" position="center" fadeInDuration={0} />

                {/* MAIN CONTAINER */}
                <View style={{ flex: 1 }}>


                    {/* SCROLL VIEW */}
                    <ScrollView>

                        {/* PROFILE IMAGE COMPONENT */}
                        {/* <EDProfilePicture
                            imagePath={this.state.ImageSource}
                            onImageSelectionHandler={this.onImageSelectionHandler}
                        /> */}

                        {/* USER NAME */}
                        {/* <View style={{ alignSelf: 'center' }}>
                            <Text style={{ fontSize: 16, fontFamily: EDFonts.bold, margin: 5 }}>
                                {(this.state.firstName || '') + ' ' + (this.state.lastName || '')}
                            </Text>
                        </View> */}

                        {/* CHILD VIEW CONTAINER */}
                        <View style={style.childViewContainer}>

                            {this.state.PhoneNumber !== undefined && this.state.PhoneNumber != '' ? (
                                <EDRTLTextInput
                                    type={TextFieldTypes.default}
                                    countryData={this.props.countryArray}
                                    dialCode={this.state.phoneCode}
                                    icon="call"
                                    type={TextFieldTypes.phone}
                                    editableBox={false}
                                    initialValue={this.state.PhoneNumber}
                                    labelStyle={{ fontSize: getProportionalFontSize(12) }}
                                    placeholder={strings('phoneNumber')}
                                />
                            ) : null}

                            {/* EMAIL */}

                            <EDRTLTextInput
                                type={TextFieldTypes.default}
                                icon="email"
                                editableBox={this.props.isSocialLogin ? false : true}
                                labelStyle={{ fontSize: getProportionalFontSize(12) }}
                                initialValue={this.state.email}
                                onChangeText={this.onEmailtChangeHanlder}
                                placeholder={strings('email')}
                                customIcon={this.props.isSocialLogin ? null : "edit-3"}
                                customIconFamily={this.props.isSocialLogin ? null : 'feather'}
                                customIconColor={EDColors.grayNew}
                                focusOnPress={true}
                            />

                            {/* USER NAME */}

                            <EDRTLTextInput
                                type={TextFieldTypes.default}
                                icon="person"
                                identifier={'FirstName'}
                                labelStyle={{ fontSize: getProportionalFontSize(12) }}
                                initialValue={this.state.firstName}
                                onChangeText={this.onTextChangeHanlder}
                                placeholder={strings('firstName')}
                                customIcon={"edit-3"}
                                customIconFamily={'feather'}
                                customIconColor={EDColors.grayNew}
                                focusOnPress={true}
                            />

                            {/* LAST NAME */}
                            {this.props.lastName !== undefined ? (

                                <EDRTLTextInput
                                    type={TextFieldTypes.default}
                                    icon="person"
                                    identifier={'FirstName'}
                                    labelStyle={{ fontSize: getProportionalFontSize(12) }}
                                    initialValue={this.state.lastName}
                                    onChangeText={this.onLastTextChangeHanlder}
                                    placeholder={strings('lastName')}
                                    customIcon={"edit-3"}
                                    customIconFamily={'feather'}
                                    customIconColor={EDColors.grayNew}
                                    focusOnPress={true}
                                />
                            ) : null}

                            {/* ADDRESS */}
                            <EDRTLView style={style.addressView}>
                                <View >
                                    <Text style={style.placeholderText}>
                                        {strings('yourAddress')}
                                    </Text>
                                </View>
                                <View>
                                    <TouchableOpacity
                                        style={{
                                            marginRight: isRTLCheck() ? 10 : 10,
                                            marginLeft: isRTLCheck() ? 10 : 0,
                                        }}
                                        onPress={this.onCustomIconPress}>
                                        <Icon
                                            type={'ant-design'}
                                            size={getProportionalFontSize(20)}
                                            onPress={this.onAddressEventHandler}
                                            name={isRTLCheck() ? 'left' : "right"}
                                            color={EDColors.grayNew} />
                                    </TouchableOpacity>
                                </View>
                            </EDRTLView>

                            {/* SAVED CARDS */}
                            <EDRTLView style={style.passwordView}>
                                <View >
                                    <Text style={style.placeholderText}>
                                        {strings('savedCards')}
                                    </Text>
                                </View>
                                <View>
                                    <TouchableOpacity
                                        style={{
                                            marginRight: isRTLCheck() ? 10 : 10,
                                            marginLeft: isRTLCheck() ? 10 : 0,
                                        }}
                                        onPress={this.onCustomIconPress}>
                                        <Icon
                                            type={'ant-design'}
                                            size={getProportionalFontSize(20)}
                                            onPress={this.navigateToCards}
                                            name={isRTLCheck() ? 'left' : "right"}
                                            color={EDColors.grayNew} />
                                    </TouchableOpacity>
                                </View>
                            </EDRTLView>

                            {/* PASSWORD */}
                            {this.props.isSocialLogin ? null :
                                <EDRTLView style={style.passwordView}>
                                    <View >
                                        <Text style={style.placeholderText}>
                                            {strings('password')}
                                        </Text>
                                    </View>
                                    <View>
                                        <TouchableOpacity
                                            style={{
                                                marginRight: isRTLCheck() ? 10 : 10,
                                                marginLeft: isRTLCheck() ? 10 : 0,
                                            }}
                                            onPress={this.onCustomIconPress}>
                                            <Icon
                                                type={'ant-design'}
                                                size={getProportionalFontSize(20)}
                                                onPress={this.onPasswordChangeHandler}
                                                name={isRTLCheck() ? 'left' : "right"}
                                                color={EDColors.grayNew} />
                                        </TouchableOpacity>
                                    </View>
                                </EDRTLView>
                            }

                            {/* NOTIFICATION */}
                            <EDRTLView style={style.passwordView}>
                                <View >
                                    <Text style={style.placeholderText}>
                                        {strings('notification')}
                                    </Text>
                                </View>
                                <View>
                                    <Switch
                                        trackColor={{ false: EDColors.separatorColor, true: EDColors.palePrimary }}
                                        thumbColor={EDColors.primary}
                                        style={style.notificationSwitch}
                                        value={this.state.isNotification}
                                        onValueChange={this.onRadioValueChangeHandle} />
                                </View>
                            </EDRTLView>

                        </View>
                        {/* REFERRAL VIEW */}
                        {/* VIKRANT 30-07-21 */}

                        <View>
                            <EDEarnMoreComponent
                                isClose={false}
                                referral_code={this.props.referral_code}
                                shareApp={this.shareApp}
                            />
                        </View>

                        <TouchableOpacity onPress={this.onDeletePress}>
                            <EDRTLView style={{ marginVertical: 10, alignSelf: 'center', alignItems: 'center', bottom: Platform.OS == 'ios' ? 20 : 0, marginTop: Platform.OS == 'ios' ? 30 : 10 }}>
                                <Icon name="delete" size={getProportionalFontSize(20)} color={EDColors.error} />
                                <EDRTLText title={strings("deleteAccount")} style={style.deleteText} />
                            </EDRTLView>
                        </TouchableOpacity>
                    </ScrollView>


                </View>
            </BaseContainer>
        );
    }
    //#endregion

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
                '\nAndroid: ' + this.props.storeURL.play_store_url + '\n' + strings('usePromo') + boldify((this.props.referral_code || '')) +
                strings('rewardMsg'),

        };
        Share.open(shareOptions);
    }

    //#region
    onRightEventHandler = index => {
        index == 0 ? this.updateData() : null;
    };
    //#endregion

    //#region
    /** BACK EVENT HANDLER */
    onBackEventHandler = () => {
        this.props.navigation.goBack();
    };
    //#endregion

    //#region
    /** TEXT CHANGE */
    onTextChangeHanlder = text => {
        this.setState({
            firstName: text,
        });
    };
    onLastTextChangeHanlder = text => {
        this.setState({
            lastName: text,
        });
    };
    onPhoneTextChangeHanlder = text => {
        this.setState({
            changedPhone: text,
        });
    };
    onEmailtChangeHanlder = text => {
        this.setState({
            email: text,
        });
    };
    //#endregion

    //#region
    onTextFieldFocusEvent = () => {
        this.secondTextInput.focus();
    };
    //#endregion

    //#region
    /** ADDRESS ICON EVETN */
    onAddressEventHandler = () => {
        // this.props.navigation.navigate('AddressListContainer', {
        //     isSelectAddress: false,
        // });
        this.props.navigation.navigate('DetailedAddressListContainer', {
            isSelectAddress: false,
        });
    };

    /** CARD  EVETN */
    navigateToCards = () => {
        this.props.navigation.push('savedCards');
    };


    //#region
    /** RADIO BUTTON VALUE */
    onRadioValueChangeHandle = value => {
        if (value === true && this.firebaseOff) {
            showDialogueNew(strings('notificationPermission'), [], strings('notification'), () => {
                Platform.OS == "ios" ?
                    Linking.openURL('app-settings:').catch(err => {
                        console.log(err);
                    }) :
                    Linking.openSettings().catch(err => {
                        console.log(err);
                    })
            });
        } else {
            this.setState({ isNotification: value });

            this.getToken();
        }
    };
    //#endregion

    //#region
    /** PASSWORD CHANGE */
    onPasswordChangeHandler = () => {
        this.props.navigation.navigate('ChangePasswordContainer');
    };
    //#endregion

    /**
    *
    * @param {The image response received from image picker} imageSource
    */
    onImageSelectionHandler = imageSource => {
        console.log('[][][][][', imageSource)
        this.state.ImageSource = imageSource;
    };

    /** PROFILE UPDATE CALLED */
    updateData() {
        if (this.validate()) {
            this.updateProfile();
        }
    }

    /** VALIDATE USER NAME */
    validate() {
        // if (this.state.email !== '') {
        if (this.validationsHelper
            .validateEmail(
                this.state.email,
                strings("emptyEmail")
            )
            .trim() !== "") {
            showValidationAlert(this.validationsHelper
                .validateEmail(
                    this.state.email,
                    strings("emptyEmail")
                ));
            return false;
        }
        // }
        if (this.state.firstName === '') {
            showValidationAlert(strings('emptyName'));
            return false;
        }
        if (this.state.lastName === '') {
            showValidationAlert(strings('emptyLastName'));
            return false;
        }
        else {
            return true
        }
    }

    //#region NETWORK API

    /** delete API CALL */
    callDeleteAPI = () => {
        // CHECK INTERNET STATUS
        netStatus(isConnected => {
            if (isConnected) {
                this.setState({ isLoading: true });
                // delete PARAMS
                const deleteParams = {
                    user_id: this.props.userID,
                    language_slug: this.props.lan,
                };
                deleteUser(deleteParams, this.ondeleteSuccess, this.ondeleteFailure, this.props)
            } else {
                showNoInternetAlert();
            }
        });
    }

    /**
     *
     * @param {The success object returned in delete API response} _objSuccess
     */
    ondeleteSuccess = (_objSuccess) => {
        const selectedLanguage = this.props.lan;

        this.facebookSignOut();
        this.googleSignOut();

        // DISMISS delete DIALOGUE
        this.setState({ isLoading: false });

        // CLEAR USER DETAILS IN REDUX
        this.props.saveCredentials({});
        this.props.saveLanguageRedux(selectedLanguage)


        // CLEAR USER DETAILS FROM ASYNC STORE
        flushAllData(
            _response => {
                // SET CART COUNT TO 0 IN REDUX
                this.props.saveCartCount(0);

                // MAINTAIN THE SELECTED LANGUAGE IN ASYNC STORE
                saveLanguage(selectedLanguage, _successSaveLanguage => { }, _error => { });

                // TAKE THE USER TO INITIAL SCREEN
                this.props.navigation.popToTop();
                this.props.navigation.navigate('SplashContainer');
            },
            _error => { }
        );
    }

    /**
     *
     * @param {The failure response object returned in delete API} _objFailure
     */
    ondeleteFailure = _objFailure => {
        debugLog('delete OBJ FAILURE ::: ' + JSON.stringify(_objFailure))

        // DISMISS delete DIALOGUE
        this.setState({ isLoading: false });
        setTimeout(() => {
            showDialogue(_objFailure.message, [], '', () => { });
        }, 500);
    }

    /**
 * SIGNOUT FOR FACEBOOK USER
 */
    facebookSignOut = () => {
        try {
            LoginManager.logOut()
        }
        catch {
            error => {
                debugLog("Facebook signout error :::::", error)
            }
        }
    }

    /**
   * SIGNOUT FOR GOOGLE USER
   */
    googleSignOut = () => {
        GoogleSignin.configure({
            scopes: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'], // what API you want to access on behalf of the user, default is email and profile
            webClientId: GOOGLE_WEBCLIENT_ID, // client ID of type WEB for your server (needed to verify user ID and offline access)
            // loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
            forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
        });
        GoogleSignin.signOut().then(
            () => debugLog("Google signout success :::::")
        ).catch(
            error => {
                debugLog("Google signout error :::::", error)
            }
        )
    }


    /**
     * @param { on Success Response Object } onSuccess
     */
    onSuccessUpdateProfile = onSuccess => {
        if (onSuccess != undefined) {
            if (onSuccess.status == RESPONSE_SUCCESS) {
                if (this.props.isLoginRemembered)
                    saveUserLogin(
                        onSuccess.profile,
                        success => {
                            this.props.saveCredentials(onSuccess.profile);
                        },
                        errAsyncStore => {
                            this.setState({ isLoading: false });
                        }
                    );
                else {
                    this.props.saveCredentials(onSuccess.profile);
                }
            } else {
                showValidationAlert(onSuccess.message);
            }
        } else {
            showValidationAlert(strings('generalWebServiceError'));
        }
        this.changeTokenAPI();
    };

    /**
     * @param { on Fialure response Object } onFailure 
     */
    onFailureUpdateProfile = onFailure => {
        this.setState({ isLoading: false });
        showValidationAlert(onFailure.message || strings('generalWebServiceError'));
    };

    //#region CHANGE TOKEN
    /** CALL CHANGE TOKEN API */
    changeTokenAPI = () => {
        let params = {
            language_slug: this.props.lan,
            // token: this.props.phoneNumber,
            user_id: this.props.userID,
            firebase_token: this.state.firebaseToken,
        };
        this.setState({ isLoading: false });
        this.props.navigation.goBack();
    };
    //#endregion

    /** UPDATE PROFILE CALLED */
    updateProfile() {
        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true });

                let objUpdateProfile = {
                    user_id: this.props.userID,
                    // token: this.props.token,
                    first_name: this.state.firstName,
                    last_name: this.state.lastName,
                    image: this.state.ImageSource,
                    password: '1234',
                    notification: this.state.isNotification ? '1' : '0',
                    Email: this.state.email
                };
                updateProfile(objUpdateProfile, this.onSuccessUpdateProfile, this.onFailureUpdateProfile, this.props);
            } else {
                console.log('error');
                showValidationAlert(strings('noInternet'));
            }
        });
    }
    //#endregion
}

export default connect(

    state => {
        return {
            userID: state.userOperations.userIdInRedux,
            firstName: state.userOperations.firstName,
            lastName: state.userOperations.lastName,
            image: state.userOperations.image,
            notification: state.userOperations.notification,
            token: state.userOperations.phoneNumberInRedux,
            email: state.userOperations.email,
            lan: state.userOperations.lan,
            isLoginRemembered: state.userOperations.isLoginRemembered,
            phoneNumber: state.userOperations.phoneNumberInRedux,
            firebaseToken: state.userOperations.token,
            isSocialLogin: state.userOperations.isSocialLogin,
            referral_code: state.userOperations.referral_code,
            phoneCode: state.userOperations.phoneCode,
            storeURL: state.userOperations.storeURL || {},
            countryArray: state.userOperations.countryArray,
        };
    },
    dispatch => {
        return {
            saveCredentials: detailsToSave => {
                dispatch(saveUserDetailsInRedux(detailsToSave));
            },
            saveToken: token => {
                dispatch(saveUserFCMInRedux(token));
            },
            saveSocialLogin: bool => {
                dispatch(saveSocialLoginInRedux(bool))
            },
            saveCartCount: data => {
                dispatch(saveCartCount(data));
            },
            saveLanguageRedux: language => {
                dispatch(saveLanguageInRedux(language));
            },
        };
    }
)(ProfileContainer);

const style = StyleSheet.create({
    childViewContainer: {
        backgroundColor: EDColors.white,
        borderRadius: 16,
        padding: 10,
        margin: 15,
    },
    deleteText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(16),
        color: EDColors.error,
        marginHorizontal: 5
    },
    normalText: {
        fontFamily: EDFonts.bold,
        fontSize: 14,
        textAlign: "center",
        color: EDColors.black,
        margin: 10
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
        width: widthPercentageToDP("35%")
    },
    placeholderText: {
        fontSize: getProportionalFontSize(16),
        fontFamily: EDFonts.semiBold,
        color: EDColors.grayNew,
        paddingHorizontal: 8
    },
    share: {
        backgroundColor: EDColors.primary,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        paddingHorizontal: 10,
        margin: 20,
        borderRadius: 25,
        elevation: 1,
    },
    instruction: {
        justifyContent: "space-around",
        alignItems: "center",
        width: metrics.screenWidth,
        marginTop: 10
    },
    icons: {
        height: 40,
        width: 40,
        resizeMode: "contain"
    },
    referText: {
        fontSize: 12,
        fontFamily: EDFonts.regular,
        width: 100,
        textAlign: "center",
        marginTop: 0
    },
    notificationSwitch: { alignSelf: 'center', marginHorizontal: 5 },
    addressView: { width: '100%', justifyContent: 'space-between', alignItems: 'center', height: metrics.screenHeight * 0.06, marginTop: 10 },
    passwordView: { width: '100%', justifyContent: 'space-between', alignItems: 'center', height: metrics.screenHeight * 0.06 },

});
