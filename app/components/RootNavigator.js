import React from "react";
import deviceInfoModule from "react-native-device-info";
import { createAppContainer, withNavigation } from "react-navigation";
import { createDrawerNavigator } from 'react-navigation-drawer';
import { createStackNavigator } from 'react-navigation-stack';
import AboutStoreContainer from "../containers/AboutStoreContainer";
import AddressListContainer from "../containers/AddressListContainer";
import AddressMapContainer from "../containers/AddressMapContainer";
import BookingAvailabilityContainer from "../containers/BookingAvailabilityContainer";
import BookingSuccessContainer from "../containers/BookingSuccessContainer";
import CartContainer from "../containers/CartContainer";
import CategoryDetailContainer from "../containers/CategoryDetailContainer";
import ChangePasswordContainer from "../containers/ChangePasswordContainer";
import CheckOutContainer from "../containers/CheckOutContainer";
import CMSContainer from "../containers/CMSContainer";
import ContactUsContainer from "../containers/ContactUsContainer";
import DetailedAddressListContainer from '../containers/DetailedAddressListContainer';
import EventBookContainer from "../containers/EventBookContainer";
import FAQsContainer from "../containers/FAQsContainer";
import FilterContainer from "../containers/FilterContainer";
import LoginContainer from "../containers/LoginContainer";
import MainContainer from "../containers/MainContainer";
import MyBookingContainer from "../containers/MyBookingContainer";
import MyOrderContainer from "../containers/MyOrderContainer";
import MyWalletContainer from "../containers/MyWalletContainer";
import NotificationList from "../containers/NotificationList";
import OrderConfirm from "../containers/OrderConfirm";
import OrderDetailContainer from "../containers/OrderDetailContainer";
import OTPVerification from "../containers/OTPVerification";
import PasswordRecoveryContainer from "../containers/PasswordRecoveryContainer";
import PaymentGatewayContainer from "../containers/PaymentGatewayContainer";
import PhoneNumberInput from "../containers/PhoneNumberInput";
import ProfileContainer from "../containers/ProfileContainer";
import PromoCode from "../containers/PromoCode";
import RecipeContainer from "../containers/RecipeContainer";
import RecipeDetail from "../containers/RecipeDetail";
import Restaurant from "../containers/Restaurant";
import ReviewsContainer from "../containers/ReviewsContainer";
import SavedCardsContainer from "../containers/SavedCardsContainer";
import SearchLocationContainer from "../containers/SearchLocationContainer";
import SignupContainer from "../containers/SignupContainer";
import SplashContainer from "../containers/SplashConainer";
import StripePaymentContainer from "../containers/StripePaymentContainer";
import TrackOrderContainer from "../containers/TrackOrderContainer";
import VacationContainer from "../containers/VacationContainer";
import LaundryContainer from "../containers/LaundryContainer";
import metrics from "../utils/metrics";
import SideBar from "./SideBar";
import BookingContainer from "../containers/BookingContainer";
import CarContainer from "../containers/CarHire";

const MAIN_NAVIGATOR = createStackNavigator(
    {
        MainContainer: {
            screen: MainContainer
        },
        searchLocation: {
            screen: SearchLocationContainer
        },
        RestaurantContainer: {
            screen: Restaurant
        },
        aboutStore: {
            screen: AboutStoreContainer
        },
        ReviewContainer: {
            screen: ReviewsContainer
        },
        RecipeDetail: {
            screen: RecipeDetail
        },
        ProfileContainer: {
            screen: ProfileContainer
        },
        ChangePasswordContainer: {
            screen: ChangePasswordContainer
        },
        Filter: {
            screen: FilterContainer
        },
        CartContainer: {
            screen: CartContainer
        },
        PromoCodeContainer: {
            screen: PromoCode
        },
        AddressListContainer: {
            screen: AddressListContainer
        },
        OTPVerificationFromAddressList: {
            screen: OTPVerification
        },
        AddressMapContainer: {
            screen: AddressMapContainer
        },
        DetailedAddressListContainer: {
            screen: DetailedAddressListContainer
        },
        PaymentGatewayContainer: {
            screen: PaymentGatewayContainer
        },
        CheckOutContainer: {
            screen: CheckOutContainer
        },
        OrderConfirm: {
            screen: OrderConfirm
        },
        SplashContainer: {
            screen: SplashContainer
        },
        LoginContainer: {
            screen: LoginContainer
        },
        CategoryDetailContainer: {
            screen: CategoryDetailContainer
        },

        
        savedCards: {
            screen: SavedCardsContainer
        },
        StripePaymentContainer: {
            screen: StripePaymentContainer
        },
    },
    {
        initialRouteName: "MainContainer",
        headerMode: "none"
    }
);

