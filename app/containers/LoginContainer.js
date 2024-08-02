import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  BackHandler,
  ScrollView,
} from "react-native";
import { Icon } from "react-native-elements";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import BannerImages from "../components/BannerImages";
import {
  NavigationActions,
  NavigationEvents,
  StackActions,
} from "react-navigation";
import { connect } from "react-redux";
import Assets from "../assets";
import EDForgotPassword from "../components/EDForgotPassword";
import EDPopupView from "../components/EDPopupView";
import EDRTLText from "../components/EDRTLText";
import EDRTLTextInput from "../components/EDRTLTextInput";
import EDRTLView from "../components/EDRTLView";
import EDThemeButton from "../components/EDThemeButton";
import EDUnderlineButton from "../components/EDUnderlineButton";
import NavigationService from "../../NavigationService";
import { strings } from "../locales/i18n";
import {
  rememberLoginInRedux,
  saveLanguageInRedux,
  saveUserDetailsInRedux,
  saveUserFCMInRedux,
  saveSocialLoginInRedux,
  saveAppleLogin,
  saveAppleToken,
} from "../redux/actions/User";
import {
  saveUserFCM,
  saveUserLogin,
  saveSocialLogin,
  saveAppleLoginAsync,
  saveAppleTokenAsync,
} from "../utils/AsyncStorageHelper";
import { showValidationAlert, showDialogue } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import {
  getProportionalFontSize,
  isRTLCheck,
  RESPONSE_SUCCESS,
  TextFieldTypes,
  debugLog,
  isVerificationRequired,
  GOOGLE_WEBCLIENT_ID,
} from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import { checkFirebasePermission } from "../utils/FirebaseServices";
import metrics from "../utils/metrics";
import {
  LoginManager,
  GraphRequestManager,
  GraphRequest,
  AccessToken,
} from "react-native-fbsdk-next";
import { netStatus } from "../utils/NetworkStatusConnection";
import { loginUser, socialAPI } from "../utils/ServiceManager";
import Validations from "../utils/Validations";
import { SocialIcon } from "react-native-elements";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from "react-native-responsive-screen";
import { saveIsCheckoutScreen } from "../redux/actions/Checkout";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { SignInWithAppleButton } from "react-native-apple-authentication";
import { SvgXml } from "react-native-svg";
import { google_icon } from "../utils/EDSvgIcons";
import Toast, { DURATION } from "react-native-easy-toast";
import EDCopyPasswordDialogue from "../components/EDCopyPasswordDialogue";
import { initialWindowMetrics } from "react-native-safe-area-context";
import CardFlip from "react-native-card-flip/CardFlip";
import SliderContainer from "./SliderContainer";

class LoginContainer extends React.Component {
  //#region LIFE CYCLE METHODS

  constructor(props) {
    super(props);

    this.validationsHelper = new Validations();
    this.countryCode = "91";
  }

  state = {
    phoneNumber: "",
    password: "",
    isLoading: false,
    modelVisible: false,
    firebaseToken: "",
    shouldPerformValidation: false,
    remember: true,
    phoneCode: "",
    modelPasswordVisible: false,
    passwordData: undefined,
    useEmail:
      this.props.navigation.state !== undefined &&
      this.props.navigation.state.params !== undefined &&
      this.props.navigation.state.params.useEmail !== undefined
        ? this.props.navigation.state.params.useEmail
        : false,
  };

  async componentDidMount() {
    this.backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      this.handlerBack
    );
    checkFirebasePermission(
      (onSuccess) => {
        this.setState({ firebaseToken: onSuccess });
        this.props.saveToken(onSuccess);
      },
      (onFailure) => {
        console.log("Firebase token not allowed", onFailure);
      }
    );

