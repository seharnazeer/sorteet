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

class EDCashTrfComponent extends Component {
    state = {
        description: 'wallet funding',
        transactionId: '',
        amount: '',
        selectedBank: 'Sterling Bank (0038450881)',
        options: ["15,000", "30,000", "50,000", "100,000"], // Static amount options
    };

    handleAmountSelection = (selectedAmount) => {

        this.setState({ amount: selectedAmount });
    };


    render() {
        const { amount, options, transactionId, selectedBank, description } = this.state;

        return (
            <View style={styles.container}>

                <EDRTLView style={styles.shareView}>
                    <Text style={[styles.shareText]}>
                        {"Bank Transfer"}
                    </Text>
                    {this.props.isClose ?
                        <Icon name={"close"} size={getProportionalFontSize(18)} onPress={this.props.closeEarningModal} color={EDColors.text} />
                        : null}
                </EDRTLView>
                <View style={styles.break} />

                <Text style={styles.shareText}>Select Bank:</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        style={styles.picker}
                        selectedValue={this.state.selectedBank}
                        onValueChange={(itemValue) => this.setState({ selectedBank: itemValue })}
                    >
                        <Picker.Item label="Sterling Bank (0038450881)" value="Sterling Bank (0038450881)" />
                        {/* <Picker.Item label="Gtbank (0262722741)" value="Gtbank (0262722741)" />
                        <Picker.Item label="Moniepoint MFB (8204467004)" value="Moniepoint MFB (8204467004)" /> */}
                    </Picker>
                    <Icon name="arrow-drop-down-circle" type={'material'} color={EDColors.black} size={getProportionalFontSize(18)} style={styles.pickerIcon} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                    {options.map((option, index) => (

                        <TouchableOpacity
                            key={index}
                            onPress={() => this.handleAmountSelection(option)}
                            style={{ backgroundColor: EDColors.black, borderRadius: 16, elevation: 8, shadowOpacity: 0.5 }}
                        >
                            <EDRTLText title={option} style={[styles.normalText]} />
                        </TouchableOpacity>

                    ))}
                </View>

                <Text style={styles.shareText}>Amount:</Text>
                <TextInput
                    style={[styles.textInput, styles.inputText]}
                    onChangeText={(text) => { this.setState({ amount: text }) }}
                    value={amount}
                    keyboardType='number-pad'
                />

                <Text style={styles.shareText}>Transaction Id:</Text>
                <TextInput
                    style={[styles.textInput, styles.inputText]}
                    onChangeText={(text) => this.setState({ transactionId: text })}
                    value={this.state.transactionId}
                />


                <Text style={styles.shareText}>Description:</Text>
                <TextInput
                    style={[styles.textInput, styles.inputText]}
                    onChangeText={(text) => this.setState({ description: text })}
                    value={this.state.description}
                    editable={false}
                />

                <TouchableOpacity onPress={() => {
                    const formattedAmount = amount.split(",").join(""); // Remove commas from the amount
                    console.log("Formatted Amount:", formattedAmount);
                    this.props.handleCashTransferPress(
                        selectedBank,
                        formattedAmount,
                        transactionId,
                        description
                    );
                }} style={[styles.shareBtn]} >
                    <EDRTLView style={styles.btnView} >
                        <Icon name="bank-transfer-in" type={'material-community'} color={EDColors.white} size={getProportionalFontSize(24)} />
                        <EDRTLText title={strings("cashTrf")} style={[styles.normalText]} />
                    </EDRTLView>
                </TouchableOpacity>
            </View>
        );
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
        fontFamily: EDFonts.medium,
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
        flex: 1,
        height: 45,
        padding: 10,
        backgroundColor: 'white',
    },
    pickerIcon: {
        marginRight: 10,
    },
    normalText: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(14),
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
    shareText: { fontSize: getProportionalFontSize(16), color: EDColors.black, fontFamily: EDFonts.semiBold },
    shareView: { justifyContent: "space-between", width: "100%", paddingHorizontal: 5, paddingVertical: getProportionalFontSize(12) },
};

export default EDCashTrfComponent;
