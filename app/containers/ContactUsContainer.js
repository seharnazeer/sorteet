import React from "react";
import { Linking } from "react-native";
import { StyleSheet } from "react-native";
import ConfirmGoogleCaptcha from "react-native-google-recaptcha-v2";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { NavigationEvents } from "react-navigation";
import { connect } from "react-redux";
import EDRTLText from "../components/EDRTLText";
import EDRTLTextInput from "../components/EDRTLTextInput";
import EDRTLView from "../components/EDRTLView";
import EDThemeButton from "../components/EDThemeButton";
import { strings } from "../locales/i18n";
import { saveNavigationSelection } from "../redux/actions/Navigation";
import { WebView } from "react-native-webview";
import {
  showDialogue,
  showNoInternetAlert,
  showValidationAlert,
} from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import {
  CAPTCHA_KEY,
  debugLog,
  getProportionalFontSize,
  RESPONSE_SUCCESS,
  RETURN_URL,
  TextFieldTypes,
} from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import { netStatus } from "../utils/NetworkStatusConnection";
import { contactAPI } from "../utils/ServiceManager";
import Validations from "../utils/Validations";
import BaseContainer from "./BaseContainer";
class ContactUsContainer extends React.Component {
  validationsHelper = new Validations();
  countryCode = this.props.phoneCode || undefined;
  resCountryCode = undefined;
  state = {
    isLoading: false,
    strFullName: this.props.firstName || "",
    strLastName: this.props.lastName || "",
    strResName: "",
    strEmail: this.props.email || "",
    strPhone: this.props.PhoneNumber || "",
    strResPhone: "",
    strZip: "",
    strComment: "",
    shouldPerformValidation: false,
    key: 1,
    resKey: 1,
  };

  onMenuPressed = () => {
    this.props.navigation.openDrawer();
  };

  onDidFocus = () => {
    this.props.saveNavigationSelection("contactUs");
    this.countryCode = this.props.phoneCode || undefined;
    if (this.countryCode == undefined) {
      if (
        this.props.countryArray !== undefined &&
        this.props.countryArray !== null &&
        this.props.countryArray[0] !== undefined &&
        this.props.countryArray[0].phonecode !== undefined
      ) {
        this.countryCode = this.props.countryArray[0].phonecode;
      }
    }
    debugLog("PHONE CODE :::::", this.countryCode);

    if (
      this.props.countryArray !== undefined &&
      this.props.countryArray !== null &&
      this.props.countryArray[0] !== undefined &&
      this.props.countryArray[0].phonecode !== undefined
    ) {
      this.resCountryCode = this.props.countryArray[0].phonecode;
    }

    this.setState({
      strFullName: this.props.firstName || "",
      strLastName: this.props.lastName || "",
      strResName: "",
      strEmail: this.props.email || "",
      strPhone: this.props.PhoneNumber || "",
      strResPhone: "",
      strZip: "",
      strComment: "",
      shouldPerformValidation: false,
      key: this.state.key + 1,
      resKey: this.state.resKey + 1,
    });
  };

  //#region TEXT CHANGE EVENTS
  /**
   * @param {Value of textfield whatever user type} value
   ** @param {Unique identifier for every text field} identifier
   */
  textFieldTextDidChangeHandler = (value, identifier) => {
    var newText = value;
    if (
      identifier == "strPhone" ||
      identifier == "strZip" ||
      identifier == "strResPhone"
    ) {
      newText = value.replace(/[^0-9\\]/g, "");
    }
    this.state[identifier] = newText;
    this.setState({ shouldPerformValidation: false });
  };
  //#endregion

  onCountrySelect = (country) => {
    if (country.callingCode.length !== 0)
      this.countryCode = country.callingCode[0];
    else this.countryCode = "N/A";
  };

  onResCountrySelect = (country) => {
    if (country.callingCode.length !== 0)
      this.resCountryCode = country.callingCode[0];
    else this.resCountryCode = "N/A";
  };

  submitForm = () => {
    this.setState({ shouldPerformValidation: true });
    if (
      this.validationsHelper
        .checkTwoDigit(this.state.strFullName, strings("emptyName"))
        .trim() == "" &&
      this.validationsHelper
        .checkTwoDigit(this.state.strLastName, strings("emptyLastName"))
        .trim() == "" &&
      this.validationsHelper
        .validateEmail(this.state.strEmail, strings("emailValidate"))
        .trim() == "" &&
      this.validationsHelper
        .validateMobile(
          this.state.strResPhone,
          strings("emptyPhone"),
          this.resCountryCode
        )
        .trim() == "" &&
      this.validationsHelper
        .checkTwoDigit(this.state.strResName, strings("resNameError"))
        .trim() == "" &&
      this.validationsHelper
        .validateMobile(
          this.state.strPhone,
          strings("emptyPhone"),
          this.countryCode
        )
        .trim() == "" &&
      this.validationsHelper
        .validateZip(this.state.strZip, strings("resZipEmpty"))
        .trim() == ""
    ) {
      // this.callContactAPI()
      this.captchaForm.show();
    } else {
      return;
    }
  };

