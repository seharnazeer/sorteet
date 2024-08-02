import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import EDThemeButton from '../components/EDThemeButton';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { isRTLCheck, getProportionalFontSize, RESPONSE_SUCCESS, debugLog } from '../utils/EDConstants';
import metrics from '../utils/metrics';
import { EDFonts } from "../utils/EDFontConstants";
import { Icon } from 'react-native-elements'
import EDText from '../components/EDText';
import OTPInputView from '@twotalltotems/react-native-otp-input'
import NavigationService from "../../NavigationService";
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { resendOTPAPI, verifyOTPAPI } from "../utils/ServiceManager";
// import { LoginManager, GraphRequestManager, GraphRequest, AccessToken } from "react-native-fbsdk";
import { showNoInternetAlert, showValidationAlert } from "../utils/EDAlert";
import { NavigationActions, StackActions } from "react-navigation";
import { saveSocialLoginInRedux, saveLanguageInRedux, saveUserDetailsInRedux, saveUserFCMInRedux, rememberLoginInRedux, saveSocialButtonInRedux } from "../redux/actions/User";
import { saveUserFCM, saveUserLogin, saveSocialLogin } from "../utils/AsyncStorageHelper";
import { saveIsCheckoutScreen } from '../redux/actions/Checkout'
import { netStatus } from "../utils/NetworkStatusConnection";
import ProgressLoader from '../components/ProgressLoader'
import { checkFirebasePermission } from "../utils/FirebaseServices";
import EDUnderlineButton from '../components/EDUnderlineButton';
import EDRTLView from '../components/EDRTLView';
import EDRTLText from '../components/EDRTLText';

class OTPVerification extends React.PureComponent {

    constructor(props) {
        super(props);

        this.phoneNumber = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.phNo != undefined
            && this.props.navigation.state.params.phNo !== null
            ? this.props.navigation.state.params.phNo : ''

        this.phoneCode = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.phoneCode != undefined
            && this.props.navigation.state.params.phoneCode !== null
            ? this.props.navigation.state.params.phoneCode : ''

        this.user_id = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.user_id != undefined
            && this.props.navigation.state.params.user_id !== null
            ? this.props.navigation.state.params.user_id : ''

        this.OTP = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.OTP != undefined
            && this.props.navigation.state.params.OTP !== null
            ? this.props.navigation.state.params.OTP : ''

        this.password = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.password != undefined
            && this.props.navigation.state.params.password !== null
            ? this.props.navigation.state.params.password : ''

        this.forPasswordRecovery = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.forPasswordRecovery != undefined
            && this.props.navigation.state.params.forPasswordRecovery !== null
            ? this.props.navigation.state.params.forPasswordRecovery : "0"

        this.isAppleLogin = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isAppleLogin != undefined
            && this.props.navigation.state.params.isAppleLogin !== null
            ? this.props.navigation.state.params.isAppleLogin : false

        this.isFromLogin = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isFromLogin != undefined
            && this.props.navigation.state.params.isFromLogin !== null
            ? this.props.navigation.state.params.isFromLogin : false

        this.isFacebook = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isFacebook != undefined
            && this.props.navigation.state.params.isFacebook !== null
            ? this.props.navigation.state.params.isFacebook : false

        this.social_media_id = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.social_media_id != undefined
            && this.props.navigation.state.params.social_media_id !== null
            ? this.props.navigation.state.params.social_media_id : ''

        this.message = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.message != undefined
            && this.props.navigation.state.params.message !== null
            ? this.props.navigation.state.params.message : undefined


        this.otpSent = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.otpSent != undefined
            && this.props.navigation.state.params.otpSent !== null
            ? this.props.navigation.state.params.otpSent : false

        this.isForGuest = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isForGuest != undefined
            && this.props.navigation.state.params.isForGuest !== null
            ? this.props.navigation.state.params.isForGuest : false

        this.setVerified = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.setVerified != undefined
            && this.props.navigation.state.params.setVerified !== null
            ? this.props.navigation.state.params.setVerified : undefined

        this.guest_first_name = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.guest_first_name != undefined
            && this.props.navigation.state.params.guest_first_name !== null
            ? this.props.navigation.state.params.guest_first_name : ""

        this.guest_email = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.guest_email != undefined
            && this.props.navigation.state.params.guest_email !== null
            ? this.props.navigation.state.params.guest_email : ""

        this.checkout_data = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.checkout_data != undefined
            && this.props.navigation.state.params.checkout_data !== null
            ? this.props.navigation.state.params.checkout_data : {}
    }

