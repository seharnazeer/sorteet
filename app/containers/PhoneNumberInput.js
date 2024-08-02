import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import EDThemeButton from '../components/EDThemeButton';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { getProportionalFontSize, RESPONSE_SUCCESS, TextFieldTypes } from '../utils/EDConstants';
import metrics from '../utils/metrics';
import { EDFonts } from "../utils/EDFontConstants";
import { Icon } from 'react-native-elements'
import EDText from '../components/EDText';
import Validations from '../utils/Validations';
import ProgressLoader from "../components/ProgressLoader";
import { heightPercentageToDP } from 'react-native-responsive-screen';
import EDRTLTextInput from '../components/EDRTLTextInput';
import { resendOTPAPI } from '../utils/ServiceManager';
import { netStatus } from '../utils/NetworkStatusConnection';
import { showValidationAlert } from '../utils/EDAlert';

class PhoneNumberInput extends React.PureComponent {

    constructor(props) {
        super(props);

        this.countryCode = ""

        this.user_id = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.user_id != undefined
            && this.props.navigation.state.params.user_id !== null
            ? this.props.navigation.state.params.user_id : ''

        this.isFacebook = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isFacebook != undefined
            && this.props.navigation.state.params.isFacebook !== null
            ? this.props.navigation.state.params.isFacebook : false

        this.social_media_id = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.social_media_id != undefined
            && this.props.navigation.state.params.social_media_id !== null
            ? this.props.navigation.state.params.social_media_id : ''

        this.isAppleLogin = this.props.navigation.state.params != undefined
            && this.props.navigation.state.params.isAppleLogin != undefined
            && this.props.navigation.state.params.isAppleLogin !== null
            ? this.props.navigation.state.params.isAppleLogin : false

        this.validationsHelper = new Validations()

    }

    componentDidMount() {
        if (this.props.countryArray !== undefined && this.props.countryArray !== null && this.props.countryArray[0] !== undefined && this.props.countryArray[0].phonecode !== undefined) {
            this.countryCode = this.props.countryArray[0].phonecode
        }
    }

    onCountrySelect = country => {
        this.countryCode = country.callingCode[0]
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
                            PhoneNumber: this.state.phoneNumber,
                            phone_code: this.countryCode
                        }
                    } else if (this.isAppleLogin) {
                        param = {
                            user_id: this.props.userID,
                            language_slug: this.props.lan,
                            social_media_id: this.props.appleToken,
                            PhoneNumber: this.state.phoneNumber,
                            phone_code: this.countryCode

                        }
                    } else {
                        param = {
                            user_id: this.user_id,
                            language_slug: this.props.lan,
                            PhoneNumber: this.state.phoneNumber,
                            phone_code: this.countryCode
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
            this.props.navigation.navigate('OTPVerification', {
                isFacebook: this.isFacebook,
                user_id: this.user_id,
                phNo: this.state.phoneNumber,
                social_media_id: this.isAppleLogin ? this.props.appleToken : this.social_media_id,
                isFromLogin: true,
                phoneCode: this.countryCode,
                isAppleLogin: this.isAppleLogin,
                otpSent : true
            })
        } else {
            showValidationAlert(onSuccess.message)
        }
    }

    /**
    * @param { failure rsp object } onFailure
    */
    onFailureResendOTP = onFailure => {
        this.setState({ isLoading: false })
        showValidationAlert(onFailure.message)

        console.log('::::::: FAILURE OTP', onFailure)
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
                            name={"close"}
                            size={getProportionalFontSize(28)}
                            color={EDColors.primary}
                            onPress={() => { this.props.navigation.goBack(); }}
                            containerStyle={{ marginVertical: 10, alignSelf: 'flex-start', }}
                        />

                        <EDText title={strings('addNumber')} style={{ marginTop: 30 }}
                            textStyle={{ fontSize: getProportionalFontSize(35), marginBottom: 10, fontFamily: EDFonts.bold, letterSpacing: 1 }} />

                        <EDText title={strings('addNumberMessage')} style={{ marginTop: 10 }}
                            textStyle={{ fontSize: getProportionalFontSize(20), marginBottom: 30, fontFamily: EDFonts.medium, letterSpacing: 1 }} />


                        <EDRTLTextInput
                            type={TextFieldTypes.phone}
                            icon="call"
                            initialValue={this.state.phoneNumber}
                            onChangeText={this.onChangeText}
                            placeholder={strings('phoneNumber')}
                            onCountrySelect={this.onCountrySelect}
                            countryData={this.props.countryArray}
                            isShowSeperator={false}
                            placeHolderTextStyle={{ height: heightPercentageToDP('6%'), color: EDColors.black, }}
                            errorFromScreen={
                                this.state.shouldPerformValidation
                                    ? this.validationsHelper.validateMobile(
                                        this.state.phoneNumber,
                                        strings('emptyPhone'),
                                        this.countryCode
                                    )
                                    : ''
                            } />

                        <EDThemeButton
                            style={{ borderRadius: 30, height: heightPercentageToDP('6%'), width: metrics.screenWidth - 40, marginTop: 20 }}
                            label={strings('addNumber')}
                            textStyle={{ fontSize: getProportionalFontSize(19), fontFamily: EDFonts.bold }}
                            isSimpleText={true}
                            onPress={this.onConfrimPressed}
                        />
                    </View>
                </ScrollView>
            </View>
        );
    }

    state = {
        phoneNumber: '',
        shouldPerformValidation: false,
        isLoading: false
    }

    onChangeText = (value) => {
        var newText = value.replace(/[^0-9\\]/g, "")
        this.setState({ phoneNumber: newText })
    }

    onConfrimPressed = () => {
        this.setState({ shouldPerformValidation: true })
        if (this.validationsHelper.validateMobile(this.state.phoneNumber, strings("emptyPhone"), this.countryCode).trim() !== "") {
            return
        } else {
            // this.props.navigation.navigate('OTPVerification', {
            //     isFacebook: this.isFacebook,
            //     user_id: this.user_id,
            //     phNo: this.state.phoneNumber,
            //     social_media_id: this.isAppleLogin ? this.props.appleToken : this.social_media_id,
            //     isFromLogin: true,
            //     phoneCode: this.countryCode,
            //     isAppleLogin: this.isAppleLogin
            // })

            this.ResendOTP()

        }
    }

}

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
    },
    subView: {
        marginVertical: 10, marginTop: metrics.statusbarHeight + 10, marginHorizontal: 25
    }
})

export default connect(
    state => {
        return {
            lan: state.userOperations.lan,
            code: state.userOperations.code,
            countryArray: state.userOperations.countryArray,
            appleToken: state.userOperations.appleToken,
        };
    },
    dispatch => { return {} }
)(PhoneNumberInput);
