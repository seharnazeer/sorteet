
import React from 'react';
import { BackHandler, Image, StyleSheet, Text, View } from 'react-native';
import Assets from '../assets';
import EDThemeButton from '../components/EDThemeButton';
import { strings } from '../locales/i18n';
import { getUserToken } from '../utils/AsyncStorageHelper';
import { getProportionalFontSize, isRTLCheck } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import BaseContainer from './BaseContainer';
import Icon from 'react-native-vector-icons/FontAwesome'
import { EDColors } from "../utils/EDColors";
import metrics from '../utils/metrics';

export default class BookingSuccessContainer extends React.Component {
    //#region LIFE CYCLE METHODS

    /**CONSTRUCTOR */
    constructor(props) {
        super(props);
        this.state = {};
        this.handleBackButtonClick = this.handleBackButtonClick.bind(this);
    }

    /** DID MOUNT */
    componentDidMount() {
        this.checkUser();
    }

    /** WILL MOUNT */
    componentWillMount() {
        BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    /** WILL UNMOUNT */
    componentWillUnmount() {
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    }

    // RENDER METHOD
    render() {
        return (
            <BaseContainer
                title={strings('orderConfirm')}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={this._onLeftPressed}
            >
                {/* 
                <View style={{ flex: 1 }}>
                    <Image source={Assets.confirm_background} style={{ flex: 1, width: '100%' }} />

                    <View style={style.container}>
                        <View style={style.subContainer}>
                            <View style={style.outerView}>
                                <View style={style.midView}>
                                    <View style={style.innerView}>
                                        <Icon name={'thumbs-up'} color={EDColors.white} size={getProportionalFontSize(50)} style={{ alignSelf: "center" }} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={style.viewStyle}>
                            <Text style={style.thankyouText}>
                                {' '}{strings('event.success')}{' '}
                            </Text>

                            <View style={{ marginTop: 20 }}>
                                <EDThemeButton label={strings('event.viewBooking')} onPress={this._onLeftPressed} />
                            </View>
                        </View> 
                    </View>
                </View>*/}

                {/* MAIN VIEW */}
                <View style={style.mainView}>
                    <View style={style.subView} >

                        <Image source={Assets.confirmation} 
                        style={style.imageStyle} 
                        />
                        {/* <View style={style.viewStyle}> */}
                                <Text style={style.thankyouText}>
                                    {' '}{strings('bookingSuccess')}{' '}
                                </Text>

                        {/* </View> */}
                        </View>
                    <View style={style.container}>
                        <View style={style.btnView}>
                                <EDThemeButton label={strings('viewBooking')} 
                                    textStyle={style.btnText}
                                    style={style.btnStyle}
                                    onPress={this._onLeftPressed} />
                            </View>
                    </View>
                </View>
            </BaseContainer>
        )
    }
    //#endregion

    /** BACK PRESS HANDLER */
    handleBackButtonClick() {
        this.props.navigation.popToTop();
        this.props.navigation.navigate('MyBooking');
        return true;
    }

    /** ON BACK PRESSED */
    _onLeftPressed = () => {
        this.props.navigation.popToTop();
        this.props.navigation.navigate('MyBooking');
    };

    /** CHECK USER DETAILS */
    checkUser() {
        getUserToken(
            success => {
                userObj = success;
                // this.loadData(success);
            },
            failure => { }
        );
    }

    /** HANDLE INDEX CHANGE */
	/**
     * @param { Index Number Selected } index
     */
    handleIndexChange = index => {
        this.setState({
            selectedIndex: index,
        });
    };
}

export const style = StyleSheet.create({
    container: {
        flex: 1,
       justifyContent:'flex-end'
        // position: 'absolute',
        // width: '100%',
        // height: '100%',
    },
    subView:{ flex:5 , justifyContent:'center' , alignItems:'center'},
    imageStyle:{ alignSelf:'center' },
    thankyouText: {
        fontFamily: EDFonts.semiBold,
        fontSize:getProportionalFontSize(16),
        color: '#000',
        marginTop: 25,
    },
    subContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    mainView:{ flex: 1 },
    btnView:{ marginBottom:15 },
    btnText:{ fontFamily: EDFonts.medium , fontSize: getProportionalFontSize(16) },
    btnStyle:{width: ' 90%' , height: metrics.screenHeight * 0.075 , borderRadius: 16 },
    viewStyle: { flex: 1, marginTop: 10, alignItems: 'center' },
    outerView: { backgroundColor: '#fcedc7', borderRadius: 100, width: 160, height: 160, alignSelf: "center", justifyContent: 'center' },
    midView: { backgroundColor: '#fccf64', borderRadius: 100, width: 130, height: 130, alignSelf: "center", justifyContent: 'center' },
    innerView: { backgroundColor: EDColors.primary, borderRadius: 100, width: 100, height: 100, alignSelf: "center", justifyContent: 'center' }
});


// export const style = StyleSheet.create({
//     container: {
//         flex: 1,
//         position: 'absolute',
//         width: '100%',
//         height: '100%',
//     },
//     thankyouText: {
//         fontFamily: EDFonts.satisfy,
//         fontSize: 20,
//         color: '#000',
//         marginTop: 20,
//     },
//     subContainer: {
//         flex: 1,
//         justifyContent: 'flex-end',
//     },
//     viewStyle: { flex: 1, marginTop: 10, alignItems: 'center' },
//     outerView: { backgroundColor: '#fcedc7', borderRadius: 100, width: 160, height: 160, alignSelf: "center", justifyContent: 'center' },
//     midView: { backgroundColor: '#fccf64', borderRadius: 100, width: 130, height: 130, alignSelf: "center", justifyContent: 'center' },
//     innerView: { backgroundColor: EDColors.primary, borderRadius: 100, width: 100, height: 100, alignSelf: "center", justifyContent: 'center' }
// });