    async componentDidMount() {
        if (this.isFromLogin || this.isFacebook || this.isAppleLogin || this.isForGuest) {
            if (this.otpSent == true)
                return;
            this.ResendOTP()
        }
        checkFirebasePermission(onSuccess => {
            this.setState({ firebaseToken: onSuccess })
            this.props.saveToken(onSuccess)
        }, (onFailure) => {
            console.log("Firebase token not allowed", onFailure)
        })
    }

    render() {
        return (
            <View style={styles.mainView}>

                {/* PROGRESS LOADER */}
                {this.state.isLoading ? <ProgressLoader /> : null}

                {/* SCROLL VIEW */}
                <ScrollView>

                    {/* SUB VIEW */}
                    <View style={styles.subView}>

                        {/* CANCEL ICON */}
                        <Icon
                            name={isRTLCheck() ? "arrow-forward" : "arrow-back"}
                            size={getProportionalFontSize(28)}
                            color={EDColors.primary}
                            onPress={() => { this.props.navigation.goBack(); }}
                            containerStyle={{ marginVertical: 10, alignSelf: isRTLCheck() ? "flex-end" : 'flex-start', }}
                        />

                        <EDText title={strings('validateNumber')} style={{ marginTop: 30, alignSelf: 'center' }}
                            textStyle={{ textAlign: "center", fontSize: getProportionalFontSize(35), marginBottom: 20, fontFamily: EDFonts.bold, letterSpacing: 1 }} />

                        <EDText title={this.message || strings('otpMessage')} style={{ marginTop: 5 }}
                            textStyle={{ lineHeight: 18, fontSize: getProportionalFontSize(15), fontFamily: EDFonts.regular, letterSpacing: 1, textAlign: "center", color: EDColors.blackSecondary }} />

                        <OTPInputView
                            style={{ alignSelf: 'center', height: 150,textAlign :"right" }}
                            pinCount={6}
                            onCodeChanged={code => { this.setState({ code: code }) }}
                            autoFocusOnLoad
                            code={this.state.code}
                            codeInputFieldStyle={styles.underlineStyleBase}
                            codeInputHighlightStyle={styles.underlineStyleHighLighted}
                            onCodeFilled={(code => { console.log(':::::: CODE FILLED', code) })}
                            placeholderTextColor={EDColors.black}
                        />

                        {/* <EDUnderlineButton
                            viewStyle={styles.bottomBorderColor}
                            buttonStyle={[styles.buttonStyle, { marginBottom: 10, marginHorizontal: 6 }]}
                            style={styles.textStyle}
                            textStyle={styles.touchableTextStyle}
                            title={strings("resendOTP")}
                            onPress={this.ResendOTP}
                        /> */}

                    </View>

                    <EDThemeButton
                        isSimpleText={true}
                        style={{ borderRadius: 10, height: heightPercentageToDP('6.5%'), width: metrics.screenWidth * .7, marginTop: 20 }}
                        label={strings('continue')}
                        textStyle={{ fontSize: getProportionalFontSize(16), fontFamily: EDFonts.semiBold }}
                        onPress={this.onOtpVerifyPressed}
                    />
                    {/* <EDUnderlineButton
                            viewStyle={styles.bottomBorderColor}
                            buttonStyle={[styles.buttonStyle, {  marginHorizontal: 6 }]}
                            style={styles.textStyle}
                            textStyle={styles.touchableTextStyle}
                            title={strings("resendOTP")}
                            onPress={this.ResendOTP}
                        /> */}
                    <EDRTLView style={{ justifyContent: 'center', marginTop: 40 }}>
                        <EDRTLText title={strings("trouble")} style={styles.troubleText} />
                        <EDRTLText title={strings("resendOTP")} onPress={this.ResendOTP} style={styles.touchableTextStyle} />

                    </EDRTLView>
                </ScrollView>


            </View>
        );
    }

