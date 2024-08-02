import React, { Component } from "react";
import { FlatList, StyleSheet } from 'react-native';
import { Icon } from "react-native-elements";
import { strings } from "../locales/i18n";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";
import HomeCategoryCard from "./HomeCategoryCard";

export default class EDRestaurantDeatilsFlatList extends Component {
    state = {
        selectedCat: this.props.modelSelected,
        selectedCategories: []
    }

    componentWillReceiveProps = (nextProps) => {
        let selectedCategories = []
        if (
            this.props.arrayCategories !== undefined &&
            this.props.arrayCategories !== null &&
            this.props.arrayCategories.length !== 0
        ) (this.props.arrayCategories.map(data => {
            if (nextProps.modelSelected.includes(data.food_type_id)) {
                selectedCategories.push(data)
            }
        }))
        this.setState({ selectedCat: nextProps.modelSelected, selectedCategories: selectedCategories })

    }

    render() {
        return (

            this.props.arrayCategories !== undefined &&
                this.props.arrayCategories !== null &&
                this.props.arrayCategories.length !== 0 ?
                <>
                    <EDRTLText title={strings("typeOfFood")} style={styles.title} />
                    {this.state.selectedCategories.length !== 0 ?
                        <FlatList data={this.state.selectedCategories}
                            style={{ marginStart: 10, marginEnd: 10, marginBottom:10 }}
                            horizontal={true}
                            inverted={isRTLCheck()}
                            extraData={this.state}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                            keyExtractor={(item, index) => item + index}
                            renderItem={this.renderChips}
                        /> : null}
                    <FlatList
                        style={{ marginStart: 10, marginEnd: 10 }}
                        horizontal={true}
                        inverted={isRTLCheck()}
                        extraData={this.state}
                        data={this.props.arrayCategories}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={(item, index) => item + index}
                        renderItem={this.renderCategoryList}
                    />
                   
                </> : null

        )
    }


    renderCategoryList = (item, index) => {
        return (
            <HomeCategoryCard
                categoryObjModel={item}
                onPress={model => { this.props.onCategoryPressed(item) }}
                isSelected={this.state.selectedCat.includes(item.item.food_type_id)}
            />
        );
    }

    renderChips = ( item, index ) => {
        return (
            <EDRTLView style={styles.chipView}>
                <EDRTLText title={item.item.name} style={styles.chipTitle}/>
                <Icon name="close" size={22} color={EDColors.white}  onPress={() => { this.props.onCategoryPressed(item) }}/>
            </EDRTLView>
        );
    }

}

const styles = StyleSheet.create({
    title: {
        fontFamily: EDFonts.bold,
        fontSize: getProportionalFontSize(18),
        color: EDColors.black,
        marginVertical: 10,
        marginHorizontal: 15
    },
    chipView: {
        backgroundColor: EDColors.primary,
        borderRadius: 16,
        paddingVertical: 5,
        paddingHorizontal: 10,
        marginHorizontal: 5,
        alignItems:"center"
    },
    chipTitle :{
        fontSize : getProportionalFontSize(14),
        fontFamily : EDFonts.regular,
        color : EDColors.white,
        marginHorizontal :5
    }
})