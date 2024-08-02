import React, { useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { useSelector } from 'react-redux';
import { strings } from '../locales/i18n';
import { showValidationAlert } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { getProportionalFontSize, TextFieldTypes } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import Validations from '../utils/Validations';
import EDButton from './EDButton';
import EDRTLText from './EDRTLText';
import EDRTLTextInput from './EDRTLTextInput';
import EDRTLView from './EDRTLView';

export const EDReportError = (props) => {
    const userData = useSelector(state => state.userOperations)
    const userID = userData.userIdInRedux


    const [reportedTopics, setTopics] = useState([])
    const [strEmail, setEmail] = useState(userID !== undefined && userID !== null && userID !== "" &&
        userData.email !== undefined &&
        userData.email !== null
        ? userData.email : "")
    const [strMessage, setMessage] = useState("")
    const [shouldPerformValidation, setValidation] = useState(false)

    const validationsHelper = new Validations()

    const textFieldTextDidChangeHandler = (value, identifier) => {
        setValidation(false)
        if (identifier == "strEmail")
            setEmail(value)
        else
            setMessage(value)
    }

    const arrayReportTopics = [
        { error_slug: "phone_number", error_title: strings("phoneNumber") },
        { error_slug: "address", error_title: strings("addressTitle") },
        { error_slug: "menu", error_title: strings("homeMore") },
        { error_slug: "other", error_title: strings("otherReason") }

    ]


    const updateError = (error_slug) => {
        let topicsToReport = reportedTopics
        if (reportedTopics.includes(error_slug)) {
            topicsToReport = topicsToReport.filter(data => data !== error_slug)
            setTopics(topicsToReport)
        }
        else {
            setTopics([...topicsToReport, error_slug])
        }
    }

    const onSubmit = () => {
        // if (reportedTopics.length == 0) {
        //     showValidationAlert(strings("noError"))
        //     return;
        // }
        setValidation(true)
        if (validationsHelper
            .validateEmail(
                strEmail,
                strings("emptyEmail")
            )
            .trim() == "" &&
            validationsHelper
                .checkForEmpty(
                    strMessage,
                    strings("msgError")
                )
                .trim() == "")
            props.onSubmit(reportedTopics, strEmail, strMessage)
    }


    const renderErrors = (data) => {
        return (
            <TouchableOpacity onPress={() => updateError(data.item.error_slug)}>
                <EDRTLView style={{ alignItems: 'center', marginVertical: 2.5 }}>
                    <Icon
                        color={EDColors.primary}
                        size={getProportionalFontSize(22)}
                        name={reportedTopics.includes(data.item.error_slug) ? "check-box" : "check-box-outline-blank"}
                    />
                    <EDRTLText title={data.item.error_title} style={styles.errorTitle} />
                </EDRTLView>
            </TouchableOpacity>
        )
    }

    return (
        <View style={styles.container}>
            <EDRTLView style={styles.rtlView}>
                <EDRTLText title={strings("reportError")} style={styles.reportTitle} />
                <Icon name={"close"} size={getProportionalFontSize(23)}
                    onPress={props.onDismiss}
                    color={EDColors.primary}
                />
            </EDRTLView>
            <EDRTLText title={strings("reportMessage")} style={styles.reportMessage} />
            <EDRTLText title={strings("whatsWrong")} style={styles.whatsWrong} />
            <FlatList
                data={arrayReportTopics}
                extraData={reportedTopics}
                renderItem={renderErrors}
                keyExtractor={item => item.error_slug}
            />
            <EDRTLTextInput
                icon="email"
                textstyle={{ color: EDColors.black }}
                type={TextFieldTypes.email}
                identifier={'strEmail'}
                placeholder={strings('email')}
                onChangeText={textFieldTextDidChangeHandler}
                initialValue={strEmail}
                errorFromScreen={
                    shouldPerformValidation
                        ? validationsHelper.validateEmail(
                            strEmail,
                            strings("emptyEmail")
                        )
                        : ''
                }
            />

            <EDRTLTextInput
                textstyle={{ color: EDColors.black }}
                type={TextFieldTypes.default}
                identifier={'strMessage'}
                placeholder={strings('msg')}
                onChangeText={textFieldTextDidChangeHandler}
                initialValue={strMessage}
                errorFromScreen={
                    shouldPerformValidation
                        ? validationsHelper.checkForEmpty(
                            strMessage,
                            strings("msgError")
                        )
                        : ''
                }
            />
            <EDButton label={strings("submitButton")} onPress={onSubmit} style={{ marginTop: 10 }} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: EDColors.offWhite,
        borderRadius: 8,
        padding: 10,
        margin: 15,
    },
    rtlView: {
        justifyContent: "space-between",
        alignItems: 'center',
        paddingBottom: 5,
        marginBottom: 5,
        borderBottomColor: EDColors.separatorColorNew,
        borderBottomWidth: 1
    },
    reportTitle: {
        fontFamily: EDFonts.semiBold,
        color: EDColors.primary,
        flex: 2,
        textAlign: "center",
        fontSize: getProportionalFontSize(17)
    },
    reportMessage: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(13),
        color: EDColors.black,
    },
    whatsWrong: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(15),
        color: EDColors.black,
        marginTop: 10
    },
    errorTitle: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(13),
        marginHorizontal: 5,
        color: EDColors.black,
    }
})