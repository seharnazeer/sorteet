import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { EDColors } from '../utils/EDColors';
import { funGetFrench_Curr, getProportionalFontSize, isRTLCheck } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import metrics from '../utils/metrics';
import EDImage from './EDImage';
import EDRTLText from './EDRTLText';
import EDRTLView from './EDRTLView';

export default class EDItemComponent extends React.Component {

    itemToIterate = this.props.data
    state = {
        rate: 0
    }
    componentDidMount = () => {
        let total = this.props.data.price
        this.props.data.addons_category_list.map((item) => {
            {
                item.addons_list.map((items) => {
                    if (items.add_ons_price !== undefined) {
                        total = parseInt(total) + parseInt(items.add_ons_price)
                    }
                })
            }
        })

        this.setState({ rate: total })
    }

    render() {
        return (
            <EDRTLView style={[styles.orderViewStyle, { alignItems: this.itemToIterate.addons_category_list !== undefined && this.itemToIterate.addons_category_list !== null && this.itemToIterate.addons_category_list.length !== 0 ? "flex-start" : "center" }]}>
                <EDImage source={this.itemToIterate.image} style={styles.imageRecipeStyle} />
                <EDRTLView style={{ flex: 1, alignItems: 'center' }}>
                    <View style={styles.quantityText}>
                        <EDRTLView>
                            <EDRTLText style={[styles.dishTextStyle, { marginHorizontal: this.itemToIterate.addons_category_list !== undefined && this.itemToIterate.addons_category_list !== null && this.itemToIterate.addons_category_list.length !== 0 ? 5 : 10, marginBottom: 5 }]} title={this.itemToIterate.name} />
                            <EDRTLText title={'( X' + this.itemToIterate.quantity + ')'} style={{color: EDColors.black}} />
                            <EDRTLText title={this.props.currency_symbol + funGetFrench_Curr(this.state.rate, this.itemToIterate.quantity, this.props.lan)} style={[styles.quantityText, { textAlign: isRTLCheck() ? 'left' : 'right' }]}></EDRTLText>
                        </EDRTLView>
                        {this.itemToIterate.addons_category_list !== undefined && this.itemToIterate.addons_category_list !== null && this.itemToIterate.addons_category_list.length !== 0 ?
                            this.itemToIterate.addons_category_list.map((data) => {
                                return (
                                    <View>
                                        <EDRTLText style={[styles.addonsCategoryText, { maxWidth: isRTLCheck() ? metrics.screenWidth : metrics.screenWidth * 0.45 }]} title={data.addons_category} />
                                        {data.addons_list.map((items) => {
                                            return (
                                                <EDRTLView style={styles.addonsViewStyle}>
                                                    <EDRTLText style={styles.addonsTextStyle} title={" - " + items.add_ons_name + " (x" + this.itemToIterate.quantity + ")"} />
                                                    <EDRTLText style={styles.addonsSubTextStyle} title={this.props.currency_symbol + funGetFrench_Curr(items.add_ons_price, 1, this.props.lan)} />
                                                </EDRTLView>
                                            )
                                        })}
                                    </View>
                                )
                            })
                            : null}
                        {this.itemToIterate.is_combo_item == 1 && this.itemToIterate.combo_item_details != "" && this.itemToIterate.combo_item_details != undefined && this.itemToIterate.combo_item_details != null ?
                            <EDRTLText title={this.itemToIterate.combo_item_details.replaceAll("+ ", "\r\n")} style={[styles.addonsCategoryText, { maxWidth: isRTLCheck() ? metrics.screenWidth : metrics.screenWidth * 0.45 }]} />
                            : null
                        }
                    </View>
                    <Icon
                        color={EDColors.black}
                        name={"delete"}
                        size={getProportionalFontSize(20)}
                         type="ant-design" 
                        onPress={this.props.deleteHandler}
                         containerStyle={isRTLCheck() ? {alignSelf:"flex-start", marginRight: 5, paddingRight: 10 } : { marginLeft :10, paddingLeft: 10, alignSelf:"flex-start"}} />

                </EDRTLView>
            </EDRTLView>
        )
    }
}

const styles = StyleSheet.create({
    orderViewStyle: { alignItems: 'center', marginVertical: 5 },
    imageRecipeStyle: { marginHorizontal: 5, height: 45, width: 45, borderRadius: 6 },
    quantityText: { flex: 1,color : EDColors.black },
    dishTextStyle: {
        fontSize: getProportionalFontSize(15),
        marginHorizontal: 10, fontFamily: EDFonts.bold,
        // maxWidth: metrics.screenWidth * .4,
        flex : 1,
        color: EDColors.black
    },
    addonsCategoryText: {
        fontSize: getProportionalFontSize(13),
        marginHorizontal: 10, fontFamily: EDFonts.bold,
        maxWidth: metrics.screenWidth * .45,
        color: EDColors.black
    },
    addonsViewStyle: { flex: 1, justifyContent: 'space-between', marginBottom: 10 },
    addonsTextStyle: { 
        color: EDColors.black,
        fontFamily: EDFonts.semiBold, maxWidth: metrics.screenWidth * 0.55, marginHorizontal: 15, fontSize: getProportionalFontSize(13) },
    addonsSubTextStyle: {
        color: EDColors.black,
        fontFamily: EDFonts.semiBold, fontSize: getProportionalFontSize(13) },

})