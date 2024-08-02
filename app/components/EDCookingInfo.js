import React from 'react';
import { useState } from 'react';
import { Platform, ScrollView, TouchableOpacity } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { getProportionalFontSize, TextFieldTypes } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import Validations from '../utils/Validations';
import EDRTLText from './EDRTLText';
import EDRTLTextInput from './EDRTLTextInput';
import EDRTLView from './EDRTLView';
import EDThemeButton from './EDThemeButton';

export const EDCookingInfo = (props) => {

    const [instruction, setInstruction] = useState(props.comment || '')
    const [shouldPerformValidation, setValidation] = useState(false)
    const validationsHelper = new Validations()


    const textFieldTextDidChangeHandler = text => {
        setInstruction(text)
        setValidation(false)
    }

    const validateComment = () => {
        setValidation(true)
        if (instruction.trim().length == 0) {
            return;
        }
        else {
            props.saveComment(instruction)
        }

    }

    return (
        <View
            style={
                Platform.OS == "ios" ?
                    {
                        justifyContent: "flex-end"
                    }
                    :
                    {

                        flex: 1,
                        // paddingBottom: initialWindowMetrics.insets.bottom + 40
                        justifyContent: "flex-end"
                    }}>
            <TouchableOpacity onPress={props.hideCookingInfo} style={{ flex: 1 }} />
            <View style={style.cookingModal}>
                <EDRTLView style={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    // flex: 1,
                }}>
                    <EDRTLText
                        title={strings("addCookingInstruction")}
                        style={style.title}
                    />
                    <Icon name={"close"} size={24} color={EDColors.primary} onPress={props.hideCookingInfo} />
                </EDRTLView>
                <View style={style.separatorStyle} />
                <EDRTLTextInput
                    icon="location-pin"
                    textstyle={{ color: EDColors.black, fontSize: getProportionalFontSize(16), }}
                    defaultValue={instruction}
                    initialValue={instruction}
                    identifier={'strAddress1'}
                    customIcon={"edit-3"}
                    customIconFamily={'feather'}
                    customIconColor={EDColors.black}
                    focusOnPress={true}
                    type={TextFieldTypes.default}
                    placeholder={null}
                    autoFocus={true}
                    onSubmitEditingHandler={validateComment}
                    onChangeText={textFieldTextDidChangeHandler}
                    errorFromScreen={
                        shouldPerformValidation
                            ? validationsHelper.checkForEmpty(
                                instruction,
                                strings('requiredField'),
                            )
                            : ''
                    }
                />
                <EDThemeButton label={strings("save")} onPress={validateComment} />

            </View>
        </View>
    )
}

const style = StyleSheet.create({
    cookingModal: {
        backgroundColor: EDColors.white,
        padding: 10,
        paddingBottom: Platform.OS == "ios" ? initialWindowMetrics.insets.bottom + 10 : 10,
    },
    title: {
        fontFamily: EDFonts.semiBold,
        color: EDColors.black,
        fontSize: getProportionalFontSize(16)
    },
    separatorStyle: {
        height: 1,
        backgroundColor: EDColors.separatorColorNew,
        marginVertical: 10
    },
})