import React from 'react';
import { Text } from 'react-native';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { CARD_BRANDS, debugLog, getProportionalFontSize } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';

export const EDCardComponent = (props) => {

    const cardObj = props.data.card
    const isDefaultCard = props.data.is_default_card == "1"

    const onCardPress = () => {
        props.onCardPress(props.data)
    }

    const deleteCard = () => {
        props.deleteCard(props.data)
    }

    const editCard = () => {
        props.editCard(props.data)
    }

    return (
        <TouchableOpacity onPress={onCardPress} activeOpacity={1}>
            <View style={isDefaultCard ? {
                marginVertical: 10,
                borderBottomColor: EDColors.separatorColorNew,
                borderBottomWidth: 1,
                paddingBottom: 10
            } : {}}>
                <EDRTLView style={[styles.cardView,
                isDefaultCard ? {} : {
                    marginVertical: 10,
                    borderBottomColor: EDColors.separatorColorNew,
                    borderBottomWidth: 1,
                    paddingBottom: 20
                }
                    , props.cardViewStyle, (props.selectedCard == cardObj.fingerprint) ? {} : {}]}>
                    <EDRTLView style={styles.cardSubView}>
                        <Icon
                            name={cardObj.brand == CARD_BRANDS.visa ? "cc-visa" :
                                cardObj.brand == CARD_BRANDS.mastercard ? "cc-mastercard" :
                                    cardObj.brand == CARD_BRANDS.amex ? "cc-amex" : "credit-card"
                            }
                            color={cardObj.brand == CARD_BRANDS.visa ? EDColors.visa :
                                cardObj.brand == CARD_BRANDS.mastercard ? EDColors.mastercard :
                                    cardObj.brand == CARD_BRANDS.amex ? EDColors.amex : EDColors.primary
                            }
                            size={25}
                            type="font-awesome"
                        />
                        <View style={{ marginHorizontal: 20, flex: 1 }}>
                            <EDRTLView style={{ alignItems: 'center' }}>
                                <Text style={[{ color: EDColors.black, },props.selectedCard == cardObj.fingerprint ? {color : EDColors.primary} : {}]}>•••• </Text>
                                <EDRTLText title={cardObj.last4} style={[styles.last4Text, props.selectedCard == cardObj.fingerprint ? { fontFamily: EDFonts.bold , color : EDColors.primary} : {}]} />
                            </EDRTLView>
                            {(new Date().setFullYear(cardObj.exp_year, cardObj.exp_month, 1) < new Date()) ?
                                <EDRTLText title={strings("expired")} style={styles.expiredText} /> : null}
                        </View>
                        {!props.isForListing ?
                            <Icon onPress={editCard} name={"edit"} type={"entypo"} color={EDColors.black} size={16} containerStyle={{ height: 38, width: 38, borderRadius: 19, backgroundColor: EDColors.radioSelected, alignItems: 'center', justifyContent: "center", marginHorizontal: 10 }} /> : null
                        }
                        {!props.isForListing ?
                            <Icon onPress={deleteCard} name={"delete"} type={"ant-design"} color={EDColors.black} size={16} containerStyle={{ height: 38, width: 38, borderRadius: 19, backgroundColor: EDColors.radioSelected, alignItems: 'center', justifyContent: "center" }} /> : null
                        }
                        {/* {props.selectedCard == cardObj.fingerprint ?
                            <Icon name={"done"} color={EDColors.grayNew} size={25} containerStyle={{ marginHorizontal: 10 }} /> : null
                        } */}
                    </EDRTLView>
                </EDRTLView>

                {isDefaultCard ?
                    <EDRTLText title={strings("defaultCard")} style={styles.defaultCard} /> : null
                }
            </View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    cardView: {
        alignItems: "center",
        justifyContent: "space-between",
        flex: 1,

    },
    cardSubView: {
        alignItems: "center",
        flex: 1,

    },
    last4Text: {
        fontFamily: EDFonts.medium,
        fontSize: getProportionalFontSize(14),
        color: EDColors.black
    },
    expiredText: {
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(13),
        color: EDColors.mastercard
    },
    defaultCard: {
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(13),
        color: EDColors.primary,
        marginTop: 5
    }
})