    state = {
        code: '',
        firebaseToken: "",
    }

    /** ON VERIFY OTP PRESSED */
    onOtpVerifyPressed = () => {
        if (this.state.code.trim().length == 0) {
            showValidationAlert(strings('emptyOTP'))
        } else if (this.state.code.trim().length < 6) {
            showValidationAlert(strings('invalidOTP'))
        }
        else {
            if (this.isForGuest) {
                netStatus(status => {
                    if (status) {
                        if (this.state.code.trim() == this.OTP) {
                            this.props.navigation.replace("CheckOutContainer", this.checkout_data)
                        }
                        else
                            showValidationAlert(strings('invalidOTP'))
                    }
                    else
                        showNoInternetAlert();
                })
                return;
            }
            this.verifyOTP()
        }
    }

    /**
     * @param { API Call to verify OTP}
     */
    verifyOTP = () => {
        netStatus(isConnected => {
            if (isConnected) {
                this.setState({ isLoading: true })

                var param = {
                    PhoneNumber: this.phoneNumber,
                    language_slug: this.props.lan,
                    forPasswordRecovery: this.forPasswordRecovery,
                    active: 1,
                    otp: this.state.code,
                    social_media_id: this.isFacebook ? this.social_media_id : this.isAppleLogin ? this.props.appleToken : '',
                    phone_code: this.phoneCode
                }

                if (this.forPasswordRecovery == "0")
                    param['Password'] = this.password

                verifyOTPAPI(param, this.onSuccessVerifyOTP, this.onFailureVerifyOTP, this.props)

            } else {
                showValidationAlert(strings('noInternet'))
            }
        })
    }

    /**
     * @param { success resp object } onSuccess
     */
    onSuccessVerifyOTP = onSuccess => {
        this.setState({ isLoading: false })
        if (onSuccess != undefined && onSuccess.status == RESPONSE_SUCCESS) {
            if (this.forPasswordRecovery == "0") {
                this.props.saveCredentials(onSuccess.login);

                if (this.isFacebook) {
                    this.props.saveSocialLogin(true)
                    saveSocialLogin(true, success => { }, fail => { })
                } else {
                    this.props.saveSocialLogin(false)
                    saveSocialLogin(false, success => { }, fail => { })
                }

                saveUserLogin(onSuccess.login, success => { }, errAsyncStore => { });
                this.props.saveToken(this.state.firebaseToken)
                saveUserFCM(this.state.firebaseToken, success => { }, failure => { })

                if (this.props.isCheckout) {
                    this.props.saveIsCheckoutScreen(false)
                    NavigationService.navigateToSpecificRoute("CartContainer")
                } else if (this.isAppleLogin) {
                    this.props.saveIsCheckoutScreen(false)
                    NavigationService.navigateToSpecificRoute("CartContainer")
                } else {
                    this.props.navigation.dispatch(
                        StackActions.reset({
                            index: 0,
                            actions: [
                                NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
                            ]
                        })
                    );
                }
            }
            else {
                this.props.navigation.navigate("PasswordRecovery", {
                    user_id: this.user_id
                })
            }
        } else {
            showValidationAlert(onSuccess.message)
            this.setState({ code: '' })
        }
    }

    /**
    * @param { failure rsp object } onFailure
    */
    onFailureVerifyOTP = onFailure => {
        this.setState({ isLoading: false })
    }