  callContactAPI = () => {
    netStatus((status) => {
      if (status) {
        this.setState({ isLoading: true });
        let param = {
          language_slug: this.props.lan,
          first_name: this.state.strFullName,
          last_name: this.state.strLastName,
          email: this.state.strEmail,
          res_phone_number: this.countryCode + this.state.strPhone,
          owner_phone_number: this.resCountryCode + this.state.strResPhone,
          res_name: this.state.strResName,
          res_zip_code: this.state.strZip,
          message: this.state.strComment,
        };
        contactAPI(
          param,
          this.onSuccessMessage,
          this.onFailureMessage,
          this.props
        );
      } else {
        this.setState({ isLoading: false });
        showNoInternetAlert();
      }
    });
  };
  onSuccessMessage = (onSuccess) => {
    this.setState({ isLoading: false });
    if (onSuccess.status == RESPONSE_SUCCESS)
      showDialogue(onSuccess.message, [], "", () => {
        this.props.navigation.goBack();
      });
    else showDialogue(onSuccess.message || strings("generalWebServiceError"));
  };

  onFailureMessage = (onFailure) => {
    this.setState({ isLoading: false });
    showDialogue(onFailure.message || strings("generalWebServiceError"));
  };

  onVerify = (token) => {
    console.log("success!", token);
    this.callContactAPI();
  };

  onExpire = () => {
    showDialogue(strings("captchaError"));
  };

  render() {
    return (
      <BaseContainer
        title={strings("contact")}
        left={"menu"}
        onLeft={this.onMenuPressed}
        // loading={isLoading}
      >
        {/* <NavigationEvents onDidFocus={this.onDidFocus} /> */}
        <WebView
          source={{
            uri: "https://tawk.to/chat/6440f3b94247f20fefecc374/1guerg3fo",
          }}
          javaScriptEnabled={true}
          injectedJavaScript={`
          window.LiveChatWidget = window.LiveChatWidget || {};
          window.LiveChatWidget.on = (...args) => {
            // Handle LiveChat events here
          };
        `}
        />
        {/* <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: EDColors.white }}
          contentContainerStyle={style.mainContainer}
          pointerEvents={this.state.isLoading ? "none" : "auto"}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enabled
          enableAutoAutomaticScroll={false}
          enableOnAndroid={true}
        > */}
        {/* <EDRTLText title={strings("startGrowing")} style={style.title} />
                    <EDRTLText title={strings("contactText")} style={style.normalText} />
                    <EDRTLText title={strings("contactText2")} style={[style.normalText, { marginBottom: 10 }]} /> */}

        {/* USERNAME */}
        {/* <EDRTLTextInput
            textstyle={{ color: EDColors.black }}
            icon="person"
            type={TextFieldTypes.default}
            identifier={"strFullName"}
            placeholder={strings("firstName")}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strFullName}
            errorFromScreen={
              this.state.shouldPerformValidation
                ? this.validationsHelper.checkTwoDigit(
                    this.state.strFullName,
                    strings("emptyName")
                  )
                : ""
            }
          /> */}

        {/* LAST NAME */}
        {/* <EDRTLTextInput
            textstyle={{ color: EDColors.black }}
            icon="person"
            type={TextFieldTypes.default}
            identifier={"strLastName"}
            placeholder={strings("lastName")}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strLastName}
            errorFromScreen={
              this.state.shouldPerformValidation
                ? this.validationsHelper.checkTwoDigit(
                    this.state.strLastName,
                    strings("emptyLastName")
                  )
                : ""
            }
          /> */}

        {/* EMAIL */}
        {/* <EDRTLTextInput
            icon="email"
            textstyle={{ color: EDColors.black }}
            type={TextFieldTypes.email}
            identifier={"strEmail"}
            placeholder={strings("email")}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strEmail}
            errorFromScreen={
              this.state.shouldPerformValidation
                ? this.validationsHelper.validateEmail(
                    this.state.strEmail,
                    strings("emailValidate")
                  )
                : ""
            }
          /> */}

        {/* RESTAURANT PHONE NUMBER */}
        {/* <EDRTLTextInput
            textstyle={{ color: EDColors.black }}
            icon="call"
            type={TextFieldTypes.phone}
            countryData={this.props.countryArray}
            dialCode={this.resCountryCode}
            identifier={"strResPhone"}
            onCountrySelect={this.onResCountrySelect}
            placeholder={strings("res_phone_number")}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strResPhone}
            errorFromScreen={
              this.state.shouldPerformValidation
                ? this.validationsHelper.validateMobile(
                    this.state.strResPhone,
                    strings("emptyPhone"),
                    this.resCountryCode
                  )
                : ""
            }
          /> */}

        {/* RES NAME */}
        {/* <EDRTLTextInput
            textstyle={{ color: EDColors.black }}
            icon="person"
            type={TextFieldTypes.default}
            identifier={"strResName"}
            placeholder={strings("resName")}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strResName}
            errorFromScreen={
              this.state.shouldPerformValidation
                ? this.validationsHelper.checkTwoDigit(
                    this.state.strResName,
                    strings("resNameError")
                  )
                : ""
            }
          /> */}

        {/* OWNER PHONE NUMBER */}
        {/* <EDRTLTextInput
            textstyle={{ color: EDColors.black }}
            icon="call"
            type={TextFieldTypes.phone}
            countryData={this.props.countryArray}
            dialCode={this.countryCode}
            identifier={"strPhone"}
            onCountrySelect={this.onCountrySelect}
            placeholder={strings("owner_phone_number")}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strPhone}
            errorFromScreen={
              this.state.shouldPerformValidation
                ? this.validationsHelper.validateMobile(
                    this.state.strPhone,
                    strings("emptyPhone"),
                    this.countryCode
                  )
                : ""
            }
            key={this.state.key}
          /> */}

        {/* ZIP CODE */}
        {/* <EDRTLTextInput
            textstyle={{ color: EDColors.black }}
            icon="call"
            type={TextFieldTypes.amount}
            identifier={"strZip"}
            placeholder={strings("resZip")}
            maxLength={8}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strZip}
            errorFromScreen={
              this.state.shouldPerformValidation
                ? this.validationsHelper.validateZip(
                    this.state.strZip,
                    strings("resZipEmpty")
                  )
                : ""
            }
          /> */}
        {/* COMMENT */}

        {/* <EDRTLTextInput
            textstyle={{ color: EDColors.black }}
            icon="person"
            type={TextFieldTypes.default}
            identifier={"strComment"}
            placeholder={strings("contactNotes")}
            onChangeText={this.textFieldTextDidChangeHandler}
            initialValue={this.state.strComment}
            // maxLength={5000}
          />
          <EDThemeButton
            label={strings("getStarted")}
            onPress={this.submitForm}
            isLoadingPermission={this.state.isLoading}
            isLoading={this.state.isLoading}
          />

          <EDRTLText
            title={strings("contactAsk")}
            style={[style.normalText, { marginTop: 20 }]}
          />
          <EDRTLView
            style={{
              alignItems: "center",
              alignSelf: "center",
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <EDRTLText
              title={strings("contactAsk2") + " "}
              style={[style.normalText]}
            />
            <EDRTLText
              onPress={this.initialCall}
              title={this.props.adminContact}
              style={[
                style.normalText,
                {
                  borderBottomColor: EDColors.primary,
                  borderBottomWidth: 1,
                  color: EDColors.primary,
                },
              ]}
            />
          </EDRTLView> */}
        {/* </KeyboardAwareScrollView> */}

        {/* <ConfirmGoogleCaptcha
          ref={(_ref) => (this.captchaForm = _ref)}
          siteKey={CAPTCHA_KEY}
          baseUrl={RETURN_URL + "/"}
          languageCode={this.props.lan}
          onMessage={this.onMessage}
          cancelButtonText={strings("dialogCancel")}
          closeButtonStyle={{ backgroundColor: EDColors.primary }}
          closeTextStyle={{
            fontFamily: EDFonts.semiBold,
            fontSize: getProportionalFontSize(14),
          }}
        /> */}
      </BaseContainer>
    );
  }

