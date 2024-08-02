import React from 'react';
import { FlatList } from 'react-native';
import { StyleSheet } from 'react-native';
import { View } from 'react-native';
import { Icon } from 'react-native-elements';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';

export const EDOperationHours = props => {
    let operating_hours = []
    if (props.hours !== undefined && props.hours !== null)
        operating_hours = Object.entries(props.hours)
    return (
        <View style={styles.mainContainer}>
            <EDRTLView style={{ justifyContent: "space-between", alignItems: 'center', paddingBottom: 5, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: EDColors.separatorColor }}>
                <Icon name={"close"} color={EDColors.transparent} size={24} />
                <EDRTLText title={strings("ourTimings")} style={styles.titleText} />
                <Icon name={"close"} color={EDColors.primary} size={24} onPress={props.onDismiss} />
            </EDRTLView>
            <EDRTLView style={{ justifyContent: "space-between", alignItems: 'center', marginVertical: 5 }}>
                <EDRTLText title={strings("day")} style={styles.header} />
                <EDRTLText title={strings("opening")} style={styles.header} />
                <EDRTLText title={strings("closing")} style={styles.header} />
            </EDRTLView>
            <FlatList data={operating_hours}
                renderItem={({ item, index }) => {
                    return (<EDRTLView style={{ justifyContent: "space-between", alignItems: 'center', marginVertical: 5 }}>
                        <EDRTLText title={item[1].label} style={styles.day} />
                        {item[1].off.toString() == "1" ?
                            <>
                                <EDRTLText title={item[1].open} style={styles.day} />
                                <EDRTLText title={item[1].close} style={styles.day} />
                            </>
                            :
                            <EDRTLText title={strings("closeForDay")} style={[styles.day, { flex: 2, }]} />
                        }
                    </EDRTLView>)
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: EDColors.white,
        borderRadius: 16,
        margin: 20,
        maxHeight: "80%",
        padding: 10
    },
    titleText: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(18),
        flex: 1,
        textAlign: "center",
        color: EDColors.black
    },
    header: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(16),
        flex: 1,
        textAlign: "center",
        color: EDColors.black,
        textDecorationLine: "underline"
    },
    day: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(16),
        flex: 1,
        textAlign: "center",
        color: EDColors.black,
    }
})