    /**
     * @param { API Call to verify OTP}
     */
    ResendOTP = () => {
        netStatus(isConnected => {
            if (isConnected) {
                this.setState({ isLoading: true })

                var param = {}

                if (this.isFacebook) {
                    param = {
                        user_id: this.user_id,
                        language_slug: this.props.lan,
                        social_media_id: this.social_media_id,
                        PhoneNumber: this.phoneNumber,
                        phone_code: this.phoneCode,
                        forPasswordRecovery: this.forPasswordRecovery

                    }
                } else if (this.isAppleLogin) {
                    param = {
                        user_id: this.props.userID,
                        language_slug: this.props.lan,
                        social_media_id: this.props.appleToken,
                        PhoneNumber: this.phoneNumber,
                        phone_code: this.phoneCode,
                        forPasswordRecovery: this.forPasswordRecovery
                    }
                }
                else if (this.isForGuest) {
                    param = {
                        language_slug: this.props.lan,
                        PhoneNumber: this.phoneNumber,
                        phone_code: this.phoneCode,
                        isForGuest: this.isForGuest ? 1 : 0,
                        guest_email: this.guest_email,
                        guest_first_name: this.guest_first_name
                    }
                }
                else {
                    param = {
                        user_id: this.user_id,
                        language_slug: this.props.lan,
                        phone_code: this.phoneCode,
                        PhoneNumber: this.phoneNumber,
                        forPasswordRecovery: this.forPasswordRecovery
                    }
                }

                resendOTPAPI(param, this.onSuccessResendOTP, this.onFailureResendOTP, this.props)

            } else {
                showValidationAlert(strings('noInternet'))
            }
        })
    }

    /**
     * @param { success resp object } onSuccess
     */
    onSuccessResendOTP = onSuccess => {
        this.setState({ isLoading: false })
        console.log(':::::: SUCCESS OTP', onSuccess)
        if (onSuccess != undefined && onSuccess.status == RESPONSE_SUCCESS) {
            this.OTP = onSuccess.OTP
            this.setState({ code: '' })
            if (this.isFromLogin == false)
                showValidationAlert(onSuccess.message)

            this.isFromLogin = false

        } else {
            showValidationAlert(onSuccess.message)
        }
    }

    /**
    * @param { failure rsp object } onFailure
    */
    onFailureResendOTP = onFailure => {
        this.setState({ isLoading: false })
        console.log('::::::: FAILURE OTP', onFailure)
    }

}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
    },
    subView: {
        marginVertical: 10, marginTop: metrics.statusbarHeight + 10, marginHorizontal: 25
    },
    bottomBorderColor: { borderBottomColor: EDColors.primary },
    buttonStyle: { alignSelf: 'flex-end', marginTop: -30 },
    underlineStyleBase: {
        width: 50,
        height: 70,
        borderWidth: 0,
        marginHorizontal: 5,
        borderBottomColor: EDColors.separatorColor,
        borderBottomWidth: 2,
        color: EDColors.black,
        fontSize: getProportionalFontSize(25),
        fontFamily: EDFonts.bold,
    },
    underlineStyleHighLighted: {
        borderBottomColor: EDColors.primary,
        borderBottomWidth: 2
    },
    troubleText: { color: EDColors.blackSecondary, fontFamily: EDFonts.regular, fontSize: getProportionalFontSize(15) },
    touchableTextStyle: { color: EDColors.primary, fontFamily: EDFonts.bold, marginHorizontal: 5, fontSize: getProportionalFontSize(15) },
})

export default connect(
    state => {
        return {
            lan: state.userOperations.lan,
            userID: state.userOperations.userIdInRedux,
            isCheckout: state.checkoutReducer.isCheckout,
            appleToken: state.userOperations.appleToken,
        };
    },
    dispatch => {
        return {
            saveCredentials: detailsToSave => {
                dispatch(saveUserDetailsInRedux(detailsToSave));
            },
            saveToken: token => {
                dispatch(saveUserFCMInRedux(token))
            },
            saveSocialLogin: bool => {
                dispatch(saveSocialLoginInRedux(bool))
            },
            saveIsCheckoutScreen: data => {
                dispatch(saveIsCheckoutScreen(data));
            },
            saveLanguageRedux: language => {
                dispatch(saveLanguageInRedux(language));
            },
        }
    }
)(OTPVerification);