  initialCall = () => {
    let strLinkToOpen = "tel:" + this.props.adminContact;
    Linking.openURL(strLinkToOpen).catch((err) => {
      showValidationAlert(strings("callNotSupport"));
    });
  };
  onMessage = (event) => {
    if (event && event.nativeEvent.data) {
      if (["cancel", "error", "expired"].includes(event.nativeEvent.data)) {
        this.captchaForm.hide();
        showDialogue(strings("captchaError"));
        return;
      } else {
        console.log("Verified code from Google", event.nativeEvent.data);
        // setTimeout(() => {
        this.captchaForm.hide();
        this.callContactAPI();
        // }, 1500);
      }
    }
  };
  onError = (err) => {
    debugLog("CAPTCHA ERROR ::::", err);
    showDialogue(strings("generalWebServiceError"));
  };
}

export default connect(
  (state) => {
    return {
      lan: state.userOperations.lan,
      countryArray: state.userOperations.countryArray,
      firstName: state.userOperations.firstName,
      lastName: state.userOperations.lastName,
      PhoneNumber: state.userOperations.phoneNumberInRedux,
      email: state.userOperations.email,
      phoneCode: state.userOperations.phoneCode,
      adminContact: state.userOperations.adminContact,
    };
  },
  (dispatch) => {
    return {
      saveNavigationSelection: (dataToSave) => {
        dispatch(saveNavigationSelection(dataToSave));
      },
    };
  }
)(ContactUsContainer);

//#region  STYLES
export const style = StyleSheet.create({
  webViewStyle: {
    backgroundColor: "transparent",
    margin: 5,
    width: "95%",
  },
  mainContainer: {
    // flex: 1,
    backgroundColor: EDColors.white,
    padding: 15,
  },
  title: {
    fontFamily: EDFonts.bold,
    fontSize: getProportionalFontSize(18),
    color: EDColors.primary,
    textAlign: "center",
    marginVertical: 10,
  },
  normalText: {
    fontFamily: EDFonts.regular,
    fontSize: getProportionalFontSize(14),
    color: EDColors.text,
    textAlign: "center",
    marginVertical: 2.5,
  },
});
//#endregion
