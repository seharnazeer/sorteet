import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import React from "react";
import SliderContainer from "./SliderContainer";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SignInWithAppleButton } from "react-native-apple-authentication";
import { Icon } from "react-native-elements";
import {
  AccessToken,
  GraphRequest,
  GraphRequestManager,
  LoginManager,
} from "react-native-fbsdk-next";
import I18n from "i18n-js";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { SvgXml } from "react-native-svg";
import {
  NavigationActions,
  NavigationEvents,
  StackActions,
} from "react-navigation";
import { connect } from "react-redux";
import NavigationService from "../../NavigationService";
import Assets from "../assets";
import EDRTLView from "../components/EDRTLView";
import EDTextView from "../components/EDTextView";
import EDThemeButton from "../components/EDThemeButton";
import EDUnderlineButton from "../components/EDUnderlineButton";
import ProgressLoader from "../components/ProgressLoader";
import { setI18nConfig, strings } from "../locales/i18n";
import { saveCurrencySymbol } from "../redux/actions/Checkout";
import {
  rememberLoginInRedux,
  saveAdminPhone,
  saveAppleLogin,
  saveAppleToken,
  saveAppVersion,
  saveCMSPagesData,
  saveCountryCodeInRedux,
  saveCountryList,
  saveDistanceUnit,
  saveFoodType,
  saveLanguageInRedux,
  saveLanguageList,
  saveMapKeyInRedux,
  saveSocialButtonInRedux,
  saveSocialLoginInRedux,
  saveUserDetailsInRedux,
  saveUserFCMInRedux,
} from "../redux/actions/User";
import {
  getAppleLoginAsync,
  getAppleTokenAsync,
  getCurrency_Symbol,
  getLanguage,
  getSocialLogin,
  getUserFCM,
  getUserToken,
  saveAppleLoginAsync,
  saveAppleTokenAsync,
  saveSocialLogin,
  saveTranslation,
  saveUserFCM,
  saveUserLogin,
} from "../utils/AsyncStorageHelper";
import { showValidationAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import {
  debugLog,
  DEFAULT_TYPE,
  DINE_TYPE,
  EVENT_TYPE,
  getProportionalFontSize,
  GOOGLE_WEBCLIENT_ID,
  isRTLCheck,
  NOTIFICATION_TYPE,
  ORDER_TYPE,
  RESPONSE_SUCCESS,
} from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import { google_icon } from "../utils/EDSvgIcons";
import { checkFirebasePermission } from "../utils/FirebaseServices";
import metrics from "../utils/metrics";
import { netStatus } from "../utils/NetworkStatusConnection";
import {
  getAPPVersionAPI,
  getCMSPage,
  getCountryList,
  getFoodType,
  getLanguageList,
  socialAPI,
} from "../utils/ServiceManager";
import XLSX from "xlsx";
import * as RNFS from "react-native-fs";
import { Alert } from "react-native";
var redirectType = "";

class SplashContainer extends React.Component {
  //#region LIFE CYCLE METHODS

  /** CONTRUCTOR */
  constructor(props) {
    super(props);
    redirectType =
      this.props.screenProps !== undefined && this.props.screenProps !== null
        ? this.props.screenProps.notificationSlug
        : DEFAULT_TYPE;
  }

  state = {
    isVisible: false,
    bounceValue: new Animated.Value(metrics.screenHeight),
    fadeAnim: new Animated.Value(0),
    firebaseToken: "",
    isLoading: false,
    animated: false,
  };

  /** DID MOUNT */
  componentDidMount() {
    this.fetchAppVersion();
    checkFirebasePermission(
      (onSuccess) => {
        this.setState({ firebaseToken: onSuccess });
        this.props.saveToken(onSuccess);
      },
      (onFailure) => {
        console.log("Firebase token not allowed", onFailure);
      }
    );

    // this.getLanguageList()

    getCurrency_Symbol(
      (onSuccess) => {
        this.props.saveCurrencySymbol(onSuccess);
      },
      () => {}
    );
    this.saveLangInRedux();
  }

  /** WILL MOUNT */
  async componentWillMount() {
    this.checkData();
  }

  /** CALL FETCH APP VERSION API */
  fetchAppVersion = () => {
    netStatus((isConnected) => {
      if (isConnected) {
        let appParams = {
          language_slug: "en",
          user_type: "customer",
          platform: Platform.OS,
        };
        getAPPVersionAPI(
          appParams,
          this.onSuccessAppVersionHandler,
          this.onFailureAppVersionHandler
        );
      }
    });
  };

  onSuccessAppVersionHandler = (onSuccess) => {
    if (
      onSuccess !== undefined &&
      onSuccess !== null &&
      onSuccess.status == RESPONSE_SUCCESS
    ) {
      this.props.saveAppVersionInRedux(onSuccess);
    }
  };

  onFailureAppVersionHandler = (onFailure) => {};

  /** CALL CMS API */
  getCMSDetails = (selectedLanguage) => {
    netStatus((isConnected) => {
      if (isConnected) {
        let objCMSParams = {
          language_slug: selectedLanguage,
        };
        getCMSPage(
          objCMSParams,
          this.onSucessGetCMSDetails,
          this.onFailureGetCMSDetails
        );
      }
    });
  };

  onSucessGetCMSDetails = (objCMSSuccessResponse) => {
    if (
      objCMSSuccessResponse !== undefined &&
      objCMSSuccessResponse.cmsData !== undefined
    ) {
      this.props.saveCMSDetails(objCMSSuccessResponse.cmsData);
    }
    if (
      objCMSSuccessResponse !== undefined &&
      objCMSSuccessResponse.contact_us_phone !== undefined &&
      objCMSSuccessResponse.contact_us_phone !== null &&
      objCMSSuccessResponse.contact_us_phone !== ""
    ) {
      this.props.saveAdminContact(objCMSSuccessResponse.contact_us_phone);
    }
    if (objCMSSuccessResponse.shouldAllowFacebookLogin != undefined) {
      this.props.saveSocialButtonInRedux(
        objCMSSuccessResponse.shouldAllowFacebookLogin
      );
    } else {
      this.props.saveSocialButtonInRedux(false);
    }
    if (objCMSSuccessResponse.phone_code != undefined) {
      this.props.saveCountryCode(objCMSSuccessResponse.phone_code);
    } else {
      this.props.saveCountryCode("N/A");
    }

    if (
      objCMSSuccessResponse !== undefined &&
      objCMSSuccessResponse.google_map_api_key !== undefined &&
      objCMSSuccessResponse.google_map_api_key !== null &&
      objCMSSuccessResponse.google_map_api_key !== ""
    ) {
      this.props.saveMapKey(objCMSSuccessResponse.google_map_api_key);
    }
  };

  onFailureGetCMSDetails = (objCMSFailureResponse) => {
    debugLog("CMS FAILURE ::::::", objCMSFailureResponse);
  };

  /** CALL FOOD TYPE API */
  getFoodType = (selectedLanguage) => {
    netStatus((isConnected) => {
      if (isConnected) {
        let objFoodParams = {
          language_slug: selectedLanguage,
        };
        getFoodType(
          objFoodParams,
          this.onSuccessFoodType,
          this.onFailureFoodType
        );
      }
    });
  };

  onSuccessFoodType = (onSuccess) => {
    if (onSuccess !== undefined && onSuccess.food_type !== undefined) {
      this.props.saveFoodTypeInRedux(onSuccess.food_type);
    }
  };

  onFailureFoodType = (onFailure) => {
    debugLog("FOOD TYPE FAILURE ::::::", onFailure);
  };

  checkData = () => {
    getUserToken(
      (success) => {
        if (
          success != undefined &&
          success.UserID != undefined &&
          success.UserID != null &&
          success.UserID != ""
        ) {
          this.props.saveCredentials(success);
          this.props.rememberLogin(true);
          getAppleLoginAsync(
            (success) => {
              this.props.saveAppleLogin(success);
            },
            (failure) => {
              this.props.saveAppleLogin(false);
            }
          );
          getAppleTokenAsync(
            (success) => {
              this.props.saveAppleToken(success);
            },
            (failure) => {
              this.props.saveAppleToken("");
            }
          );
          debugLog("SCRREN TYPE ::::", redirectType);
          if (redirectType === ORDER_TYPE) {
            redirectType = undefined;

            NavigationService.navigateToSpecificRoute("Order");
          } else if (redirectType === NOTIFICATION_TYPE) {
            redirectType = undefined;
            NavigationService.navigateToSpecificRoute("Notification");
          } else if (redirectType === EVENT_TYPE) {
            redirectType = undefined;
            NavigationService.navigateToSpecificRoute("MyBookingContainer");
          } else {
            getUserFCM(
              (success) => {
                getSocialLogin(
                  (success) => {
                    if (success) {
                      this.props.saveSocialLogin(true);
                    } else {
                      this.props.saveSocialLogin(false);
                    }
                  },
                  (failure) => {
                    this.props.saveSocialLogin(false);
                  }
                );
                this.props.saveToken(success);
                this.saveLangInRedux();
                setTimeout(() => {
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
                }, 2000);
              },
              (failure) => {
                setTimeout(() => {
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
                }, 2000);
              }
            );
          }
        } else {
          setTimeout(() => {
            this._toggleSubview();
            this.setState({
              isVisible: true,
            });
          }, 2000);
        }
      },
      (failure) => {
        setTimeout(() => {
          this._toggleSubview();
          this.setState({ isVisible: true });
          this.props.saveCredentials({});
        }, 2000);
      }
    );
  };

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
   * ON facebok login
   */
  onFacebookLogin = () => {
    // LoginManager.setLoginBehavior('native_with_fallback')
    LoginManager.setLoginBehavior("native_with_fallback");

    LoginManager.logInWithPermissions(["public_profile", "email"]).then(
      (result) => {
        console.log("face", result);
        if (result.isCancelled) {
          debugLog("Login cancelled");
        } else {
          debugLog("Login success with permissions: ", result);
          this.fetchUserToken();
        }
      },
      (error) => {
        debugLog("Login fail with error: " + error);
        this.facebookSignOut();
      }
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
      webClientId: GOOGLE_WEBCLIENT_ID, // client ID of type WEB for your server (needed to verify user ID and offline access)
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
      let userInfo = await GoogleSignin.signIn();
      debugLog("USER INFO :::::", userInfo);
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
      this.setState({ isLoading: false });
      alert(error);
    }
  };
  //#endregion

  onDidFocusSplash = () => {
    this.googleSignOut();
    this.facebookSignOut();
  };

  // RENDER METHOD
  render() {
    var _this = this;
    console.log("ERRRRRRRRRRRRRRRRR: splash")
    return (
      <View style={{ flex: 1 }}>
        {/* BACKGROUND IMAGE */}
        <View style={{ flex: 1 }}>
          {/* <Image
            defaultSource={Assets.bgHome}
            source={Assets.bgHome}
            style={styles.backgroundImage}
          /> */}
          {/* <SliderContainer styling={styles.imageBackground} /> */}
          {/* <Animated.View style={{ width: "100%", height: "100%", opacity: this.state.fadeAnim, backgroundColor: EDColors.primary }}>
                        <Image source={Assets.logo_yellow} style={{ height: "30%", width: "70%", alignSelf: 'center', marginTop: "10%" }} resizeMode={"contain"} />
                    </Animated.View> */}
          {/* <Animated.Image
            source={Assets.bgHome}
            style={{
              width: "100%",
              height: "100%",
              opacity: this.state.fadeAnim,
            }}
          /> */}
          <SliderContainer styling={{
              width: "100%",
              height: "100%",
              opacity: 10,
            }} />
        </View>
        {/* PROGRESS LOADER */}
        {this.state.isLoading ? <ProgressLoader /> : null}

        <NavigationEvents onDidFocus={this.onDidFocusSplash} />
        <Animated.View
          style={[
            styles.subView,
            {
              transform: [{ translateY: this.state.bounceValue }],
              useNativeDriver: false,
              backgroundColor: "rgba(0,0,0,.8)",
            },
          ]}
        >
          {/* <ImageBackground defaultSource={Assets.bgOnboarding} source={Assets.bgOnboarding}
                        style={{
                            width: "100%", height: "100%"
                        }} > */}
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: 20,
              paddingTop: metrics.screenHeight * 0.4,
            }}
          >
            {/* SIGN UP */}
            <EDThemeButton
              onPress={() => this._onPressSignIn(true)}
              icon={"email"}
              label={strings("signWithEmail")}
              style={styles.transparentBtn}
            />
            <EDThemeButton
              icon={"call"}
              onPress={this._onPressSignIn}
              label={strings("signWithPhone")}
              style={[
                styles.transparentBtn,
                {
                  marginBottom: 30,
                },
              ]}
            />

            {this.props.isShowSocial != undefined && this.props.isShowSocial ? (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignSelf: "center",
                    width: "90%",
                    marginBottom: 30,
                    alignItems: "center",
                  }}
                >
                  <View style={styles.separator} />
                  <Text
                    style={{
                      fontSize: getProportionalFontSize(16),
                      color: EDColors.white,
                      fontFamily: EDFonts.regular,
                      textAlignVertical: "center",
                    }}
                  >
                    {strings("orMessage")}
                  </Text>
                  <View style={styles.separator} />
                </View>
                <EDRTLView
                  style={{
                    justifyContent: "space-evenly",
                    width: metrics.screenWidth * 0.65,
                    alignItems: "center",
                    padding: 10,
                    backgroundColor: EDColors.whiteOpaque,
                    borderRadius: 45,
                  }}
                >
                  <SvgXml
                    xml={google_icon}
                    width={40}
                    height={40}
                    onPress={this.onGoogleLogin}
                  />
                  {Platform.OS == "ios" ? (
                    <SignInWithAppleButton
                      buttonStyle={{
                        height: 60,
                        width: 60,
                        marginHorizontal: 20,
                      }}
                      callBack={this.onAppleSignIn}
                    />
                  ) : null}
                  {/* <Icon
                                        name="facebook"
                                        containerStyle={{
                                            backgroundColor: EDColors.facebook,
                                            width: (50),
                                            height: (50),
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: 25
                                        }}
                                        type="font-awesome"
                                        onPress={this.onFacebookLogin}
                                        color={EDColors.white}
                                        size={getProportionalFontSize(22)}
                                        solid
                                    /> */}
                </EDRTLView>
              </>
            ) : null}

            {/* {Platform.OS == 'android' ?
                            <EDRTLView style={{ justifyContent: 'space-evenly', width: metrics.screenWidth * 0.65 }}>
                                <SocialIcon
                                    type="facebook"
                                    raised
                                    onPress={this.onFacebookLogin}
                                />
                                <SocialIcon
                                    type="google"
                                    raised
                                    onPress={this.onGoogleLogin}
                                />
                            </EDRTLView> : null} */}
            {/* SKIP */}
            <EDThemeButton
              // isTransparent={true}
              onPress={this._onPressSkip}
              label={strings("guestCheckout")}
              textStyle={{ color: EDColors.black }}
              style={[
                styles.transparentBtn,
                {
                  backgroundColor: EDColors.white,
                  marginBottom: 10,
                },
              ]}
            />
            <EDRTLView style={[styles.RTLTextStyle, { marginBottom: 5 }]}>
              {/* DONT HAVE ACCOUNT TEXT */}
              <EDTextView
                textstyle={[styles.textStyle, { fontFamily: EDFonts.regular }]}
                text={strings("dontHaveAccount")}
              />

              {/* SIGN UP BUTTON */}
              <EDUnderlineButton
                style={styles.textStyle}
                viewStyle={styles.buttonStyle}
                textStyle={styles.touchableTextStyle}
                onPress={this._onPressSignUp}
                label={strings("signUpTitle")}
              />
            </EDRTLView>
          </View>
          {/* </ImageBackground> */}
        </Animated.View>
      </View>
    );
  }
  //#endregion

  /** TOGGLE ANIMATION VIEW */
  _toggleSubview() {
    Animated.spring(this.state.bounceValue, {
      toValue: 0,
      velocity: 3,
      tension: 2,
      friction: 8,
      useNativeDriver: true,
    }).start(() => {
      this.setState({ animated: true });
    });
    Animated.timing(this.state.fadeAnim, {
      toValue: 1,
      duration: 1000,
    }).start();
  }

  //#region BUTTON PRESS EVENTS
  /**
   *
   */
  _onPressSignIn = (byEmail) => {
    this.props.navigation.navigate("LoginContainer", {
      useEmail: byEmail == true,
    });
  };
  _onPressSkip = () => {
    this.props.navigation.dispatch(
      StackActions.reset({
        index: 0,
        actions: [
          NavigationActions.navigate({
            routeName: isRTLCheck() ? "MainContainer_Right" : "MainContainer",
          }),
        ],
      })
    );
  };
  _onPressSignUp = () => {
    this.props.navigation.navigate("SignupContainer");
  };
  //#endregion

  /** //#region
   * GET LANGAGE FROM ASYNC AND SAVE IN REDUX
   */
  saveLangInRedux() {
    getLanguage(
      (success) => {
        let lan = I18n.currentLocale();
        if (success != null && success != undefined) {
          this.savedLanguage = success;
          lan = success;
          I18n.locale = success;
          setI18nConfig(lan);
          this.props.saveLanguageRedux(success);
          this.getLanguageList();
          this.getCMSDetails(success);
          this.getCountryList(success);
        } else {
          lan = "en";
          I18n.locale = "en";
          setI18nConfig("en");
          this.props.saveLanguageRedux(lan);
          this.getLanguageList();
          this.getCountryList("en");
        }
      },
      (failure) => {}
    );
  }
  //#endregion

  //#region NETWORKS
  /**
   * @param { Success response object } onSuccess
   */
  onSuccessLogin = (onSuccess) => {
    this.setState({ isLoading: false });
    console.log("Login Detail ::::::::: ", onSuccess);
    if (onSuccess.status == RESPONSE_SUCCESS) {
      if (onSuccess.active) {
        if (
          onSuccess.login.PhoneNumber === "" ||
          onSuccess.login.PhoneNumber === null ||
          onSuccess.login.PhoneNumber === undefined
        ) {
          this.props.navigation.navigate("PhoneNumberInput", {
            user_id: onSuccess.login.UserID,
            social_media_id: onSuccess.login.social_media_id,
            isFacebook: true,
            isAppleLogin: false,
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
      } else {
        this.props.navigation.navigate("PhoneNumberInput", {
          user_id: onSuccess.login.user_id,
          social_media_id: onSuccess.login.social_media_id,
          isFacebook: true,
        });
      }
    } else if (
      onSuccess != undefined &&
      onSuccess.status == 0 &&
      onSuccess.is_deleted !== undefined &&
      onSuccess.is_deleted !== 1
    ) {
      if (onSuccess.active) {
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
      } else {
        this.props.navigation.navigate("PhoneNumberInput", {
          user_id: onSuccess.user_id,
          social_media_id: onSuccess.social_media_id,
          isFacebook: true,
        });
      }
    } else if (onSuccess.error != undefined) {
      this.facebookSignOut();
      this.googleSignOut();
      showValidationAlert(
        onSuccess.error.message != undefined
          ? onSuccess.error.message
          : strings("generalWebServiceError")
      );
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
  onFailureLogin = (onFailure) => {
    this.setState({ isLoading: false });
    this.facebookSignOut();
    this.googleSignOut();
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
        socialAPI(params, this.onSuccessLogin, this.onFailureLogin);
      } else {
        showValidationAlert(strings("noInternet"));
      }
    });
  }

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
          this.setState({ isLoading: false });
        }
      } else {
        showValidationAlert(strings("noInternet"));
      }
    });
  }
  //#endregion

  /**
   *@param { preferred language } lang
   *
   * @memberof SplashContainer
   */
  getCountryList = (lang) => {
    netStatus((isConnected) => {
      if (isConnected) {
        var param = {
          language_slug: lang,
        };
        getCountryList(
          param,
          this.onSuccessCountryList,
          this.onFailureCountryList
        );
      }
    });
  };

  onSuccessCountryList = (onSuccess) => {
    if (
      onSuccess.country_list !== undefined &&
      onSuccess.country_list.length > 0
    ) {
      this.props.saveCountryList(onSuccess.country_list);
    } else {
      this.props.saveCountryList(undefined);
    }
  };

  onFailureCountryList = (onFailure) => {
    console.log("::::::: FAILURE COUNTRY LIST", onFailure);
  };

  //Fetch locale data from server
  getFromServer = (url) => {
    debugLog("GET FROM SERVER ::::::", url);
    RNFS.downloadFile({
      fromUrl: url,
      toFile: `${RNFS.DocumentDirectoryPath}/translations.xlsx`,
    })
      .promise.then((res) => {
        this.convertExcelToJson();
      })
      .catch((err) => {});
  };
  convertExcelToJson = () => {
    RNFS.readFile(RNFS.DocumentDirectoryPath + "/translations.xlsx", "ascii")
      .then((res) => {
        /* parse file */
        const wb = XLSX.read(res, { type: "binary" });

        /* convert first worksheet to AOA */
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        let mainArray = [];
        let obj = [];
        data.map((e, index) => {
          let i = 0;
          while (i < e.length - 1) {
            obj[i] = {};
            let child_obj = {};
            child_obj[e[0]] = e[i + 1];
            obj[i] = child_obj;

            if (mainArray[i] === undefined) mainArray[i] = [];
            mainArray[i].push(obj[i]);
            i++;
            if (mainArray[i - 1].length == data.length) {
              mainArray[i - 1] = mainArray[i - 1].reduce(function (
                result,
                current
              ) {
                return Object.assign(result, current);
              },
              {});
            }
          }
        });

        saveTranslation(
          JSON.stringify(mainArray),
          () => setI18nConfig(),
          (err) => {}
        );
      })
      .catch((err) => {
        debugLog("Conversion Error", "Error " + err.message);
      });
  };

  /**
   *
   * @memberof SplashContainer
   */
  getLanguageList = (lang) => {
    netStatus((isConnected) => {
      if (isConnected) {
        getLanguageList(
          {},
          this.onSuccesslangList,
          this.onFailurelangList,
          this.props
        );
      }
    });
  };

  onSuccesslangList = (onSuccess) => {
    if (
      onSuccess.language_list !== undefined &&
      onSuccess.language_list.length > 1
    ) {
      this.props.saveLanguageList(onSuccess.language_list);
    } else {
      this.props.saveLanguageList(undefined);
    }
    if (
      onSuccess.language_file !== undefined &&
      onSuccess.language_file !== null &&
      onSuccess.language_file.trim().length !== 0
    ) {
      this.getFromServer(onSuccess.language_file);
    }

    if (
      this.savedLanguage == undefined ||
      (this.savedLanguage == null && this.savedLanguage == "")
    ) {
      let lan = onSuccess.default_language_slug || "en";
      I18n.locale = lan;
      setI18nConfig(lan);
      this.props.saveLanguageRedux(lan);
      this.getCMSDetails(lan);
    }
    if (
      onSuccess.use_mile !== undefined &&
      onSuccess.use_mile !== null &&
      onSuccess.use_mile !== ""
    ) {
      this.props.saveDistanceUnitInRedux(onSuccess.use_mile);
    }
  };

  onFailurelangList = (onFailure) => {
    console.log("::::::::: LANG FAILURE", onFailure);
  };
  //#endregion
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  textStyle: {
    color: EDColors.textNew,
    fontSize: getProportionalFontSize(16),
    marginTop: 10,
    fontFamily: EDFonts.semiBold,
  },
  buttonStyle: { borderBottomColor: EDColors.white, alignSelf: "flex-end" },
  touchableTextStyle: {
    color: EDColors.white,
    fontSize: getProportionalFontSize(16),
    marginTop: 10,
    fontFamily: EDFonts.semiBold,
  },
  RTLTextStyle: { flexDirection: "row", alignSelf: "center" },
  subView: {
    position: "absolute",
    bottom: 0,
    paddingBottom: 10,
    left: 0,
    right: 0,
    height: metrics.screenHeight * 0.5,
  },
  SocialIcon: {
    borderRadius: 0,
    width: metrics.screenWidth * 0.65,
    height: heightPercentageToDP("6.0%"),
    borderRadius: 5,
  },
  transparentBtn: {
    backgroundColor: EDColors.whiteOpaque,
    width: "90%",
    borderRadius: 16,
    paddingVertical: 10,
    height: heightPercentageToDP("6.5%"),
  },
  separator: {
    height: 1,
    backgroundColor: EDColors.white,
    flex: 1,
    alignSelf: "center",
    opacity: 0.8,
  },
});