    if (
      this.props.countryArray !== undefined &&
      this.props.countryArray !== null &&
      this.props.countryArray[0] !== undefined &&
      this.props.countryArray[0].phonecode !== undefined
    ) {
      this.countryCode = this.props.countryArray[0].phonecode;
    }
    if (this.state.useEmail == true) {
      this.cardView.flipX();
    }
  }
  componentWillUnmount() {
    this.backHandler.remove();
  }
  handlerBack = () => {
    this.navigateToBack();
    return true;
  };
  toggleRemeber = () => {
    this.setState({ remember: !this.state.remember });
  };

  toggleView = () => {
    this.setState({
      useEmail: !this.state.useEmail,
      shouldPerformValidation: false,
      phoneNumber: "",
    });
    this.cardView.flipX();
  };

  navigateToBack = () => {
    console.log("ischeckout::", this.props.isCheckout);
    if (this.props.isCheckout) {
      this.props.saveIsCheckoutScreen(false);
    }
    this.props.navigation.goBack();
  };
  onCountrySelect = (country) => {
    debugLog("Country data :::::", country);
    this.countryCode = country.callingCode[0];
  };

  onDidFocusLogin = () => {
    this.googleSignOut();
    this.facebookSignOut();
  };

  // RENDER METHOD
  render() {
    return (
      <KeyboardAwareScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: EDColors.white }}
        // contentContainerStyle={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        enableAutoAutomaticScroll={false}
        enableOnAndroid
        enabled
      >
        <Icon
          name={"arrow-back"}
          onPress={this.navigateToBack}
          size={25}
          color={EDColors.white}
          containerStyle={{
            zIndex: 1,
            position: "absolute",
            top:
              10 + (Platform.OS == "ios" ? initialWindowMetrics.insets.top : 0),
            left: 10,
          }}
        />
        {/* PARENT VIEW */}
        <View
          pointerEvents={this.state.isLoading ? "none" : "auto"}
          style={styles.commoneFlex}
        >
          <NavigationEvents onDidFocus={this.onDidFocusLogin} />

          {/* FORGOT PASSWORD DIALOGUE */}
          {this.renderForgotPasswordDialogue()}
          {this.onPasswordChangeSuccessDialogue()}
          {/* TOP HEADER IMAGE */}
         {/* <Image
            defaultSource={Assets.bgSignup}
            source={Assets.bgSignup}
            style={styles.logInImageStyle}
          />*/}
            {/* <BannerImages images={this.arraySlider} /> */}
            <SliderContainer styling={styles.logInImageStyle} />

          {/* CHILD VIEW */}
          <View style={styles.parentViewContainer}>
            <EDRTLView style={styles.signInViewStyle}>
              {/* TITLE */}
              <Text style={styles.titleTextStyle}>{strings("loginTitle")}</Text>
            </EDRTLView>

            <View style={styles.loginView}>
              <CardFlip
                clickable={false}
                flip={this.state.useEmail}
                useNativeDriver={true}
                flipHorizontal
                ref={(ref) => (this.cardView = ref)}
              >
                {/* PHONE NUMBER / EMAIL */}
                {this.state.useEmail ? null : (
                  <EDRTLTextInput
                    textstyle={{ color: EDColors.black }}
                    icon="call"
                    countryData={this.props.countryArray}
                    type={TextFieldTypes.phone}
                    identifier={"phoneNumber"}
                    onCountrySelect={this.onCountrySelect}
                    placeholder={strings("phoneNumber")}
                    onChangeText={this.textFieldTextDidChangeHandler}
                    initialValue={this.state.phoneNumber}
                    errorFromScreen={
                      this.state.shouldPerformValidation
                        ? this.validationsHelper.validateMobile(
                            this.state.phoneNumber,
                            strings("emptyPhone"),
                            this.countryCode
                          )
                        : ""
                    }
                  />
                )}
                {!this.state.useEmail ? null : (
                  <EDRTLTextInput
                    icon="email"
                    textstyle={{ color: EDColors.black }}
                    type={TextFieldTypes.email}
                    identifier={"phoneNumber"}
                    placeholder={strings("email")}
                    onChangeText={this.textFieldTextDidChangeHandler}
                    initialValue={this.state.phoneNumber}
                    errorFromScreen={
                      this.state.shouldPerformValidation
                        ? this.validationsHelper.validateEmail(
                            this.state.phoneNumber,
                            strings("emptyEmail")
                          )
                        : ""
                    }
                  />
                )}
              </CardFlip>
              {/* PASSWORD */}
              <EDRTLTextInput
                textstyle={styles.textStyle}
                icon="lock"
                type={TextFieldTypes.password}
                identifier={"password"}
                placeholder={strings("password")}
                onChangeText={this.textFieldTextDidChangeHandler}
                initialValue={this.state.password}
                errorFromScreen={
                  this.state.shouldPerformValidation
                    ? this.validationsHelper.validateLoginPassword(
                        //check it for text
                        this.state.password,
                        strings("emptyPassword")
                      )
                    : ""
                }
              />
              <EDRTLView style={styles.rememberBox}>
                {/* REMEMBER ME */}
                <TouchableOpacity
                  onPress={this.toggleRemeber}
                  style={{ flex: 1, marginRight: isRTLCheck() ? 0 : 5 }}
                >
                  <EDRTLView
                    style={{
                      alignItems: "center",
                    }}
                  >
                    <Icon
                      name={this.state.remember ? "check-square" : "square"}
                      type={"feather"}
                      color={EDColors.blackSecondary}
                      size={getProportionalFontSize(15)}
                    />
                    <EDRTLText
                      title={strings("rememberMe")}
                      style={styles.rememberText}
                      numberOfLines={2}
                    />
                  </EDRTLView>
                </TouchableOpacity>

                {/* FORGOT PASSWORD */}
                <EDUnderlineButton
                  buttonStyle={[
                    styles.buttonStyle,
                    { marginLeft: isRTLCheck() ? 0 : 5 },
                  ]}
                  viewStyle={styles.underLineTxt}
                  textStyle={styles.touchableTextStyle}
                  onPress={this._onForgotPasswordPressed}
                  label={strings("forgotPassword") + "?"}
                />
              </EDRTLView>
              {/* SIGN IN AND SIGN UP TEXT */}
              <View style={styles.signInBottomViewStyle}>
                {/* SIGN IN BUTTON */}
                <EDThemeButton
                  isLoading={this.state.isLoading}
                  isLoadingPermission={this.state.isLoading}
                  label={strings("loginTitle")}
                  style={styles.edThemeButtonStyle}
                  textStyle={styles.edButtonTextStyle}
                  onPress={this._signInPressed}
                />

                <EDUnderlineButton
                  buttonStyle={[
                    styles.buttonStyle,
                    { marginTop: 5, marginBottom: 15 },
                  ]}
                  viewStyle={styles.underLineSignUpTxt}
                  style={styles.textStyle}
                  textStyle={[
                    styles.touchableTextStyle,
                    {
                      color: EDColors.black,
                      fontSize: getProportionalFontSize(16),
                      textDecorationLine: "underline",
                    },
                  ]}
                  onPress={this.toggleView}
                  label={
                    this.state.useEmail
                      ? strings("signWithPhone")
                      : strings("signWithEmail")
                  }
                />

                {/* SOCIAL LOGIN */}
                {/* {this.props.isShowSocial != undefined &&
                this.props.isShowSocial ? (
                  <View style={styles.socialView}>
                    <View style={styles.socialTextView}>
                      <View style={styles.lineStyle} />
                      <Text style={styles.lineText}>
                        {strings("orMessage")}
                      </Text>
                      <View style={styles.lineStyle} />
                    </View>
                    <EDRTLView style={styles.socialSubView}>
                      <SvgXml
                        xml={google_icon}
                        width={getProportionalFontSize(30)}
                        height={getProportionalFontSize(30)}
                        onPress={this.onGoogleLogin}
                      />
                      {Platform.OS == "ios" ? (
                        <SignInWithAppleButton
                          buttonStyle={styles.appleIconStyle}
                          callBack={this.onAppleSignIn}
                        />
                      ) : null}
                      {/* <Icon
                                                name="facebook"
                                                containerStyle={{
                                                    backgroundColor: EDColors.facebook,
                                                    width: getProportionalFontSize(35),
                                                    height: getProportionalFontSize(35),
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: getProportionalFontSize(17.5)
                                                }}
                                                type="font-awesome"
                                                onPress={this.onFacebookLogin}
                                                color={EDColors.white}
                                                size={getProportionalFontSize(22)}
                                                solid
                                            /> */}
                    {/* </EDRTLView> */}
                  {/* </View> */}
                {/* ) : null}  */}

                {/* SIGN UP BUTTON */}
                <View style={{ marginVertical: 10 }}>
                  <EDUnderlineButton
                    buttonStyle={[styles.buttonStyle, { marginTop: 30 }]}
                    viewStyle={styles.underLineSignUpTxt}
                    style={styles.textStyle}
                    textStyle={[
                      styles.touchableTextStyle,
                      {
                        color: EDColors.black,
                        fontSize: getProportionalFontSize(16),
                        textDecorationLine: "underline",
                      },
                    ]}
                    onPress={this._onSignUpPressed}
                    title={strings("dontHaveAccount")}
                    label={strings("signUpTitle")}
                  />
                  {/* </EDRTLView> */}
                </View>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    );
  }
  //#endregion

  //#region
  /** FORGOT PASSWORD HANDLER */
  _onForgotPasswordPressed = () => {
    this.setState({ modelVisible: true });
  };
  //#endregion

  //#region
  /** ON SIG UP HANDLER */
  _onSignUpPressed = () => {
    this.setState({ shouldPerformValidation: false });
    this.props.navigation.navigate("SignupContainer");
  };
  //#endregion

  //#region TEXT CHANGE EVENTS
  /**
   * @param {Value of textfield whatever user type} value
   ** @param {Unique identifier for every text field} identifier
   */
  textFieldTextDidChangeHandler = (value, identifier) => {
    var newText = value;
    if (!this.state.useEmail && identifier == "phoneNumber") {
      newText = value.replace(/[^0-9\\]/g, "");
    }
    this.state[identifier] = newText;
    this.setState({ shouldPerformValidation: false });
  };

  /** RENDER LOGOUT DIALOGUE */
  renderForgotPasswordDialogue = () => {
    return (
      <EDPopupView isModalVisible={this.state.modelVisible}>
        <EDForgotPassword
          lan={this.props.lan}
          onDismissHandler={this.onDismissForgotPasswordHandler}
          title={strings("logoutConfirm")}
          countryArray={this.props.countryArray}
          countryCode={this.countryCode}
          onPasswordChange={this.onPasswordChange}
        />
      </EDPopupView>
    );
  };
  //#endregion
  onPasswordChange = (objSuccess, code, phNo) => {
    // this.setState({modelPasswordVisible : true , passwordData : data})
    debugLog("PASSWORD CHANGE SUCCESS :::::", objSuccess);
    if (objSuccess.status == RESPONSE_SUCCESS) {
      this.props.navigation.navigate("OTPVerification", {
        forPasswordRecovery: "1",
        user_id: objSuccess.user_id,
        phNo: phNo,
        message: objSuccess.message,
        phoneCode: code,
      });
    }
  };
  onDismissHandler = () => {
    this.setState({ modelPasswordVisible: false, passwordData: undefined });
  };

  onPasswordChangeSuccessDialogue = () => {
    return (
      <EDPopupView isModalVisible={this.state.modelPasswordVisible}>
        <EDCopyPasswordDialogue
          data={this.state.passwordData}
          onDismissHandler={this.onDismissHandler}
        />
      </EDPopupView>
    );
  };

  //#region FORGOT PASSWORD BUTTON EVENTS
  onDismissForgotPasswordHandler = () => {
    this.setState({ modelVisible: false });
  };
  //#endregion

  /** SIGN IN PRESSED */
  _signInPressed = () => {
    this.setState({ shouldPerformValidation: true });
    if (!this.state.useEmail) {
      if (
        this.validationsHelper
          .validateMobile(
            this.state.phoneNumber,
            strings("emptyPhone"),
            this.countryCode
          )
          .trim() == "" &&
        this.state.password.trim().length > 0
      ) {
        this.callLoginAPI();
      }
    } else {
      if (
        this.validationsHelper
          .validateEmail(this.state.phoneNumber, strings("emptyEmail"))
          .trim() == "" &&
        this.state.password.trim().length > 0
      ) {
        this.callLoginAPI();
      }
    }
  };

  /**
   * ON facebok login
   */
  onFacebookLogin = () => {
    LoginManager.setLoginBehavior("native_with_fallback");
    LoginManager.logInWithPermissions(["public_profile", "email"]).then(
      (result) => {
        if (result.isCancelled) {
          debugLog("Login cancelled");
        } else {
          debugLog("Login success with permissions: ", result);
          this.fetchUserToken();
        }
      },
      (error) => debugLog("Login fail with error: " + error)
    );
    // this.props.navigation.navigate('PhoneNumberInput')
  };

  /**
   * Fetch user token
   */

  fetchUserToken = () => {
    AccessToken.getCurrentAccessToken()
      .then((data) => {
        debugLog("ACCESS TOKEN DATA :::::", data);
        if (data.accessToken !== undefined)
          this.fetchUserFaceBookProfile(data.accessToken);
        else debugLog("FAILED TO GET ACCESS TOKEN ::::");
      })
      .catch((error) => {
        debugLog("ERROR WHILE FETHCING TOKEN ::::", error);
      });
  };

  /**
   * Get facebook user info
   */

  fetchUserFaceBookProfile = (accessToken) => {
    const responseCallback = (error, result) => {
      debugLog("FB ERRROR AND RESULT ::::::", error, result);
      if (error) {
        debugLog("ERROR FETCHING PROFILE DETAILS :::::");
      } else {
        debugLog("PROFILE DETAILS :::::", result);
        if (
          result.email != undefined &&
          result.email != null &&
          result.email != ""
        ) {
          this.loginUser(result);
        } else {
          showValidationAlert(strings("registerError"));
        }
      }
    };

    const profileRequestParams = {
      fields: {
        string: "id, name, email, first_name, last_name, gender, picture",
      },
    };

    const profileRequestConfig = {
      httpMethod: "GET",
      version: "v2.5",
      parameters: profileRequestParams,
      accessToken: accessToken.toString(),
    };

    const profileRequest = new GraphRequest(
      "/me",
      profileRequestConfig,
      responseCallback
    );

    // Start the graph request.
    new GraphRequestManager().addRequest(profileRequest).start();
  };

  //#region Google Login
  /**
   * on Google Login
   */
  onGoogleLogin = () => {
    GoogleSignin.configure({
      scopes: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ], // what API you want to access on behalf of the user, default is email and profile
      webClientId: '242841391600-1lla6gm87608trmdckrdb6oc9n4c0lse.apps.googleusercontent.com', // client ID of type WEB for your server (needed to verify user ID and offline access)
      // loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
      forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
      // iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] optional, if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
    });
    this.loginWithGoogle();
  };
  //Login with google
  loginWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo  = await GoogleSignin.signIn();
      this.loginUser(userInfo, true);
    } catch (error) {
      debugLog("Error in google sign in :::::", error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
      } else {
        // some other error happened
      }
    }
  };
  //#endregion

  //#region APPLE LOGIN
  onAppleSignIn = (payload) => {
    try {
      this.loginAppleUser(payload);
    } catch (error) {
      console.log("::::: APPLE ERROR", error);
      alert(error);
    }
  };
  //#endregion

  //#region NETWORK API
  /**
   * @param { Success response object } onSuccess
   */
  onSuccessLogin = (onSuccess) => {
    this.setState({ isLoading: false });
    console.log("Login Detail ::::::::: ", onSuccess);
    if (onSuccess.error != undefined) {
      showValidationAlert(
        onSuccess.error.message != undefined
          ? onSuccess.error.message
          : strings("generalWebServiceError")
      );
    }

    // this.props.saveCredentials(onSuccess.login);
    // this.props.saveSocialLogin(false)

    // // Remember login for future use
    // this.props.rememberLogin(this.state.remember)
    // this.props.saveAppleLogin(false)

    // // Save login in async if remember me is selected
    // if (this.state.remember)
    //     saveUserLogin(onSuccess.login, success => { }, errAsyncStore => { });

    // if (this.props.isCheckout) {
    //     this.props.saveIsCheckoutScreen(false)
    //     NavigationService.navigateToSpecificRoute("CartContainer")
    // } else {
    //     this.props.saveToken(this.state.firebaseToken)
    //     saveUserFCM(this.state.firebaseToken, success => { }, failure => { })
    //     this.props.navigation.dispatch(
    //         StackActions.reset({
    //             index: 0,
    //             actions: [
    //                 NavigationActions.navigate({ routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer" })
    //             ]
    //         })
    //     );
    // }
    if (onSuccess.error != undefined) {
      showValidationAlert(
        onSuccess.error.message != undefined
          ? onSuccess.error.message
          : strings("general.generalWebServiceError")
      );
    } else if (onSuccess.status == 0) {
      showValidationAlert(onSuccess.message);
    } else if (onSuccess.status == RESPONSE_SUCCESS) {
      if (onSuccess.active == false && isVerificationRequired) {
        showDialogue(onSuccess.message, [], "", () => {
          this.props.navigation.navigate("OTPVerification", {
            isFromLogin: true,
            user_id: onSuccess.login.UserID,
            phNo: onSuccess.login.PhoneNumber,
            password: this.state.password,
            phoneCode: onSuccess.login.phone_code,
          });
        });
        return;
      }
      this.props.saveCredentials(onSuccess.login);
      this.props.saveSocialLogin(false);

      // Remember login for future use
      this.props.rememberLogin(this.state.remember);
      this.props.saveAppleLogin(false);

      // Save login in async if remember me is selected
      if (this.state.remember)
        saveUserLogin(
          onSuccess.login,
          (success) => {},
          (errAsyncStore) => {}
        );
      console.log("checkout::", this.props.isCheckout);
      if (this.props.isCheckout) {
        this.props.saveIsCheckoutScreen(false);
        NavigationService.navigateToSpecificRoute("CartContainer");
      } else {
        this.props.saveToken(this.state.firebaseToken);
        saveUserFCM(
          this.state.firebaseToken,
          (success) => {},
          (failure) => {}
        );
        this.props.navigation.dispatch(
          StackActions.reset({
            index: 0,
            actions: [
              NavigationActions.navigate({
                routeName: isRTLCheck()
                  ? "MainContainer_Right"
                  : "MainContainer",
              }),
            ],
          })
        );
      }
    } else {
      showValidationAlert(onSuccess.message);
    }
  };

  /**
   * @param { Failure response objetc } onFailure
   */
  onFailureLogin = (onFailure) => {
    this.setState({ isLoading: false });
    showValidationAlert(strings("generalWebServiceError"));
  };

  /**
   * LOGIN API
   */
  callLoginAPI() {
    console.log("FIRST FIREBASE TOKEN ::::::::" + this.state.firebaseToken);
    netStatus((status) => {
      if (status) {
        this.setState({ isLoading: true });

        let params = {
          language_slug: this.props.lan,
          Password: this.state.password,
          firebase_token: this.state.firebaseToken,
          phone_code: this.countryCode,
        };
        params[this.state.useEmail ? "Email" : "PhoneNumber"] =
          this.state.phoneNumber;
        loginUser(params, this.onSuccessLogin, this.onFailureLogin, this.props);
      } else {
        showValidationAlert(strings("noInternet"));
      }
    });
  }
  /**
   * SIGNOUT FOR FACEBOOK USER
   */
  facebookSignOut = () => {
    try {
      LoginManager.logOut();
    } catch {
      (error) => {
        debugLog("Facebook signout error :::::", error);
      };
    }
  };

  /**
   * SIGNOUT FOR GOOGLE USER
   */
  googleSignOut = () => {
    GoogleSignin.configure({
      scopes: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ], // what API you want to access on behalf of the user, default is email and profile
      webClientId: GOOGLE_WEBCLIENT_ID, // client ID of type WEB for your server (needed to verify user ID and offline access)
      // loginHint: '', // [iOS] The user's ID, or email address, to be prefilled in the authentication UI if possible. [See docs here](https://developers.google.com/identity/sign-in/ios/api/interface_g_i_d_sign_in.html#a0a68c7504c31ab0b728432565f6e33fd)
      forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
    });
    GoogleSignin.signOut()
      .then(() => debugLog("Google signout success :::::"))
      .catch((error) => {
        debugLog("Google signout error :::::", error);
      });
  };

  /**
   * @param { Success response object } onSuccess
   */
  onSuccessSocialLogin = (onSuccess) => {
    this.setState({ isLoading: false });
    console.log("Login Detail ::::::::: ", onSuccess);
    if (onSuccess.status == RESPONSE_SUCCESS) {
      if (onSuccess.active && this.props.isCheckout == false) {
        if (
          onSuccess.login.PhoneNumber === "" ||
          onSuccess.login.PhoneNumber === null ||
          onSuccess.login.PhoneNumber === undefined
        ) {
          this.props.navigation.navigate("PhoneNumberInput", {
            user_id: onSuccess.login.UserID,
            social_media_id: onSuccess.login.social_media_id,
            isFacebook: true,
          });
          return;
        }
        this.props.saveCredentials(onSuccess.login);
        saveUserLogin(
          onSuccess.login,
          (success) => {},
          (errAsyncStore) => {}
        );
        this.props.saveSocialLogin(true);
        saveSocialLogin(
          true,
          (success) => {},
          (fail) => {}
        );
        this.props.saveToken(this.state.firebaseToken);
        saveUserFCM(
          this.state.firebaseToken,
          (success) => {},
          (failure) => {}
        );
        this.props.saveAppleLogin(false);

        this.props.navigation.dispatch(
          StackActions.reset({
            index: 0,
            actions: [
              NavigationActions.navigate({
                routeName: isRTLCheck()
                  ? "MainContainer_Right"
                  : "MainContainer",
              }),
            ],
          })
        );
      } else if (onSuccess.active && this.props.isCheckout) {
        if (
          onSuccess.login.PhoneNumber === "" ||
          onSuccess.login.PhoneNumber === null ||
          onSuccess.login.PhoneNumber === undefined
        ) {
          this.props.navigation.navigate("PhoneNumberInput", {
            user_id: onSuccess.login.UserID,
            social_media_id: onSuccess.login.social_media_id,
            isFacebook: true,
          });
          return;
        }

        this.props.saveCredentials(onSuccess.login);
        saveUserLogin(
          onSuccess.login,
          (success) => {},
          (errAsyncStore) => {}
        );
        this.props.saveSocialLogin(true);
        saveSocialLogin(
          true,
          (success) => {},
          (fail) => {}
        );
        this.props.saveToken(this.state.firebaseToken);
        saveUserFCM(
          this.state.firebaseToken,
          (success) => {},
          (failure) => {}
        );
        this.props.saveAppleLogin(false);

        this.props.saveIsCheckoutScreen(false);
        NavigationService.navigateToSpecificRoute("CartContainer");
      } else {
        this.props.navigation.navigate("PhoneNumberInput", {
          user_id: onSuccess.UserID,
          social_media_id: onSuccess.social_media_id,
          isFacebook: true,
        });
      }
    } else if (
      onSuccess != undefined &&
      onSuccess.status == 0 &&
      onSuccess.is_deleted !== undefined &&
      onSuccess.is_deleted !== 1
    ) {
      this.props.navigation.navigate("PhoneNumberInput", {
        user_id: onSuccess.UserID,
        social_media_id: onSuccess.social_media_id,
        isFacebook: true,
      });
    } else if (onSuccess.error != undefined) {
      showValidationAlert(
        onSuccess.error.message != undefined
          ? onSuccess.error.message
          : strings("generalWebServiceError")
      );
      this.facebookSignOut();
      this.googleSignOut();
    } else if (onSuccess.active === false) {
      showValidationAlert(onSuccess.message);
      this.facebookSignOut();
      this.googleSignOut();
    } else {
      showValidationAlert(onSuccess.message);
      this.facebookSignOut();
      this.googleSignOut();
    }
  };

  /**
   * @param { Failure response objetc } onFailure
   */
  onFailureSocialLogin = (onFailure) => {
    console.log(":::: FAILED", onFailure);
    this.setState({ isLoading: false });
    showValidationAlert(
      onFailure.response != undefined
        ? onFailure.response
        : strings("generalWebServiceError")
    );
  };

  /**
   * LOGIN API
   */
  loginUser(userDetails, isGoogle = false) {
    console.log("FIRST FIREBASE TOKEN ::::::::" + this.state.firebaseToken);
    netStatus((status) => {
      if (status) {
        this.setState({ isLoading: true });
        let params = {
          language_slug: this.props.lan,
          FirstName: isGoogle
            ? userDetails.user.givenName
            : userDetails.first_name,
          LastName: isGoogle
            ? userDetails.user.familyName
            : userDetails.last_name,
          Email: isGoogle ? userDetails.user.email : userDetails.email,
          firebase_token: this.state.firebaseToken,
          image: isGoogle
            ? userDetails.user.photo
            : userDetails.picture.data.url,
          social_media_id: isGoogle ? userDetails.user.id : userDetails.id,
          login_type: isGoogle ? "google" : "facebook",
        };
        socialAPI(params, this.onSuccessSocialLogin, this.onFailureSocialLogin);
      } else {
        showValidationAlert(strings("noInternet"));
      }
    });
  }
  //#endregion

  /**
   * @param { Success response object } onSuccess
   */
  onSuccessAppleLogin = (onSuccess) => {
    this.setState({ isLoading: false });
    console.log("Login Detail Apple ::::::::: ", onSuccess);

    if (onSuccess.status == RESPONSE_SUCCESS) {
      if (onSuccess.active) {
        this.props.saveCredentials(onSuccess.login);
        saveUserLogin(
          onSuccess.login,
          (success) => {},
          (errAsyncStore) => {}
        );
        this.props.saveSocialLogin(true);
        saveSocialLogin(
          true,
          (success) => {},
          (fail) => {}
        );
        this.props.saveToken(this.state.firebaseToken);
        saveUserFCM(
          this.state.firebaseToken,
          (success) => {},
          (failure) => {}
        );
        this.props.saveAppleLogin(true);
        saveAppleLoginAsync(
          true,
          () => {},
          () => {}
        );

        this.props.navigation.dispatch(
          StackActions.reset({
            index: 0,
            actions: [
              NavigationActions.navigate({
                routeName: isRTLCheck()
                  ? "MainContainer_Right"
                  : "MainContainer",
              }),
            ],
          })
        );
      }
    } else if (onSuccess.error != undefined) {
      showValidationAlert(
        onSuccess.error.message != undefined
          ? onSuccess.error.message
          : strings("generalWebServiceError")
      );
    } else if (onSuccess.active === false) {
      showValidationAlert(onSuccess.message);
    } else {
      showValidationAlert(onSuccess.message);
    }
  };

  /**
   * @param { Failure response objetc } onFailure
   */
  onFailureAppleLogin = (onFailure) => {
    console.log("::::::: FAILED APPLE", onFailure);
    this.setState({ isLoading: false });
    showValidationAlert(
      onFailure.response != undefined
        ? onFailure.response
        : strings("generalWebServiceError")
    );
  };

  /**
   * LOGIN API
   */
  loginAppleUser(userDetails) {
    netStatus((status) => {
      if (status) {
        try {
          this.setState({ isLoading: true });
          let params = {
            language_slug: this.props.lan,
            FirstName: userDetails.fullName.givenName,
            LastName: userDetails.fullName.familyName,
            Email: userDetails.email,
            firebase_token: this.state.firebaseToken,
            image: "",
            social_media_id: userDetails.user,
            login_type: "apple",
          };
          saveAppleTokenAsync(
            userDetails.user,
            () => {},
            () => {}
          );
          this.props.saveAppleToken(userDetails.user);
          socialAPI(params, this.onSuccessAppleLogin, this.onFailureAppleLogin);
        } catch (error) {
          console.log("::::: ERROR APPLE", error);
          this.setState({ isLoading: false });
        }
      } else {
        showValidationAlert(strings("noInternet"));
      }
    });
  }
  //#endregion
}

