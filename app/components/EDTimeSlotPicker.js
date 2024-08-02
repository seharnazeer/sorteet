import React, { createRef, useEffect, useState } from 'react';
import { FlatList } from 'react-native';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import EDButton from './EDButton';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';

export const EDTimeSlotPicker = (props) => {

    const flatListRef = createRef()
    const [index, setIndex] = useState(0)
    const [selectedTime, setSelectedTime] = useState(props.selectedTime)

    useEffect(() => {
        setTimeout(() => {
            if (flatListRef.current !== undefined && flatListRef.current !== null) {
                flatListRef.current.scrollToIndex({ animated: true, index: index, viewPosition: 0.5 })
            }
        }, 500)
    })

    const updateTime = (item, index) => {
        setIndex(index)
        setSelectedTime(item.start)
        if (flatListRef.current !== undefined && flatListRef.current !== null) {
            flatListRef.current.scrollToIndex({ animated: true, index: index, viewPosition: 0.5 })
        }
    }

    const onTimePicked = () => {
        props.onTimePicked(props.arrSlot[index])
    }

    const renderSlots = ({ item, index }) => {
        if (selectedTime == item.start)
            setIndex(index)
        return (
            <EDRTLText title={item.start + " - " + item.end} style={[styles.slotText, {
                color: selectedTime == item.start ? EDColors.primary : EDColors.black,
                fontFamily: selectedTime == item.start ? EDFonts.semiBold : EDFonts.regular,
            }]}
                onPress={() => updateTime(item, index)}
            />
        )
    }


    return (
        <View style={styles.container}>
            <EDRTLView style={styles.rtlView}>
                <Icon name={"close"} size={getProportionalFontSize(24)}
                    color={EDColors.transparent}
                />
                <EDRTLText title={strings("selectTime")} style={styles.slotTitle} />
                <Icon name={"close"} size={getProportionalFontSize(23)}
                    onPress={props.onDismiss}
                    color={EDColors.primary}
                />
            </EDRTLView>
            <FlatList
                showsVerticalScrollIndicator={false}
                style={{ margin: 10 }}
                ref={flatListRef}
                data={props.arrSlot}
                renderItem={renderSlots}
                ItemSeparatorComponent={() => { return <View style={{ marginVertical: 2.5, height: 1, backgroundColor: EDColors.separatorColorNew }} /> }}
            />
            <EDButton label={strings("dialogConfirm")} onPress={onTimePicked} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: EDColors.offWhite,
        borderRadius: 16,
        padding: 10,
        margin: 20,
        maxHeight: "50%"
    },
    rtlView: {
        justifyContent: "space-between",
        alignItems: 'center',
        paddingBottom: 5,
        marginBottom: 5,
        borderBottomColor: EDColors.separatorColorNew,
        borderBottomWidth: 1
    },
    slotTitle: {
        fontFamily: EDFonts.semiBold,
        color: EDColors.primary,
        flex: 2,
        textAlign: "center",
        fontSize: getProportionalFontSize(17)
    },
  
    slotText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(15),
        marginHorizontal: 5,
        color: EDColors.black,
        textAlign: "center",
        marginVertical: 5
    }
})