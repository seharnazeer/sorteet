import React from "react";
import {
  FlatList,
  Image,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import deviceInfoModule from "react-native-device-info";
import { Icon } from "react-native-elements";
import Share from "react-native-share";
import {
  NavigationActions,
  NavigationEvents,
  StackActions,
} from "react-navigation";
import { connect } from "react-redux";
import Assets from "../assets";
import { strings } from "../locales/i18n";
import { saveCartCount } from "../redux/actions/Checkout";
import { saveNavigationSelection } from "../redux/actions/Navigation";
import {
  saveResIDInRedux,
  saveTableIDInRedux,
  saveUserDetailsInRedux,
  saveWalletMoneyInRedux,
} from "../redux/actions/User";
import { flushAllData, saveLanguage } from "../utils/AsyncStorageHelper";
import { showDialogue, showNoInternetAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import {
  capiString,
  debugLog,
  getProportionalFontSize,
  GOOGLE_WEBCLIENT_ID,
  isRTLCheck,
} from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import { netStatus } from "../utils/NetworkStatusConnection";
import { logoutAPI } from "../utils/ServiceManager";
import EDRTLView from "./EDRTLView";
import ProgressLoader from "./ProgressLoader";
import { LoginManager } from "react-native-fbsdk-next";
import metrics from "../utils/metrics";
import EDImage from "./EDImage";
import EDText from "./EDText";
import EDRTLText from "./EDRTLText";
import { initialWindowMetrics } from "react-native-safe-area-context";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

class SideBar extends React.PureComponent {
  //#region  LIFE CYCLE METHODS

  constructor(props) {
    super(props);

    this.arrayFinalSideMenu = [];
    this.arrSocialApps = [];
  }

  state = {
    is_updated: false,
    firstName: "",
    lastName: "",
    image: "",
    isLoading: false,
  };

  //#region HELPER FUNCTIONS
  /** SETUP SIDE MENU ITEMS */
  setupSideMenuData = () => {
    // Vikrant 29-07-21

    return [
      {
        route: "Home" || "MainContainer",
        screenName: strings("homeTitle"),
        icon: "home",
        type: "simple-line-icon",
      },
      {
        route: "Wallet",
        screenName: strings("myWallet"),
        icon: "wallet-outline",
        type: "ionicon",
        iconSize: getProportionalFontSize(23),
      },
      {
        route: "Order",
        screenName: strings("myOrder"),
        icon: "handbag",
        type: "simple-line-icon",
      },
      // {
      //   route: "Recipe",
      //   screenName: strings("recipeTitle"),
      //   icon: "restaurant-outline",
      //   type: "ionicon",
      // },
      // {
      //   route: "Vacation",
      //   screenName: strings("vacation"),
      //   icon: "beach-access",
      //   type: "material",
      // },
      // {
      //   route: "Laundry",
      //   screenName: strings("laundry"),
      //   icon: "local-laundry-service",
      //   type: "material",
      // },
      {
        route: "Event",
        screenName: strings("bookingsOnline"),
        icon: "calendar",
        type: "ant-design",
      },
      {
        route: "MyBooking",
        screenName: strings("myReservations"),
        icon: "calendar-check-o",
        type: "font-awesome",
      },
      {
        route: "Notification",
        screenName: strings("notification"),
        icon: "bell",
        type: "simple-line-icon",
      },
      {
        route: "contactUs",
        screenName: strings("contact"),
        icon: "chatbubble-ellipses-outline",
        type: "ionicon",
      },
    ];
  };

  // RENDER METHOD
  render() {
    Keyboard.dismiss();
    let arrTemp = this.setupSideMenuData();

    if (
      this.props.storeURL !== undefined &&
      this.props.storeURL !== null &&
      this.props.storeURL.app_store_url !== undefined
    ) {
      arrTemp = arrTemp.concat([
        {
          route: "Rate",
          screenName: strings("rate"),
          icon: "star",
          type: "simple-line-icon",
        },
        {
          route: "Share",
          screenName: strings("share"),
          icon: "share",
          type: "simple-line-icon",
        },
      ]);
    }
    let cmsData = this.props.arrayCMSPages || [];
    cmsData = cmsData.filter((data) => {
      return data.CMSSlug !== "contact-us";
    });
    let arrCMSPages = cmsData.map((itemToIterate) => {
      return {
        isAsset: true,
        route: "CMSContainer",
        screenName: itemToIterate.name,
        icon: { uri: itemToIterate.cms_icon },
        cmsSlug: itemToIterate.CMSSlug,
      };
    });
    let arraySideMenuData = arrTemp.concat(arrCMSPages);
    arraySideMenuData = arraySideMenuData.concat([
      { route: "FAQs", screenName: strings("faqs"), icon: "question-answer" },
    ]);
    this.arrayFinalSideMenu =
      this.props.firstName != undefined && this.props.firstName != ""
        ? arraySideMenuData.concat({
            route: "SignOut",
            screenName: strings("signout"),
            icon: "logout",
          })
        : arraySideMenuData;

    this.arrSocialApps = [];
    if (
      this.props.socialURL.facebook !== undefined &&
      this.props.socialURL.facebook !== null &&
      this.props.socialURL.facebook.trim().length !== 0
    ) {
      this.arrSocialApps.push({
        name: "facebook",
        color: EDColors.facebook,
        url: this.props.socialURL.facebook,
      });
    }
    if (
      this.props.socialURL.twitter !== undefined &&
      this.props.socialURL.twitter !== null &&
      this.props.socialURL.twitter.trim().length !== 0
    ) {
      this.arrSocialApps.push({
        name: "twitter",
        color: EDColors.twitter,
        type: "entypo",
        url: this.props.socialURL.twitter,
      });
    }

    if (
      this.props.socialURL.linkedin !== undefined &&
      this.props.socialURL.linkedin !== null &&
      this.props.socialURL.linkedin.trim().length !== 0
    ) {
      this.arrSocialApps.push({
        name: "logo-linkedin",
        type: "ionicon",
        color: EDColors.linkedin,
        url: this.props.socialURL.linkedin,
      });
    }

    return (
      <View
        style={{ flex: 1, backgroundColor: "#F5F5F5" }}
        pointerEvents={this.state.isLoading ? "none" : "auto"}
      >
        <NavigationEvents
          onDidFocus={() => {
            this.setState({ is_updated: true });
          }}
        />

        {this.state.isLoading ? <ProgressLoader /> : null}

        {/* PROFILE HEADER */}

        <TouchableOpacity
          style={{
            flex: 1,
            paddingTop:
              Platform.OS == "ios" ? initialWindowMetrics.insets.top + 5 : 5,
          }}
          activeOpacity={1.0}
          onPress={this.onProfilepressed}
        >
          <View style={[style.sideBarMainView]}>
            {/* <EDRTLView style={style.flexStyle}>
                            <EDImage
                                source={this.props.image}
                                style={style.sideBarImage}
                                resizeMode={'cover'}

                            />
                        </EDRTLView> */}

            {/* Profile name */}
            <EDRTLView style={style.flexStyle}>
              <View style={style.usernameTextView}>
                <EDText
                  style={style.zeroView}
                  textStyle={[style.usernameText]}
                  title={
                    this.props.firstName != undefined &&
                    this.props.firstName != ""
                      ? capiString(
                          this.props.firstName + " " + this.props.lastName
                        )
                      : strings("guest")
                  }
                />

                {/* View profile text */}
                <EDRTLView style={{ alignItems: "center" }}>
                  <EDText
                    style={style.zeroView}
                    textStyle={style.sidebarTextStyle}
                    title={
                      this.props.firstName != undefined &&
                      this.props.firstName != ""
                        ? strings("viewProfile")
                        : null
                    }
                  />
                  {this.props.firstName != undefined &&
                  this.props.firstName != "" ? (
                    <Icon
                      name={isRTLCheck() ? "caretleft" : "caretright"}
                      size={10}
                      color={EDColors.text}
                      type={"ant-design"}
                    />
                  ) : null}
                </EDRTLView>
              </View>
            </EDRTLView>
          </View>
        </TouchableOpacity>

        {/* ITEMS LIST */}
        <View style={style.navItemContainer}>
          <View style={{ flex: 4 }}>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={this.arrayFinalSideMenu}
              extraData={this.state}
              keyExtractor={(item, index) => item + index}
              renderItem={this.createView}
            />
          </View>

          {/* VERSION DETAIL */}
          <EDRTLView
            style={[
              style.versionStyle,
              { alignItems: isRTLCheck() ? "flex-end" : "flex-start" },
            ]}
          >
            <EDRTLView style={style.logoView}>
              <Image
                source={Assets.logo}
                style={{ height: 24, width: 24 }}
                resizeMode={"contain"}
              />
              {/* <Icon name="versions" type="octicon" size={getProportionalFontSize(18)}/> */}
              <Text style={style.iconText}>
                {strings("version") + " " + deviceInfoModule.getVersion()}
              </Text>
            </EDRTLView>
            {this.arrSocialApps !== undefined &&
            this.arrSocialApps !== null &&
            this.arrSocialApps.length > 0 ? (
              <EDRTLView style={style.socialIconView}>
                {this.arrSocialApps.map((item) =>
                  item.url !== undefined && item.url !== null ? (
                    <Icon
                      name={item.name}
                      color={item.color}
                      type={item.type}
                      style={style.socialIconStyle}
                      onPress={() => this.openSocialApp(item)}
                    />
                  ) : null
                )}
              </EDRTLView>
            ) : null}
          </EDRTLView>
        </View>
      </View>
    );
  }
  //#endregion

  /** BUTTON EVENT HANDLER
   *
   */
  //#region PROFILE PRESS HANDLER
  // SOCIAL APP PRESSED
  openSocialApp = (item) => {
    if (item.url !== undefined && item.url !== null)
      Linking.openURL(item.url).catch(() => {});
  };

  /** PROFILE PRESSES */
  onProfilepressed = () => {
    if (this.props.firstName != undefined && this.props.firstName != "") {
      this.props.navigation.navigate("ProfileContainer");
    } else {
      this.props.navigation.navigate("LoginContainer");
    }
  };
  //#endregion

  //#region ITEM PRESS HANDLER
  /** DRAWER ITEM PRESSED */
  onDrawerItemPressed = (selectedIndex) => {
    // CLOSE DRAWER
    if (
      this.arrayFinalSideMenu[selectedIndex].screenName !== strings("signout")
    ) {
      this.props.navigation.closeDrawer();
    }

    // LOGOUT
    if (
      this.arrayFinalSideMenu[selectedIndex].screenName === strings("signout")
    ) {
      showDialogue(
        strings("logoutConfirm"),
        [
          {
            text: strings("dialogYes"),
            onPress: this.callLogoutAPI,
            buttonColor: EDColors.offWhite,
          },
        ],
        strings("appName"),
        () => {},
        strings("dialogNo"),
        true
      );
    } else if (
      this.arrayFinalSideMenu[selectedIndex].screenName == strings("rate")
    ) {
      this.props.navigation.closeDrawer();
      this.openStore();
    } else if (
      this.arrayFinalSideMenu[selectedIndex].screenName == strings("share")
    ) {
      this.props.navigation.closeDrawer();
      this.shareApp();
    } else {
      this.props.navigation.closeDrawer();
      this.props.saveNavigationSelection(
        this.arrayFinalSideMenu[selectedIndex].route == "CMSContainer"
          ? this.arrayFinalSideMenu[selectedIndex].screenName
          : this.arrayFinalSideMenu[selectedIndex].route
      );

      debugLog(
        "Data",
        "routeName: " +
          this.arrayFinalSideMenu[selectedIndex].route +
          " params:  "
      );
      this.props.navigation.popToTop();

      this.props.navigation.dispatch(
        NavigationActions.navigate({
          routeName: this.arrayFinalSideMenu[selectedIndex].route, // <==== this is stackNavigator
          params: { routeName: this.arrayFinalSideMenu[selectedIndex] },
          action: NavigationActions.navigate({
            routeName: this.arrayFinalSideMenu[selectedIndex].route,
            params: { routeName: this.arrayFinalSideMenu[selectedIndex] }, // <===== this is defaultScreen for Portfolio
          }),
        })
      );
    }
  };
  //#endregion

  /** OPEN STORE FOR RATING */
  openStore() {
    if (Platform.OS == "ios") {
      Linking.openURL(this.props.storeURL.app_store_url).catch((err) => {});
    } else {
      Linking.openURL(this.props.storeURL.play_store_url).catch((err) => {});
    }
  }

  /** SHAR APPLICATION */
  shareApp() {
    const shareOptions = {
      title: strings("shareApp"),
      message:
        strings("shareAppMessage") +
        "\niOS: " +
        this.props.storeURL.app_store_url +
        "\nAndroid: " +
        this.props.storeURL.play_store_url,
      // url: 'iOS: ' + this.props.storeURL.app_store_url + '\nAndroid: ' + this.props.storeURL.play_store_url
      // url: `iOS: ${this.props.storeURL.app_store_url} \nAndroid: ${this.props.storeURL.play_store_url}`
    };
    Share.open(shareOptions);
  }

  //#region ITEM VIEW
  /** VIEW FOR ITEMS */
  createView = ({ item, index }) => {
    if (item != undefined) {
      let isSelected =
        item.route == "CMSContainer" ? item.screenName : item.route;
      return (
        // Vikrant 29-07-21
        <TouchableOpacity
          style={[
            style.drawerItemView,
            {
              backgroundColor:
                this.props.titleSelected == isSelected
                  ? EDColors.primary
                  : EDColors.radioSelected,
            },
          ]}
          onPress={() => {
            this.onDrawerItemPressed(index);
          }}
        >
          <EDRTLView style={style.sidebarItemsView} isWallet={'wallet'}>
            <EDRTLView
              style={{
                alignItems: "center",
                flex: 1,
              }}
            >
              {/* ICON */}
              {item.isAsset ? (
                <Image
                  style={{
                    width: getProportionalFontSize(20),
                    height: getProportionalFontSize(18),
                    tintColor:
                      this.props.titleSelected == isSelected
                        ? EDColors.white
                        : EDColors.blackSecondary,
                  }}
                  source={item.icon}
                  resizeMode="contain"
                />
              ) : (
                <Icon
                  name={item.icon}
                  color={
                    this.props.titleSelected == isSelected
                      ? EDColors.white
                      : EDColors.blackSecondary
                  }
                  size={this.props.iconSize || getProportionalFontSize(20)}
                  type={item.type || "material"}
                />
              )}

              {/* TITLE */}
              <Text
                style={[
                  style.drawerTextStyle,
                  {
                    color:
                      this.props.titleSelected == isSelected
                        ? EDColors.white
                        : EDColors.blackSecondary,
                  },
                ]}
              >
                {item.screenName}
              </Text>
            </EDRTLView>
            {isSelected == "Wallet" &&
            this.props.wallet_money !== null &&
            this.props.wallet_money !== undefined ? (
              <EDRTLView style={style.walletView}>
                <EDRTLText
                  style={style.walletText}
                  title={
                    (this.props.currency !== undefined &&
                    this.props.currency !== null &&
                    this.props.currency !== ""
                      ? this.props.currency
                      : "") + this.props.wallet_money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                />
              </EDRTLView>
            ) : null}
          </EDRTLView>
        </TouchableOpacity>
      );
    } else {
      return null;
    }
  };
  //#endregion

  /** YES BUTTON TAP EVENT OF LOGOUT CONFIRMATION DIALOGUE */
  onYesClick = () => {
    // CALL LOGOUT API
    this.callLogoutAPI();
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

  //#region NETWORK
  /** LOGOUT API CALL */
  callLogoutAPI = () => {
    netStatus((isConnected) => {
      this.setState({ isLoading: true });
      if (isConnected) {
        let params = {
          language_slug: this.props.lan,
          token: this.props.token,
          user_id: this.props.userID,
        };
        logoutAPI(
          params,
          this.onLogoutSuccess,
          this.onLogoutFailure,
          this.props
        );
      } else {
        this.setState({ isLoading: false });
        showNoInternetAlert();
      }
    });
  };

  /**
   *
   * @param {The success object returned in logout API response} _objSuccess
   */
  onLogoutSuccess = (_objSuccess) => {
    this.props.saveCredentials({
      phoneNumberInRedux: undefined,
      userIdInRedux: undefined,
    });

    this.facebookSignOut();
    this.googleSignOut();
    this.props.saveWalletMoney(undefined);
    flushAllData(
      (response) => {
        saveLanguage(
          this.props.lan,
          (success) => {},
          (error) => {}
        );
        this.props.saveCartCount(0);
        this.props.saveTableID(undefined);
        this.props.saveResID(undefined);
        this.props.navigation.dispatch(
          StackActions.reset({
            index: 0,
            actions: [
              NavigationActions.navigate({ routeName: "SplashContainer" }),
            ],
          })
        );
      },
      (error) => {}
    );
    this.props.firstName = "";
    this.props.lastName = "";
    this.props.image = "";
    this.props.navigation.closeDrawer();
    this.setState({ isLoading: false });
  };

  /**
   *
   * @param {The failure response object returned in logout API} _objFailure
   */
  onLogoutFailure = (_objFailure) => {
    // DISMISS LOGOUT DIALOGUE
    this.setState({ isLoading: false });
  };
  //#endregion
}

export const style = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.50)",
  },
  usernameTextView: { justifyContent: "space-evenly", flex: 1 },
  iconText: {
    fontFamily: EDFonts.medium,
    fontSize: getProportionalFontSize(14),
    color: "rgba(0, 0, 0, 0.4)",
    marginHorizontal: 5,
    alignSelf: "center",
  },
  zeroView: { marginHorizontal: 0, marginTop: 0 },
  drawerTextStyle: {
    fontSize: 16,
    marginHorizontal: 15,
    fontFamily: EDFonts.semiBold,
    fontSize: getProportionalFontSize(14),
    color: EDColors.blackSecondary,
    flex: 1,
  },
  modalSubContainer: {
    backgroundColor: EDColors.white,
    padding: 10,
    marginLeft: 20,
    marginRight: 20,
    borderRadius: 6,
    marginTop: 20,
    marginBottom: 20,
  },
  sidebarItemsView: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    justifyContent: "space-between",
  },
  deleteTitle: {
    fontFamily: EDFonts.bold,
    fontSize: 15,
    color: "#000",
    marginTop: 10,
    alignSelf: "center",
    textAlign: "center",
    marginLeft: 20,
    marginRight: 20,
    padding: 10,
  },
  optionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  drawerItemView: {
    flex: 1,
    // marginTop:8,
    marginHorizontal: 13,
    // marginBottom: 8,
    // borderWidth:1,
    borderRadius: 16,
    marginTop: 5,
  },
  navItemContainer: {
    flex: 5,
    paddingBottom: 20,
  },
  navItem: {
    color: EDColors.black,
    fontSize: 15,
    marginLeft: 40,
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  // socialIconStyle:{marginHorizontal:5},
  versionStyle: {
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    justifyContent: "space-between",
  },
  flexStyle: { flex: 1 },
  socialIconView: {
    flex: 1,
    justifyContent: "space-evenly",
    paddingHorizontal: 15,
  },
  sidebarTextStyle: {
    marginHorizontal: 5,
    fontSize: getProportionalFontSize(14),
    fontFamily: EDFonts.semiBold,
    color: EDColors.blackSecondary,
  },
  logoView: { paddingHorizontal: 20, alignItems: "center" },
  sideBarImage: {
    marginTop: 30,
    borderWidth: 0,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  walletView: {
    fontSize: getProportionalFontSize(12),
    backgroundColor: "#EFEFEF",
    padding: 8,
    overflow: "hidden",
    borderRadius: 16,
    height: metrics.screenHeight * 0.045,
    textAlignVertical: "center",
    alignItems: "center",
    justifyContent: "center",
    marginLeft:-40
  },
  walletText: {
    color: EDColors.black,
    fontFamily: EDFonts.semiBold,
    fontSize: getProportionalFontSize(12),
    textAlignVertical: "center",
    marginTop: 2.5,
  },
  usernameText: {
    color: EDColors.black,
    marginTop: 10,
    marginBottom: -10,
    fontSize: getProportionalFontSize(20),
    fontFamily: EDFonts.semiBold,
  },
  sideBarMainView: {
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 15,
    height: metrics.screenHeight * 25,
    borderBottomColor: "#EDEDED",
    borderBottomWidth: 1,
  },
});

export default connect(
  (state) => {
    return {
      titleSelected: state.navigationReducer.selectedItem,
      userToken: state.userOperations.phoneNumberInRedux,
      userID: state.userOperations.userIdInRedux,
      firstName: state.userOperations.firstName,
      lastName: state.userOperations.lastName,
      image: state.userOperations.image,
      token: state.userOperations.token,
      lan: state.userOperations.lan,
      arrayCMSPages: state.userOperations.arrayCMSData,
      storeURL: state.userOperations.storeURL || {},
      socialURL: state.userOperations.socialURL || {},
      currency: state.checkoutReducer.currency_symbol,
      wallet_money: state.userOperations.wallet_money,
    };
  },
  (dispatch) => {
    return {
      saveNavigationSelection: (dataToSave) => {
        dispatch(saveNavigationSelection(dataToSave));
      },
      saveCredentials: (detailsToSave) => {
        dispatch(saveUserDetailsInRedux(detailsToSave));
      },
      saveCartCount: (data) => {
        dispatch(saveCartCount(data));
      },
      saveTableID: (table_id) => {
        dispatch(saveTableIDInRedux(table_id));
      },
      saveResID: (table_id) => {
        dispatch(saveResIDInRedux(table_id));
      },
      saveWalletMoney: (token) => {
        dispatch(saveWalletMoneyInRedux(token));
      },
    };
  }
)(SideBar);