const styles = StyleSheet.create({
  loginView: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: getProportionalFontSize(20),
  },
  parentViewContainer: { flex: 1, width: "100%", height: "100%" },
  childViewContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    marginTop: -getProportionalFontSize(100),
  },
  socialView: { alignSelf: "center", marginTop: 10, justifyContent: "center" },
  socialTextView: {
    flexDirection: "row",
    alignSelf: "center",
    marginBottom: 20,
  },
  lineText: {
    fontSize: getProportionalFontSize(14),
    fontFamily: EDFonts.regular,
    color: EDColors.txtplaceholder,
  },
  appleIconStyle: {
    height: getProportionalFontSize(50),
    width: getProportionalFontSize(50),
    borderRadius: 50,
    marginTop: 7,
    marginLeft: 5,
  },
  socialSubView: {
    justifyContent: "space-evenly",
    width: metrics.screenWidth * 0.65,
    alignItems: "center",
    alignSelf: "center",
  },
  lineStyle: {
    height: 0.5,
    backgroundColor: EDColors.txtplaceholder,
    width: getProportionalFontSize(130),
    alignSelf: "center",
  },
  iconStyle: {
    width: metrics.screenWidth,
    alignSelf: "center",
    height: metrics.screenHeight * 0.2,
    marginBottom: -10,
  },
  titleTextStyle: {
    color: EDColors.black,
    fontFamily: EDFonts.bold,
    fontSize: getProportionalFontSize(28),
    alignSelf: "flex-start",
    marginTop: getProportionalFontSize(50),
  },
  buttonStyle: { marginBottom: 0 },
  touchableTextStyle: {
    fontSize: getProportionalFontSize(14),
    fontFamily: EDFonts.semiBold,
    color: EDColors.black,
  },
  backgroundImageView: { width: "100%", height: "100%" },
  textStyle: {
    color: EDColors.black,
    fontSize: getProportionalFontSize(16),
    marginTop: 0,
  },
  signInViewStyle: {
    borderRadius: 32,
    marginTop: -32,
    backgroundColor: EDColors.white,
    paddingHorizontal: 20,
  },
  signInBottomViewStyle: { alignSelf: "center", marginTop: 10 },
  edThemeButtonStyle: {
    alignSelf: "center",
    width: metrics.screenWidth * 0.9,
    borderRadius: 16,
    marginBottom: 20,
    height: metrics.screenHeight * 0.07,
  },
  edButtonTextStyle: {
    fontSize: getProportionalFontSize(16),
    fontFamily: EDFonts.semiBold,
  },
  underLineTxt: { borderBottomColor: EDColors.black },
  underLineSignUpTxt: { borderBottomColor: EDColors.white },

  rememberBox: {
    alignItems: "center",
    marginVertical: getProportionalFontSize(20),
    marginTop: getProportionalFontSize(30),
    // alignContent: 'space-between',
    justifyContent: "space-between",
  },
  rememberText: {
    color: EDColors.blackSecondary,
    fontSize: getProportionalFontSize(14),
    marginHorizontal: 5,
    fontFamily: EDFonts.semiBold,
  },
  SocialIcon: {
    borderRadius: 0,
    width: metrics.screenWidth * 0.65,
    height: heightPercentageToDP("6.0%"),
    borderRadius: 5,
    marginTop: 10,
  },
  commoneFlex: { flex: 1, backgroundColor: EDColors.white },
  logInImageStyle: { height: metrics.screenHeight * 0.36, width: "100%" },
});

// CONNECT FUNCTION
export default connect(
  (state) => {
    return {
      lan: state.userOperations.lan,
      isShowSocial: state.userOperations.isShowSocial,
      isCheckout: state.checkoutReducer.isCheckout,
      countryArray: state.userOperations.countryArray,
    };
  },
  (dispatch) => {
    return {
      saveCredentials: (detailsToSave) => {
        dispatch(saveUserDetailsInRedux(detailsToSave));
      },
      saveToken: (token) => {
        dispatch(saveUserFCMInRedux(token));
      },
      saveLanguageRedux: (language) => {
        dispatch(saveLanguageInRedux(language));
      },
      rememberLogin: (data) => {
        dispatch(rememberLoginInRedux(data));
      },
      saveSocialLogin: (bool) => {
        dispatch(saveSocialLoginInRedux(bool));
      },
      saveIsCheckoutScreen: (data) => {
        dispatch(saveIsCheckoutScreen(data));
      },
      saveAppleLogin: (boolean) => {
        dispatch(saveAppleLogin(boolean));
      },
      saveAppleToken: (token) => {
        dispatch(saveAppleToken(token));
      },
    };
  }
)(LoginContainer);
