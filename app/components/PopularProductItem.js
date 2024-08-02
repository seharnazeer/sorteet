/* eslint-disable prettier/prettier */
import React from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import Metrics from '../utils/metrics';
import EDRTLText from './EDRTLText';
import ImageGrid from './ImageGrid';

const NUMBER_OF_COLUMNS = 3;
const PARENT_WIDTH = (Metrics.screenWidth - 30) / NUMBER_OF_COLUMNS;
const IMAGE_WIDTH = PARENT_WIDTH - 12;
const IMAGE_HEIGHT = PARENT_WIDTH - 10;

export default class PopularProductItem extends React.Component {


    /** RENDER */
    render() {

        return (
            <View>
                <EDRTLText style={style.txtStyle} title={strings("popularItems")} />
                <FlatList
                    numColumns={2}
                    data={this.props.data}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => item + index}
                    renderItem={({ item, index }) => {
                        return (
                            <ImageGrid
                                isOpen={this.props.isOpen}
                                item={item}
                                currency={this.props.currency_symbol}
                                onPress={this.props.onPress}
                                onAddToCart={this.props.onAddToCart}
                                cartData={this.props.cartData}
                                navigateToCart={this.props.navigateToCart}
                            />
                        );
                    }}
                />

            </View>
        );
    }
    //#endregion

}

//#region STYLES
export const style = StyleSheet.create({
    parentContainer: { width: PARENT_WIDTH, height: PARENT_WIDTH * 1.2 },
    imageContainer: {
        flex: 1,
        marginBottom: Platform.select({ ios: 0, android: 1 }), // Prevent a random Android rendering issue
    },
    shadowContainer: {
        margin: 5,
        borderColor: EDColors.shadow,
        borderWidth: 1,
        borderRadius: 5,
        backgroundColor: EDColors.white,
        shadowOpacity: 0.25,
        shadowRadius: 5,
        shadowColor: EDColors.text,
        shadowOffset: { height: 0, width: 0 },
        overflow: 'hidden',
        flex: 1,
    },
    productImage: {
        height: IMAGE_HEIGHT,
        width: IMAGE_WIDTH,
    },
    productName: {
        fontFamily: EDFonts.medium,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: EDColors.text,
        fontSize: getProportionalFontSize(12),
        marginVertical: 3,
        marginHorizontal: 4,
    },
    txtStyle: {
        marginStart: 10,
        marginEnd: 10,
        color: "#000",
        fontSize: 16,
        marginTop: 8,
        marginLeft: 20,
        fontFamily: EDFonts.bold
    }
});
//#endregion
