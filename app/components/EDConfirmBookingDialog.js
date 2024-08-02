/* eslint-disable prettier/prettier */
import React from 'react'
import { StyleSheet, Text, View , Image } from 'react-native'
import { Icon } from 'react-native-elements'
import EDRTLView from '../components/EDRTLView'
import { strings } from '../locales/i18n'
import { EDColors } from '../utils/EDColors'
import {getProportionalFontSize } from '../utils/EDConstants'
import { EDFonts } from '../utils/EDFontConstants'
import metrics from '../utils/metrics'
import EDThemeButton from './EDThemeButton'
import EDText from './EDText';
import Assets from '../assets';
import { SvgXml } from 'react-native-svg';
import { background_icon, calendar_icon, clock_square } from "../utils/EDSvgIcons";

export default class EDConfirmBookingDialog extends React.Component {
    render() {
        return (

        <View
            style={styles.mainView}>
        <View style={[styles.viewStyle]}>
            <EDRTLView style={styles.centerView}>  
                    <View>
                        <SvgXml xml={ this.props.isPositive ? background_icon : clock_square  } />
                    </View>
                { this.props.isPositive ? 
                    <View style={styles.iconStyle}>
                    <Icon
                        name= {"calendar"}  type = {'ant-design'}
                        color={EDColors.black}
                        // style={styles.iconStyle}
                        size={getProportionalFontSize(35)}/> 
                    </View>
                    :null}
            </EDRTLView>
            <EDText
            style={styles.text}
            numberOfLines={3}
             textStyle={styles.textStyle}  
                title={[this.props.text ]}
            />
            <EDRTLView >
                {this.props.isPositive ? (
                    <EDThemeButton
                        label={strings("dialogRequest")}
                        style={styles.pasitiveButton}
                        onPress={this.props.onConfirmPressedHandler}
                        textStyle={styles.btnText}
                    />
                ) : null}
                <EDThemeButton
                    label={strings("dialogCancel")}
                    style={ this.props.isPositive ? styles.pasitiveCancelButton : styles.themeButton}
                    onPress={this.props.onCancelPressedHandler}
                    textStyle={[styles.btnCancelText, { color :  this.props.isPositive ? EDColors.black : EDColors.white }]}
                />
            </EDRTLView>
        </View>
    </View>
        )
    }
}


const styles = StyleSheet.create({
    textStyle: {
        color: EDColors.black,
        fontSize: getProportionalFontSize(16),
        fontFamily: EDFonts.semiBold ,
        textAlign: 'center',
        marginTop: 10,
        marginHorizontal:35
        
    },
    iconStyle:{ position:'absolute'},
    centerView:{justifyContent:'center' , alignItems:'center'},
    text:{  marginHorizontal: 0, marginTop: 0,},
    btnCancelText:{  fontFamily: EDFonts.medium , fontSize : getProportionalFontSize(16) },
    btnText:{fontFamily: EDFonts.medium , fontSize : getProportionalFontSize(16) },
    viewStyle: { height : metrics.screenHeight * 0.33 ,backgroundColor: EDColors.white, margin: 20, borderRadius: 24, alignItems: "center" , justifyContent :'space-evenly' },
    mainView: { color: EDColors.primary, fontFamily: EDFonts.bold },
    themeButton: { width: metrics.screenWidth * 0.80 , borderRadius : 16 , backgroundColor : EDColors.primary , height : metrics.screenHeight * 0.075 , marginTop:5}
   , pasitiveButton: { marginHorizontal: 5, width: metrics.screenWidth * 0.4, borderRadius : 16,height : metrics.screenHeight * 0.075  ,  backgroundColor : EDColors.primary}
    , pasitiveCancelButton: { marginHorizontal: 5, width: metrics.screenWidth * 0.4, borderRadius : 16,height : metrics.screenHeight * 0.075  ,  backgroundColor : EDColors.offWhite}
})
// END VIKRANT

// const styles = StyleSheet.create({
//     textStyle: {
//         color: EDColors.black,
//         fontSize: getProportionalFontSize(22),
//         fontFamily: EDFonts.regular,
//         textAlign: 'center',
//         marginLeft: 10
//     },
//     viewStyle: { backgroundColor: EDColors.white, margin: 20, borderRadius: 10, alignItems: "center" },
//     mainView: { color: EDColors.primary, fontFamily: EDFonts.bold },
//     themeButton: { margin: 10, width: metrics.screenWidth * 0.3 }
// })