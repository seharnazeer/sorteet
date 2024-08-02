import React, { Component } from 'react';
import { View, Text, TextInput, TouchableOpacity, Picker } from 'react-native';
import { EDColors } from '../utils/EDColors'
import { EDFonts } from '../utils/EDFontConstants'
import { Icon } from 'react-native-elements'
import metrics from '../utils/metrics'
import { getProportionalFontSize } from '../utils/EDConstants';
import EDRTLView from './EDRTLView';
import EDRTLText from './EDRTLText'
import { strings } from '../locales/i18n'

class MyComponent extends Component {
    state = {
        selectedPaymentMethod: null
    };

    handlePaymentMethodSelection = (paymentMethod) => {
        this.setState({ selectedPaymentMethod: paymentMethod });
    }

    handleProceed = () => {
        // Proceed button logic
        console.log("Proceed button pressed!");
    }

    render() {
        return (
            <View style={styles.container}>

                <EDRTLView style={styles.shareView}>
                    <Text style={[styles.shareText]}>
                        {this.props.popUpTitle}
                    </Text>
                    {this.props.isClose ?
                        <Icon name={"close"} size={getProportionalFontSize(18)} onPress={this.props.closeEarningModal} color={EDColors.text} />
                        : null}
                </EDRTLView>
                <View style={styles.break} />

                
                <TouchableOpacity onPress={this.props.cardPaymentPress} style={[styles.shareBtn2]} >
                    <EDRTLView style={styles.btnView} >
                        <Icon name="credit-card" type={'evilicon'} color={EDColors.white} size={getProportionalFontSize(24)} />
                        <EDRTLText title={this.props.btnCardPayTitle} style={[styles.normalText]} />
                    </EDRTLView>
                </TouchableOpacity>

                <TouchableOpacity onPress={this.props.cashTrfPress} style={[styles.shareBtn2]} >
                    <EDRTLView style={styles.btnView} >
                        <Icon name="bank-transfer-in" type={'material-community'} color={EDColors.white} size={getProportionalFontSize(24)} />
                        <EDRTLText title={this.props.btnOtherTitle} style={[styles.normalText]} />
                    </EDRTLView>
                </TouchableOpacity>
            </View>
        );
    }

    handleCashTransfer = () => {
        // Perform cash transfer logic here
        console.log('Performing cash transfer...');
    }
}

const styles = {
    container: {
        backgroundColor: EDColors.white,
        borderRadius: 24,
        width: metrics.screenWidth * .9,
        alignSelf: "center",
        padding: 10,
    },
    textInput: {
        height: 45,
        borderWidth: 1,
        borderColor: 'gray',
        padding: 10,
        marginBottom: 10,
        borderRadius: 4,
    },

    inputText: {
        fontSize: 16,
        fontFamily:EDFonts.medium,
        color: EDColors.black,
      },

    pickerContainer: {
        borderWidth: 1,
        borderColor: 'gray',
        marginBottom: 10,
        borderRadius: 4,
        
        flexDirection: 'row',
        alignItems: 'center',
    },
    picker: {
        flex:1,
        height: 45,
        padding: 10,
        backgroundColor: 'white',
    },
    pickerIcon: {
        marginRight: 10,
      },
    normalText: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(16),
        textAlign: "center",
        color: EDColors.white,
        margin: 5
    },
    break: {
        height: 1,
        backgroundColor: "#F6F6F6",
        marginVertical: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 15
    },

    btnView: { alignItems: 'center' },
    shareBtn: { backgroundColor: EDColors.primary, alignSelf: "center", paddingVertical: 10, width: '90%', borderRadius: 16, marginVertical: 12, justifyContent: 'center', alignItems: 'center' },
    shareBtn2: { backgroundColor: EDColors.primary, alignSelf: "center", paddingVertical: 10, width: '70%', borderRadius: 16, marginVertical: 12, justifyContent: 'center', alignItems: 'center' },
    shareText: { fontSize: getProportionalFontSize(16), color: EDColors.black, fontFamily: EDFonts.semiBold },
    shareView: { justifyContent: "space-between", width: "100%", paddingHorizontal: 5, paddingVertical: getProportionalFontSize(12) },
};

export default MyComponent;
