

import React from "react";
import { Animated, FlatList, Keyboard, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { heightPercentageToDP } from "react-native-responsive-screen";
import sectionListGetItemLayout from 'react-native-section-list-get-item-layout';
import ProductComponent from '../components/ProductComponent';
import { strings } from "../locales/i18n";
import { EDColors } from "../utils/EDColors";
import { debugLog, getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import EDButton from "./EDButton";
import EDHomeSearchBar from "./EDHomeSearchBar";
import EDPlaceholderComponent from "./EDPlaceholderComponent";

export default class EDMenuListComponent extends React.PureComponent {
    constructor(props) {
        super(props)
        this.refreshing = false
        this.sectionData = []
        this.lastProductHeight = 0
        this.startingHeight = metrics.screenHeight
        this.animatedHeight = new Animated.Value(200)
        this.animatedValue = new Animated.Value(0)
        this.scrollY = React.createRef()
        this.scrollY.current = new Animated.Value(0)
        this.scrollFlag = false
        this.state = {
            selectedID: -1,
            enableScrollViewScroll: false,
            totalHeight: 0,
            initialHeight: metrics.screenHeight,
            key: 1,
            headerHeight: metrics.screenHeight * .26,
            tabHeight: 45,
            enableSectionScroll: true,
            topMargin: undefined,
            measurements: new Array(this.sectionData.length).fill(0),
            scrollY: new Animated.Value(0),
            strSearch: "",
            isSearchVisible: this.props.isSearchVisible,
            searchHeight: 48,
            data: this.props.data,
            imagesToLoad: []
        }
        this.bottomPadding = 0
        this.getItemLayout = sectionListGetItemLayout({
            // The height of the row with rowData at the given sectionIndex and rowIndex
            getItemHeight: (rowData, sectionIndex, rowIndex) => (metrics.screenHeight * 0.175) + 20,

            // These four properties are optional
            // getSeparatorHeight: (sectionIndex) => sectionIndex == 0 ? 20 : 20,
            getSectionHeaderHeight: (index) => 60, // The height of your section headers
            listHeaderHeight: metrics.screenHeight * 0.585 + (this.props.isOpen ? 0 : 40), // The height of your list header
        })
    }

    componentWillMount = () => {
        this.sectionData = JSON.parse(JSON.stringify(this.props.data))
        if (this.props.popularItems != undefined & this.props.popularItems != null && this.props.popularItems.length > 0) {
            // this.sectionData.push({ category_id: -1, title: strings("popularItems"), data: this.props.popularItems })
            this.setState({ selectedID: -1 })
        }
        else
            this.setState({ selectedID: undefined })


        this.props.data.map(item => {
            if (this.state.selectedID == undefined)
                this.setState({ selectedID: item.category_id })
            // this.sectionData.push(
            //     { category_id: item.category_id, title: item.category_name, data: item.items }
            // )
        })

    }

    componentWillReceiveProps = (newProps) => {
        if (newProps.isSearchVisible == true) {
            if (this.sectionRef !== undefined && this.sectionRef !== null) {
                this.sectionRef.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true, viewOffset: 55, viewPosition: 0 })
                setTimeout(() => {
                    if (this.textInput)
                        this.textInput.textInput.focus()
                }, 100)
            }
        }
    }


    onProductPress = (item) => {
        this.props.onProductPress(item)
    }

    menuItemsRender = (item, section) => {
        return (
            section.category_id == -2 ?
                <EDPlaceholderComponent title={strings("noDataFound")} /> :
                <ProductComponent
                    currency={this.props.currency_Symbol}
                    allowPreOrder={this.props.allowPreOrder}
                    data={item}
                    addons_category_list={item.addons_category_list === undefined ? [] : item.addons_category_list}
                    cartData={this.props.cartData.length === 0 ? [] : this.props.cartData}
                    isLoading={this.props.isLoading}
                    isOpen={this.props.isOpen}
                    plusAction={() => this.props.plusAction(item)}
                    minusItems={this.props.minusItems}
                    addData={this.props.addData}
                    addOneData={this.props.addOneData}
                    onProductPress={() => this.onProductPress(item)}
                    // onLayout={(e) => this.onProductLayout(e, section)}
                    shouldLoadImage={this.state.imagesToLoad.includes(section.category_id)}

                />
        )
    }

    onProductLayout = (e, section) => {

        if (this.lastProductHeight !== undefined) {
            this.lastProductHeight = e.nativeEvent.layout.height
            let total_products = 0
            this.sectionData.map(data => [
                total_products = total_products + data.data.length
            ])
            this.setState({ initialHeight: total_products * (this.lastProductHeight) })
        }
        // if (section.category_id == this.sectionData.reverse()[0].category_id) {
        //     this.bottomPadding = this.bottomPadding + e.nativeEvent.layout.height
        //     debugLog("PADDING SUCCESS :::::", section.category_id, this.sectionData.reverse()[0].category_id)

        // }
        // debugLog("TOTAL PADDING :::::", this.bottomPadding, section.category_id, this.sectionData.reverse()[0].category_id)

    }

    onScrollViewScrolll = event => {
        if (event.nativeEvent.contentOffset.y >= this.state.headerHeight) {
            if (this.state.enableScrollViewScroll == false) {
                this.setState({ enableScrollViewScroll: true })
            }
        }
        else if (event.nativeEvent.contentOffset.y < this.state.headerHeight - this.state.tabHeight) {
            if (this.state.enableScrollViewScroll == true) {
                if (this.props.popularItems != undefined & this.props.popularItems != null && this.props.popularItems.length > 0) {
                    this.setState({ selectedID: -1, enableScrollViewScroll: false })
                }
                else {
                    let id = this.sectionData.map(data => data.category_id)[0]
                    this.setState({ selectedID: id, enableScrollViewScroll: false })
                }
            }
        }
    }

    onCheckViewableItem = ({ viewableItems, changed }) => {
        if (viewableItems !== undefined && viewableItems !== null && viewableItems.length !== 0) {
            let index = this.sectionData.map(data => data.category_id).indexOf(viewableItems.reverse()[0].section.category_id)
            if (index !== -1) {
                try {
                    this.tabRef.scrollToIndex({ animated: true, index: index, viewPosition: 1 })
                    this.tabRef2.scrollToIndex({ animated: true, index: index, viewPosition: 1 })
                }
                catch { (err => { debugLog("TAB SCROLL ERROR :::::", err) }); }
            }
            let imagesToLoad = [...this.state.imagesToLoad, ...viewableItems.map(data => data.section.category_id)]

            this.setState({ selectedID: viewableItems.reverse()[0].section.category_id, imagesToLoad: [... new Set(imagesToLoad)] })
        }
    }

    onHeaderLayout = e => {
        this.setState({
            headerHeight: e.nativeEvent.layout.height - this.state.tabHeight, imagesToLoad:
                this.sectionData !== undefined && this.sectionData !== null && this.sectionData.length !== 0
                    ? [this.sectionData[0].category_id] : []
        })

    }

    onEndReached = () => {
        let ids = this.sectionData.map(data => data.category_id)
        this.setState({ imagesToLoad: ids })
    }

    ListHeaderComponent = () => {
        return (
            <View style={{}}
                onLayout={this.onHeaderLayout}>
                {this.props.ListHeaderComponent()}
                {this.renderTab(2)}
            </View>
        )
    }

    onTabPress = index => {
        this.setState({ enableScrollViewScroll: true })
        this.sectionRef.scrollToLocation({ sectionIndex: index, itemIndex: 0, animated: true, viewOffset: this.props.isSearchVisible ? this.state.searchHeight + 38 : 38, viewPosition: 0 })
    }
    renderFooter = () => {
        return (
            <View
                // source={Assets.logo}
                style={[
                    styles.footerImage,
                    {
                        marginTop: metrics.screenHeight - metrics.navbarHeight - this.state.tabHeight  - (this.sectionData[this.sectionData.length - 1].data.length * (metrics.screenHeight * .175 + 20))

                        // marginTop: this.startingHeight - this.state.headerHeight
                    }]} />
        )
    }



    childSection = () => {
        let total_products = 0
        this.sectionData.map(data => [
            total_products = total_products + data.data.length
        ])
        return (
            <Animated.SectionList
                style={[styles.sectionList, {
                    position: "relative"
                }]}
                windowSize={total_products}
                initialNumToRender={total_products}
                bounces={false}
                sections={this.sectionData}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: this.scrollY.current } } }],
                    {
                        useNativeDriver: true,
                        listener: () => {
                            Keyboard.dismiss()
                        }
                    },

                )}

                refreshControl={<RefreshControl
                    refreshing={this.refreshing || false}
                    colors={[EDColors.primary]}
                    onRefresh={this.onPullToRefreshHandler} />
                }
                scrollEventThrottle={16}
                ListFooterComponent={this.renderFooter}
                ListHeaderComponent={this.ListHeaderComponent}

                ref={ref => this.sectionRef = ref}
                onScrollToIndexFailed={() => {
                    debugLog("SCROLL FAILED:::")
                }}
                onViewableItemsChanged={this.onCheckViewableItem}
                viewabilityConfig={{
                    viewAreaCoveragePercentThreshold: 100,
                }}
                renderSectionHeader={({ section }) => {
                    return (
                        section.category_id == -2 ?
                            <View style={{ height: 200 }} /> :
                            <View style={{ height: 60 }}
                            >
                                <View style={styles.sectionHeaderContainer} />
                                <Text style={[styles.sectionHeaderText, { textAlign: isRTLCheck() ? "right" : "left" }]}>{section.title != undefined ? section.title.toUpperCase() : ''}</Text>
                            </View>
                    )
                }}
                renderItem={({ item, section }) => this.menuItemsRender(item, section)}
                stickySectionHeadersEnabled={false}
                // getItemLayout={this.getItemLayout}
                onEndReached={this.onEndReached}
            />
        )
    }

    onTabLayout = (e) => {
        this.setState({ tabHeight: e.nativeEvent.layout.height })
    }

    renderTab = (key = 1) => {
        return (
            <FlatList
                key={key}
                inverted={isRTLCheck()}
                data={this.sectionData}
                onLayout={this.onTabLayout}
                style={{ backgroundColor: EDColors.offWhite }}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                ref={ref => key == 1 ? this.tabRef = ref : this.tabRef2 = ref}
                horizontal
                // contentContainerStyle={{ flexDirection: isRTLCheck() ? "row-reverse" : "row" }}
                showsHorizontalScrollIndicator={false}
                renderItem={item => {
                    return (
                        item.item.category_id == -2 ? <View style={{ height: 48 }} /> :
                            <EDButton
                                label={item.item.title}
                                style={{
                                    borderWidth: 1,
                                    borderColor: EDColors.separatorColorNew,
                                    marginHorizontal: 5, paddingHorizontal: 20, height: 48, paddingVertical: 0, borderRadius: 10,
                                    backgroundColor: this.state.selectedID == item.item.category_id ? EDColors.primary : EDColors.white
                                }}
                                textStyle={{
                                    fontSize: getProportionalFontSize(13), fontFamily: EDFonts.medium, color: this.state.selectedID == item.item.category_id ? EDColors.white : EDColors.black,
                                }}
                                onPress={() => this.onTabPress(item.index)}
                            />
                    )
                }}
            />
        )
    }

    onLayout = (e) => {
        // this.startingHeight = e.nativeEvent.layout.height
        // this.forceUpdate()
    }

    onPullToRefreshHandler = () => {
        // this.refreshing = false
        // this.forceUpdate();
        if (this.props.onPullToRefreshHandler)
            this.props.onPullToRefreshHandler()
    }

    refreshControl = () => {
        if (this.props.refreshControl !== undefined) {
            this.refreshing = false
            this.props.refreshControl()
        }
    }

    onSearch = async text => {
        let menu = JSON.parse(JSON.stringify(this.props.data))
        // await getMenu(data => menu = data)
        menu.map((item, index) => {
            menu[index].data = menu[index].data.filter(data => {
                return data.name.toLowerCase().includes(text.trim().toLowerCase())
                ||  menu[index].title.toLowerCase().includes(text.trim().toLowerCase())
            })
        })
        menu = menu.filter(data => {
            return data.data.length !== 0
        })
        if (menu.length !== 0)
            this.sectionData = menu
        else
            this.sectionData = [{
                category_id: -2, title: strings("noDataFound"), data: [
                    {
                        "menu_id": "-10",
                        "name": "No Data",
                        "price": "0",
                        "menu_content_id": "-10",
                        "offer_price": "",
                        "menu_detail": "",
                        "image": "",
                        "food_type_id": "-10",
                        "is_customize": "0",
                        "is_deal": "0",
                        "status": "1",
                        "is_combo_item": "0",
                        "combo_item_details": "",
                        "is_recipes_menu": 0,
                        "in_stock": "1"
                    }
                ]
            }]
        this.setState({ strSearch: text.trim() })
        if (this.sectionRef !== undefined && this.sectionRef !== null) {
            setTimeout(() =>
                this.sectionRef.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true, viewOffset: this.state.searchHeight + 5, viewPosition: 0 }), 50)
        }
    }

    cancelSearch = async () => {
        this.sectionData = JSON.parse(JSON.stringify(this.props.data))
        this.setState({ strSearch: "", isSearchVisible: false })
        this.props.cancelSearch()
    }

    clearSearch = async () => {
        this.sectionData = JSON.parse(JSON.stringify(this.props.data))
        this.setState({ strSearch: "", })
        if (this.sectionRef !== undefined && this.sectionRef !== null) {
            setTimeout(() =>
                this.sectionRef.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true, viewOffset: this.state.searchHeight + 5, viewPosition: 0 }), 50)
        }
    }


    onSearchLayout = e => {
        this.setState({ searchHeight: e.nativeEvent.layout.height })
    }


    render() {
        const imageOpacity = this.scrollY.current.interpolate({
            inputRange:
                [0, (this.state.headerHeight - (this.props.isSearchVisible ? this.state.searchHeight : 0)), (this.state.headerHeight - (this.props.isSearchVisible ? this.state.searchHeight : 0) + (Platform.OS == "ios" ? 5 : 0))],
            outputRange: [0, 0, 1],
            extrapolate: 'clamp',
        });
        return (
            <View style={styles.container}>
                {imageOpacity !== 0 ?
                    <Animated.View style={{ opacity: imageOpacity, position: "absolute", top: 0, zIndex: 1, width: metrics.screenWidth }}>
                        {this.props.isSearchVisible ?
                            <EDHomeSearchBar
                                ref={ref => this.textInput = ref}
                                onClosePress={this.cancelSearch}
                                showIcon={true}
                                // onLayout={this.onSearchLayout}
                                onCleanPress={this.clearSearch}
                                onChangeValue={this.onSearch}
                                showClear={this.state.strSearch.length !== 0}
                                // value={this.state.strSearch}
                                placeholder={strings("searchFood")}
                                style={{ marginTop: 0, marginHorizontal: 0, borderRadius: 0, }} />
                            : null}
                        {this.renderTab()}
                    </Animated.View> : null}
                {this.sectionData.length !== 0 ?
                    this.childSection() :
                    <ScrollView>
                        {this.ListHeaderComponent()}
                        <EDPlaceholderComponent title={strings("noDataFound")} />
                    </ScrollView>
                }
            </View >
        )
    }
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: EDColors.transparent
    },
    searchContainer: {
        backgroundColor: EDColors.white,
        padding: 0
    },
    tabBar: {
        backgroundColor: '#fff',
        borderBottomColor: '#f4f4f4',
        borderBottomWidth: 1,
    },
    tabContainer: {
        borderBottomColor: '#090909'
    },
    tabText: {
        padding: 15,
        color: '#9e9e9e',
        fontSize: 18,
        fontWeight: '500'
    },
    separator: {
        height: 0.5,
        width: '96%',
        alignSelf: 'flex-end',
        backgroundColor: '#eaeaea'
    },
    sectionHeaderContainer: {
        height: 12,
        backgroundColor: EDColors.offWhite,
    },
    sectionHeaderText: {
        color: EDColors.black,
        fontSize: getProportionalFontSize(16),
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontFamily: EDFonts.bold
    },
    itemContainer: {
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: '#fff'
    },
    itemTitle: {
        flex: 1,
        fontSize: 20,
        color: '#131313'
    },
    itemPrice: {
        fontSize: 18,
        color: '#131313'
    },
    itemDescription: {
        marginTop: 10,
        color: '#b6b6b6',
        fontSize: 16
    },
    itemRow: {
        flexDirection: 'row'
    },
    sectionList: { backgroundColor: EDColors.offWhite },
    tabView: { marginHorizontal: 5, height: heightPercentageToDP('4.5%'), textAlignVertical: "center", textAlign: "center", borderWidth: 1, borderColor: "#EDEDED", borderRadius: 12 },

    footerImage: { alignSelf: 'center' }
})