const RECIPE_NAVIGATOR = createStackNavigator(
    {
        RecipeContainer: {
            screen: RecipeContainer
        },
        CategoryFromRecipe: {
            screen: CategoryDetailContainer
        },
        FilterContainer: {
            screen: Restaurant
        },
        aboutStore: {
            screen: AboutStoreContainer
        },
        RecipeDetail: {
            screen: RecipeDetail
        },
        Filter: {
            screen: FilterContainer
        }
    },
    {
        initialRouteName: "RecipeContainer",
        headerMode: "none"
    }
);

const EVENT_NAVIGATOR = createStackNavigator(
    {
        EventContainer: {
            screen: BookingAvailabilityContainer
        },
        searchLocation: {
            screen: SearchLocationContainer
        },
       EventBookContainer : {
            screen: EventBookContainer
        },
        aboutStore: {
            screen: AboutStoreContainer
        },
        ReviewContainer: {
            screen: ReviewsContainer
        },
        BookingSuccess: {
            screen: BookingSuccessContainer
        }
    },
    {
        initialRouteName: "EventContainer",
        headerMode: "none"
    }
);

const MY_BOOKING_NAVIGATOR = createStackNavigator(
    {
        MyBookingContainer: {
            screen: MyBookingContainer
        },

        SplashContainer: {
            screen: SplashContainer
        }
    },
    {
        initialRouteName: "MyBookingContainer",
        headerMode: "none"
    }
);

const MY_ORDER_NAVIGATOR = createStackNavigator(
    {
        MyOrderContainer: {
            screen: MyOrderContainer
        },
        TrackOrderContainer: {
            screen: TrackOrderContainer
        },
        ProfileContainer: {
            screen: ProfileContainer
        },
        savedCards: {
            screen: SavedCardsContainer
        },
        AddressListContainer: {
            screen: AddressListContainer
        },
        OTPVerificationFromAddressList: {
            screen: OTPVerification
        },
        DetailedAddressListContainer: {
            screen: DetailedAddressListContainer
        },
        AddressMapContainer: {
            screen: AddressMapContainer
        },
        OrderDetailContainer: {
            screen: OrderDetailContainer
        },
        StripePaymentContainer: {
            screen: StripePaymentContainer
        },
        PaymentGatewayContainer: {
            screen: PaymentGatewayContainer
        },
        RestaurantContainer: {
            screen: Restaurant
        },
        aboutStore: {
            screen: AboutStoreContainer
        },
        CategoryDetailContainer: {
            screen: CategoryDetailContainer
        },
        CartContainer: {
            screen: CartContainer
        },
        CheckOutContainer: {
            screen: CheckOutContainer
        }

    },
    {
        initialRouteName: "MyOrderContainer",
        headerMode: "none"
    }
);


const NOTIFICATION_NAVIGATOR = createStackNavigator(
    {
        NotificationContainer: {
            screen: NotificationList
        }
    },
    {
        initialRouteName: "NotificationContainer",
        headerMode: "none"
    }
);



