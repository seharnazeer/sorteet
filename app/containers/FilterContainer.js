import React from "react";
import { Text } from "react-native";
import { TouchableOpacity } from "react-native";
import { FlatList } from "react-native";
import { Platform, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "react-native-elements";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { heightPercentageToDP } from "react-native-responsive-screen";
import { NavigationEvents } from "react-navigation";
import { connect } from "react-redux";
import EDCategoryBox from "../components/EDCategoryBox";
import EDFilterCheckBox from "../components/EDFilterCheckBox";
import EDHomeSearchBar from "../components/EDHomeSearchBar";
import EDRTLText from "../components/EDRTLText";
import EDRTLView from "../components/EDRTLView";
import ETSlider from "../components/ETSlider";
import RadioGroupWithHeader from "../components/RadioGroupWithHeader";
import TextviewRadius from "../components/TextviewRadius";
import { strings } from "../locales/i18n";
import { saveFoodType, saveHomeCategories } from "../redux/actions/User";
import { showNoInternetAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import { RESPONSE_SUCCESS } from "../utils/EDConstants";
import { debugLog, getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import { netStatus } from "../utils/NetworkStatusConnection";
import { getHomeFiltersAPI } from "../utils/ServiceManager";
import BaseContainer from "./BaseContainer";

class FilterContainer extends React.Component {
    constructor(props) {
        super(props);

        this.cookTime = this.props.navigation.state.params.time || 30;
        this.recipeType = this.props.navigation.state.params.food === 0 ? 2 : this.props.navigation.state.params.food === "" ? 0 : this.props.navigation.state.params.food;
        this.distance = this.props.navigation.state.params.distance === "" ? (this.state.maxFilterDistance || 10000) : this.props.navigation.state.params.distance;
        this.distanceForPickUp = this.props.navigation.state.params.distanceForPickUp === "" ? (this.state.maxFilterDistanceForPickup || 10000) : this.props.navigation.state.params.distanceForPickUp;

        this.priceType = this.props.navigation.state.params.price === 0 ? 0 : this.props.navigation.state.params.price === "" ? 0 : 1
        this.isShowReview = this.props.navigation.state.params !== undefined &&
            this.props.navigation.state.params.isShowReview !== undefined ?
            this.props.navigation.state.params.isShowReview : true
        this.selectedAvail = this.props.navigation.state.params.availType || 0
        this.assigned_food_types = this.props.navigation.state.params.assigned_food_types || []



        this.selectedSort = this.props.navigation.state.params.sortType === 0 ? 0 : this.props.navigation.state.params.sortType === 1 ? 1 : 0
        this.selectedRestType = this.props.navigation.state.params.selectedRestType === 0 ? 0 : this.props.navigation.state.params.selectedRestType === 1 ? 1 : this.props.navigation.state.params.selectedRestType === 2 ? 2 : 0




        if (this.isShowReview)
            this.sortType = [
                {
                    label: strings("filterDistance"),
                    size: 15,
                    selected: this.props.navigation.state.params.sortType === 0 ? true : false
                },
                {
                    label: strings("filterRating"),
                    size: 15,
                    selected: this.props.navigation.state.params.sortType == 1 ? true : false
                }

            ]
        else
            this.sortType = [
                {
                    label: strings("filterDistance"),
                    size: 15,
                    selected: this.props.navigation.state.params.sortType === 0 ? true : false
                },
            ]

        this.availType = [
            {
                label: strings("filterAll"),
                size: 15,
                selected: this.props.navigation.state.params.availType === 0 ? true : false
            },
            {
                label: strings("breakfast"),
                size: 15,
                selected: this.props.navigation.state.params.availType === 1 ? true : false
            },
            {
                label: strings("lunch"),
                size: 15,
                selected: this.props.navigation.state.params.availType == 2 ? true : false
            },
            {
                label: strings("dinner"),
                size: 15,
                selected: this.props.navigation.state.params.availType == 3 ? true : false
            }

        ]

        this.restType = [
            {
                label: strings("both"),
                size: 15,
                selected: this.props.navigation.state.params.selectedRestType == 0 ? true : false
            },
           

        ]

    }

    state = {
        priceSort: [
            {
                label: strings("lowToHigh"),
                size: 15,
                selected: this.props.navigation.state.params.price === 0 ? true : false
            },
            {
                label: strings("highToLow"),
                size: 15,
                selected: this.props.navigation.state.params.price === 1 ? true : false
            }
        ],
        sendFilterDetailsBack: this.props.navigation.state.params.getFilterDetails,
        filterType: this.props.navigation.state.params.filterType,
        isLoading: false,
        foodArray: this.props.navigation.state.params.foodArray || [],
        catArray: this.props.navigation.state.params.catArray || [],
        isShowDistance: true,
        isShow: true,
        strSearch: "",
        isFreeDelivery: this.props.navigation.state.params.isFreeDelivery || false,
        minFilterDistance: undefined,
        maxFilterDistance: undefined,
        maxFilterDistanceForPickup: undefined,
        arrayCategories: [],
        arrayCategoriesUpdated: []

    };

    applyFilter(data) {
        if (this.state.isShowDistance == false) {
            this.distance = this.state.maxFilterDistance || 10000
            this.distanceForPickUp = this.state.maxFilterDistanceForPickup || 10000
        }
        if (this.state.sendFilterDetailsBack != undefined) {
            this.state.sendFilterDetailsBack(data);
        }
        this.props.navigation.goBack();
    }

    addToFoodType = (data) => {
        let foodArray = this.state.foodArray
        foodArray.push(data.food_type_id)
        this.setState({ foodArray: foodArray })
    }

    removeFromFoodType = (item) => {
        let temp = this.state.foodArray.filter(data => {
            return item.food_type_id !== data
        })
        this.setState({ foodArray: temp })
    }

    addCategory = (data) => {
        let temp = this.state.catArray
        temp.push(data.category_id)
        this.setState({ catArray: temp })
    }

    removeCategory = (item) => {
        let temp = this.state.catArray.filter(data => {
            return item.category_id !== data
        })
        this.setState({ catArray: temp })
    }


    handleIsShow = () => {
        this.setState({ isShow: !this.state.isShow })
    }

    renderFoodType = (data) => {
        return (
            <SafeAreaView style={{ marginHorizontal: 5 }} >
                <EDFilterCheckBox
                    isSelected={this.state.foodArray.includes(data.food_type_id)}
                    data={data}
                    addToFoodType={this.addToFoodType}
                    removeFromFoodType={this.removeFromFoodType}
                />
            </SafeAreaView>
        )
    }

    renderCategory = (data) => {
        return (
            <SafeAreaView style={{}} >
                <EDCategoryBox
                    isSelected={this.state.catArray.includes(data.category_id)}
                    data={data}
                    addToFoodType={this.addCategory}
                    removeFromFoodType={this.removeCategory}
                />
            </SafeAreaView>
        )
    }


    onSearch = async text => {
        let menu = JSON.parse(JSON.stringify(this.state.arrayCategories))
        // await getMenu(data => menu = data)

        menu = menu.filter(data => {
            return data.name.toLowerCase().includes(text.toLowerCase())
        })
        this.setState({ strSearch: text.trim(), arrayCategoriesUpdated: menu })
    }


    clearSearch = async () => {
        this.setState({ strSearch: "", arrayCategoriesUpdated: JSON.parse(JSON.stringify(this.state.arrayCategories)) })

    }

    toggleFreeDelivery = () => {
        this.setState({ isFreeDelivery: !this.state.isFreeDelivery })
    }


    componentWillMount() {
        if (this.selectedSort == 1)
            this.setState({ isShowDistance: false })
        else
            this.setState({ isShowDistance: true })
    }

    fetchHomeFilters = () => {
        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true })
                let params = {
                    language_slug: this.props.lan
                }

                getHomeFiltersAPI(params, this.onSuccessFilter, this.onFailureFilter, this.props)
            }
            else
                showNoInternetAlert()
        })
    }

    onSuccessFilter = onSuccess => {
        if (onSuccess.status == RESPONSE_SUCCESS) {

            this.distance = onSuccess.maxFilterDistance
            this.distanceForPickUp = onSuccess.maxFilterDistanceForPickup

            this.setState({
                isLoading: false,
                arrayCategories: onSuccess.category,
                arrayCategoriesUpdated: onSuccess.category,
                minFilterDistance: onSuccess.minFilterDistance,
                maxFilterDistance: onSuccess.maxFilterDistance,
                maxFilterDistanceForPickup: onSuccess.maxFilterDistanceForPickup
            })

            this.props.saveHomeCategoriesInRedux(
                {
                    arrayCategories: onSuccess.category,
                    minFilterDistance: onSuccess.minFilterDistance,
                    maxFilterDistance: onSuccess.maxFilterDistance,
                    maxFilterDistanceForPickup: onSuccess.maxFilterDistanceForPickup
                }
            )
        }
        else
            this.setState({
                isLoading: false,
            })
    }
    onFailureFilter = onFailure => {
        this.setState({ isLoading: false })
    }

    onWillFocusFilter = () => {
        debugLog("onWillFocusFilter ::::::", this.props.homeFilterCategories, this.props.homeFilterCategories !== undefined && this.props.homeFilterCategories !== null && this.props.homeFilterCategories !== {})
        if (this.state.filterType !== "Main")
            return;
        if (this.props.homeFilterCategories !== undefined && this.props.homeFilterCategories !== null && this.props.homeFilterCategories.arrayCategories !== undefined &&
            this.props.homeFilterCategories.arrayCategories !== null &&
            this.props.homeFilterCategories.arrayCategories.length !== 0
        ) {
            this.distance = this.props.navigation.state.params.distance === "" ? this.props.homeFilterCategories.maxFilterDistance : this.props.navigation.state.params.distance;
            this.distanceForPickUp = this.props.navigation.state.params.distanceForPickUp === "" ? this.props.homeFilterCategories.maxFilterDistanceForPickup : this.props.navigation.state.params.distanceForPickUp;

            this.setState({
                isLoading: false,
                arrayCategories: this.props.homeFilterCategories.arrayCategories,
                arrayCategoriesUpdated: this.props.homeFilterCategories.arrayCategories,
                minFilterDistance: this.props.homeFilterCategories.minFilterDistance,
                maxFilterDistance: this.props.homeFilterCategories.maxFilterDistance,
                maxFilterDistanceForPickup: this.props.homeFilterCategories.maxFilterDistanceForPickup
            })
            return;
        }
        this.fetchHomeFilters()
    }

    render() {
        return (
            <BaseContainer
                title={strings("filterTitle")}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                right={[]}
                onLeft={() => { this.props.navigation.goBack() }}
                loading={this.state.isLoading}>

                <NavigationEvents onWillFocus={this.onWillFocusFilter} />

                <KeyboardAwareScrollView>
                    {this.state.filterType == "Main" ?
                        <RadioGroupWithHeader
                            selected={this.selectedSort}
                            style={{ flexDirection: isRTLCheck() ? 'row-reverse' : 'row' }}
                            data={this.sortType}
                            Texttitle={strings("sortBy")}
                            titleStyle={{ color: EDColors.black, fontSize: getProportionalFontSize(16) }}
                            onSelected={selected => {
                                if (selected == 1)
                                    this.setState({ isShowDistance: false })
                                else
                                    this.setState({ isShowDistance: true })

                                this.selectedSort = selected;
                            }}
                        />
                        : null}

             


                    {this.state.filterType == "Main" ?
                        <RadioGroupWithHeader
                            data={this.availType}
                            style={{ flexDirection: isRTLCheck() ? 'row-reverse' : 'row' }}
                            selected={this.selectedAvail}
                            Texttitle={strings("sortAvailibility")}
                            titleStyle={{ color: EDColors.black, fontSize: getProportionalFontSize(16) }}

                            onSelected={selected => {
                                this.selectedAvail = selected;
                            }}
                        /> : null}

                    <View style={{ flex: 6 }}>
                        {this.state.filterType == "Main" ? (
                            this.state.isShowDistance && this.state.minFilterDistance !== undefined ?
                                <View>
                                    <ETSlider
                                        title={strings("filterByDistance")}
                                        onSlide={values => {
                                            if (this.props.orderMode == 0)
                                                this.distance = values;
                                            else
                                                this.distanceForPickUp = values;
                                        }}
                                        min={parseInt(this.state.minFilterDistance || 0)}
                                        max={this.props.orderMode == 1 ? parseInt(this.state.maxFilterDistanceForPickup || 10000) : parseInt(this.state.maxFilterDistance || 10000)}
                                        initialValue={this.props.orderMode == 1 ? this.distanceForPickUp : this.distance}
                                        valueType={this.props.useMile =="1" ? strings("miles"): strings("km")}
                                    />
                                </View> : null
                        ) : this.state.filterType == "Recipe" ? (
                            <ETSlider
                                title={strings("filterByTime")}
                                onSlide={values => {
                                    this.cookTime = values;
                                }}
                                max={240}
                                min={5}
                                initialValue={this.cookTime}
                                valueType={strings("min")}
                            />
                        ) : (null)}
                    </View>



                    {this.state.filterType == "Main" ?

                        <TouchableOpacity style={style.checkBoxcontainer}
                            activeOpacity={1}
                            onPress={this.toggleFreeDelivery}

                        >
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }} >
                                <EDRTLText title={strings("freeDel")} style={[style.checkTitle, { marginBottom: 0 }]} />
                                <Icon type="feather"
                                    color={EDColors.primary}
                                    name={this.state.isFreeDelivery ? "check-square" : "square"}
                                    size={24}
                                />
                            </View>
                        </TouchableOpacity>

                        : null}


                    {this.state.filterType == "Main" && this.state.arrayCategories !== undefined &&
                        this.state.arrayCategories !== null &&
                        this.state.arrayCategories.length !== 0 ?

                        <View style={style.checkBoxcontainer}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }} >
                                <EDRTLText title={strings("filterCategory")} style={style.checkTitle} />
                                {/* <Icon name = { this.state.isShow ? "expand-less" : "expand-more"} size = {30} onPress = {this.handleIsShow} /> */}
                            </View>
                            <View style={{ flex: 1, borderWidth: 1, borderColor: EDColors.radioSelected, marginTop: 20, marginBottom: 10, marginHorizontal: 10 }} />
                            {this.state.isShow ?
                                <>
                                    <EDHomeSearchBar
                                        ref={ref => this.textInput = ref}
                                        showIcon={true}
                                        onLayout={this.onSearchLayout}
                                        onCleanPress={this.clearSearch}
                                        hideClear={true}
                                        onChangeValue={this.onSearch}
                                        showClear={this.state.strSearch.length !== 0}
                                        // value={this.state.strSearch}
                                        placeholder={strings("searchCategory")}
                                        style={{ marginTop: 0, marginHorizontal: 0, borderWidth: 1, borderColor: EDColors.separatorColorNew }} />
                                    <Text style={{ flexWrap: "wrap" }}>
                                        <FlatList
                                            data={this.state.arrayCategoriesUpdated}
                                            contentContainerStyle={{ flexWrap: "wrap", width: metrics.screenWidth - 15 }}
                                            horizontal
                                            renderItem={({ item, index }) => this.renderCategory(item)}
                                        />
                                    </Text>

                                </>
                                : null}
                        </View>
                        : null}

                    {this.state.filterType == "menu" ?
                        <RadioGroupWithHeader
                            data={this.availType}
                            style={{ flexDirection: isRTLCheck() ? 'row-reverse' : 'row' }}
                            selected={this.selectedAvail}
                            Texttitle={strings("sortAvailibility")}
                            onSelected={selected => {
                                this.selectedAvail = selected;
                            }}
                            titleStyle={{ color: EDColors.black, fontSize: getProportionalFontSize(16) }}

                        /> : null}

                    {(this.state.filterType == "menu" || this.state.filterType == "Recipe") &&
                        ((this.assigned_food_types !== undefined &&
                            this.assigned_food_types !== null &&
                            this.assigned_food_types.length !== 0) ||
                            (this.props.foodType !== undefined &&
                                this.props.foodType !== null &&
                                this.props.foodType.length !== 0)) ?

                        <View style={style.checkBoxcontainer}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }} >
                                <EDRTLText title={
                                    this.state.filterType == "Main" || this.state.filterType == "menu" || this.state.filterType == "Recipe"
                                        ? strings("typeOfFood")
                                        : strings("typeOfRecipe")
                                } style={style.checkTitle} />
                                {/* <Icon name = { this.state.isShow ? "expand-less" : "expand-more"} size = {30} onPress = {this.handleIsShow} /> */}
                            </View>
                            <View style={{ flex: 1, borderWidth: 1, borderColor: EDColors.radioSelected, marginTop: 20, marginBottom: 15, marginHorizontal: 10 }} />
                           
                            {this.state.isShow ?

                                <EDRTLView style={{ flexWrap: "wrap", justifyContent: "flex-start" }}>
                                    {this.assigned_food_types !== undefined &&
                                        this.assigned_food_types !== null &&
                                        this.assigned_food_types.length !== 0 ?
                                        this.assigned_food_types.map(data => {
                                            return this.renderFoodType(data)
                                        }) :
                                        this.props.foodType.map(data => {
                                            return this.renderFoodType(data)
                                        })
                                    }
                                </EDRTLView>
                                : null}
                        </View>
                        : null}

                </KeyboardAwareScrollView>
                <EDRTLView
                    style={{ alignSelf: "center", marginBottom: Platform.OS == 'ios' ? 20 : 0, }}>
                    <TextviewRadius
                        text={strings("filterApply")}
                        style={{ height: heightPercentageToDP('6%'), width: metrics.screenWidth * 0.4, textAlignVertical: "center", borderRadius: 16 }}
                        onPress={() => {
                            if (this.state.filterType == "Main") {
                                var data = {
                                    distance: this.distance !== "" ? this.distance : "",
                                    distanceForPickUp: this.distanceForPickUp !== "" ? this.distanceForPickUp : "",
                                    catArray: this.state.catArray,
                                    sortType: this.selectedSort,
                                    applied: true,
                                    selectedRestType: this.selectedRestType,
                                    isFreeDelivery: this.state.isFreeDelivery,
                                    availType: this.selectedAvail
                                };
                                this.applyFilter(data);
                            } else if (this.state.filterType == "Recipe") {
                                var data = {
                                    timing: this.cookTime != "" ? this.cookTime : "",
                                    foodArray: this.state.foodArray,
                                    applied: true

                                };
                                this.applyFilter(data);
                            } else {
                                var data = {
                                    foodArray: this.state.foodArray,
                                    price: this.priceType,
                                    applied: true,
                                    availType: this.selectedAvail

                                };
                                this.applyFilter(data);
                            }

                        }}
                    />
                    <TextviewRadius
                        text={strings("filterReset")}
                        style={{ height: heightPercentageToDP('6%'), width: metrics.screenWidth * 0.4, backgroundColor: EDColors.white, textAlignVertical: "center", borderRadius: 16 }}
                        textStyle={{ color: EDColors.black }}
                        onPress={() => {
                            if (this.state.filterType == "Main") {
                                var data = {
                                    catArray: [],
                                    distance: "",
                                    distanceForPickUp: '',
                                    sortType: 0,
                                    selectedRestType: 0,
                                    isFreeDelivery: false,
                                    availType: 0
                                };
                                this.applyFilter(data);
                            } else if (this.state.filterType == "Recipe") {
                                var data = {
                                    foodArray: [],
                                    timing: ""
                                };
                                this.applyFilter(data);
                            } else {
                                var data = {
                                    foodArray: [],
                                    price: "",
                                    availType: 0
                                };
                                this.applyFilter(data);
                            }
                        }}
                    />
                </EDRTLView>
            </BaseContainer>
        );
    }
}

export const style = StyleSheet.create({
    checkTitle: {
        fontFamily: EDFonts.semiBold,
        color: EDColors.black,
        fontSize: getProportionalFontSize(16),
        marginHorizontal: 10,
        marginBottom: 5
    },
    checkBoxcontainer: {
        borderRadius: 6,
        // shadowColor: EDColors.black,
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.8,
        // shadowRadius: 2,
        // elevation: 2,
        padding: 10,
        backgroundColor: EDColors.white,
        margin: 10,
        flex: 1
    },
});


// CONNECT FUNCTION
export default connect(
    state => {
        return {
            lan: state.userOperations.lan,
            foodType: state.userOperations.foodType,
            homeFilterCategories: state.userOperations.homeFilterCategories,
            orderMode: state.userOperations.orderMode,
            useMile: state.userOperations.useMile
        };
    },
    dispatch => {
        return {
            saveFoodTypeInRedux: food_type => {
                dispatch(saveFoodType(food_type))
            },
            saveHomeCategoriesInRedux: dataToSave => {
                dispatch(saveHomeCategories(dataToSave))
            },
        }
    }
)(FilterContainer);