// CONNECT FUNCTION
export default connect(
  (state) => {
    return {
      lan: state.userOperations.lan,
      isShowSocial: state.userOperations.isShowSocial,
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
      saveAppVersionInRedux: (token) => {
        dispatch(saveAppVersion(token));
      },
      saveLanguageRedux: (language) => {
        dispatch(saveLanguageInRedux(language));
      },
      saveCurrencySymbol: (symbol) => {
        dispatch(saveCurrencySymbol(symbol));
      },
      saveCountryCode: (code) => {
        dispatch(saveCountryCodeInRedux(code));
      },
      saveCMSDetails: (cmsDetails) => {
        dispatch(saveCMSPagesData(cmsDetails));
      },
      saveFoodTypeInRedux: (food_type) => {
        dispatch(saveFoodType(food_type));
      },
      rememberLogin: (data) => {
        dispatch(rememberLoginInRedux(data));
      },
      saveSocialLogin: (bool) => {
        dispatch(saveSocialLoginInRedux(bool));
      },
      saveSocialButtonInRedux: (boolean) => {
        dispatch(saveSocialButtonInRedux(boolean));
      },
      saveCountryList: (array) => {
        dispatch(saveCountryList(array));
      },
      saveLanguageList: (array) => {
        dispatch(saveLanguageList(array));
      },
      saveAppleLogin: (boolean) => {
        dispatch(saveAppleLogin(boolean));
      },
      saveAppleToken: (token) => {
        dispatch(saveAppleToken(token));
      },
      saveAdminContact: (token) => {
        dispatch(saveAdminPhone(token));
      },
      saveDistanceUnitInRedux: (token) => {
        dispatch(saveDistanceUnit(token));
      },
      saveMapKey: (key) => {
        dispatch(saveMapKeyInRedux(key));
      },
    };
  }
)(SplashContainer);