export const WALLET_NAVIGATOR = createStackNavigator({
    myWalletContainer: {
        screen: MyWalletContainer
    },
    savedCards: {
        screen: SavedCardsContainer
    },
    StripePaymentContainer: {
        screen: StripePaymentContainer
    },
}, {
    initialRouteName: "myWalletContainer",
    headerMode: "none"
})


export const HOME_SCREEN_DRAWER = createDrawerNavigator(
    {
        Home: {
            screen: MAIN_NAVIGATOR
        },
        Wallet: {
            screen: WALLET_NAVIGATOR
        },
        Recipe: {
            screen: RECIPE_NAVIGATOR
        },
        Vacation: {
            screen: VacationContainer
        },
        Laundry: {
            screen: LaundryContainer
        },
        Event: {
            screen: EVENT_NAVIGATOR
        },
        MyBooking: {
            screen: MY_BOOKING_NAVIGATOR
        },
        Notification: {
            screen: NOTIFICATION_NAVIGATOR
        },
        Order: {
            screen: MY_ORDER_NAVIGATOR
        },
        CMSContainer: {
            screen: CMSContainer
        },
        contactUs: {
            screen: ContactUsContainer
        },
        FAQs: {
            screen: FAQsContainer
        },
        Happening : {
            screen: BookingContainer
        },
        Car :{
            screen: CarContainer
        }

    },
    {
        initialRouteName: "Home",
        initialRouteParams: "Home",
        drawerLockMode: "locked-closed",
        drawerWidth: metrics.screenWidth * .66,
        contentComponent: props => <SideBar {...props} />
    }
);

export const HOME_SCREEN_RIGHT_DRAWER = createDrawerNavigator(
    {
        Home: {
            screen: MAIN_NAVIGATOR
        },
        Wallet: {
            screen: WALLET_NAVIGATOR
        },
        Recipe: {
            screen: RECIPE_NAVIGATOR
        },
        Vacation: {
            screen: VacationContainer
        },
        Laundry: {
            screen: LaundryContainer
        },
        Event: {
            screen: EVENT_NAVIGATOR
        },
        MyBooking: {
            screen: MY_BOOKING_NAVIGATOR
        },
        Notification: {
            screen: NOTIFICATION_NAVIGATOR
        },
        Order: {
            screen: MY_ORDER_NAVIGATOR
        },
        CMSContainer: {
            screen: CMSContainer
        },
        contactUs: {
            screen: ContactUsContainer
        },
        FAQs: {
            screen: FAQsContainer
        }
    },
    {
        initialRouteName: "Home",
        initialRouteParams: "Home",
        drawerLockMode: "locked-closed",
        drawerPosition: 'right',
        drawerWidth: metrics.screenWidth * .66,
        contentComponent: props => <SideBar {...props} />
    }
);

export const BASE_STACK_NAVIGATOR = createStackNavigator(
    {

        SplashContainer: {
            screen: SplashContainer
        },
        LoginContainer: {
            screen: LoginContainer
        },
        SignupContainer: {
            screen: SignupContainer
        },
        CMSFromRegister: {
            screen: CMSContainer
        },
        CMSContainer: {
            screen: CMSContainer
        },
        contactUs: {
            screen: ContactUsContainer
        },
        MainContainer: {
            screen: HOME_SCREEN_DRAWER
        },
        MainContainer_Right: {
            screen: HOME_SCREEN_RIGHT_DRAWER
        },
        MY_ORDER_NAVIGATOR: {
            screen: MyOrderContainer
        },
        PhoneNumberInput: {
            screen: PhoneNumberInput
        },
        OTPVerification: {
            screen: OTPVerification
        },
        PasswordRecovery: {
            screen: PasswordRecoveryContainer
        }
    },
    {
        initialRouteName: "SplashContainer",
        headerMode: "none"
    }
);

export const BASE_NAVIGATOR = createAppContainer(withNavigation(BASE_STACK_NAVIGATOR));