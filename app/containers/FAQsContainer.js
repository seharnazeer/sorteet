import React from "react";
import { FlatList, Linking, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Autolink from 'react-native-autolink';
import { Icon } from "react-native-elements";
import { NavigationEvents } from "react-navigation";
import { connect } from "react-redux";
import EDPlaceholderComponent from "../components/EDPlaceholderComponent";
import EDRTLText from "../components/EDRTLText";
import EDRTLView from "../components/EDRTLView";
import { strings } from "../locales/i18n";
import { saveNavigationSelection } from "../redux/actions/Navigation";
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import { netStatus } from "../utils/NetworkStatusConnection";
import { getFaqsApi } from "../utils/ServiceManager";
import BaseContainer from "./BaseContainer";
import h2p from 'html2plaintext'


class FAQsContainer extends React.PureComponent {
    //#region  LIFE CYCLE METHODS

    constructor(props) {
        super(props);

        this.arrayFAQs = undefined
        this.strOnScreenMessage = '';
        this.strOnScreenSubtitle = '';
        this.refreshing = false
        this.state = {
            isLoading: false,
            selectedSection: 0,
            questionIndex: [0]
        };
    }



    //#region 
    /** NETWORK CONNECTIVITY */
    networkConnectivityStatus = () => {
        this.getFaqs()
    }
    //#endregion


    //#region 
    /** ON LEFT PRESSED */
    onDrawerOpen = () => {
        this.props.navigation.openDrawer();
    }
    //#endregion

    onWillFocusHandler = () => {
        this.arrayFAQs = []
        this.getFaqs()
        this.props.saveNavigationSelection("FAQs");
    }

    onPullToRefreshHandler = () => {
        this.arrayFAQs = []
        this.getFaqs()
    }

    setUpFaqs = data => {
        // var formatted_data = Object.keys(data).map((key) => [Number(key), data[key]]);
        var formatted_data = Object.entries(data);
        this.arrayFAQs = []
        formatted_data.map(e => {
            this.arrayFAQs.push({
                title: e[1].name,
                data: e[1].faqs
            })
        })
    }

    /** CALL FAQs API */
    getFaqs = () => {
        netStatus(isConnected => {
            this.setState({ isLoading: true });
            if (isConnected) {
                let faqsParam = {
                    language_slug: this.props.lan,
                    user_type: "customer"
                }
                getFaqsApi(faqsParam, this.onSucessGetFaqs, this.onFailureGetFaqs)
            }
            else {
                this.strOnScreenMessage = strings("noInternetTitle")
                this.strOnScreenSubtitle = strings("noInternet")
                this.setState({ isLoading: false })
            }
        })
    }

    onSucessGetFaqs = (onSuccess) => {
        if (onSuccess.result !== undefined &&
            onSuccess.result !== null &&
            onSuccess.result.length !== 0) {
            this.setUpFaqs(onSuccess.result)
        }
        else {
            this.strOnScreenMessage = onSuccess.message
            this.strOnScreenSubtitle = ""
        }
        this.setState({ isLoading: false })
        debugLog("FAQS SUCCESS  ::::::", this.arrayFAQs)

    }

    onFailureGetFaqs = (onFailure) => {
        debugLog("FAQS FAILURE ::::::", onFailure)
        this.strOnScreenMessage = onFailure.message || strings("generalWebServiceError")
        this.strOnScreenSubtitle = ""
        this.setState({ isLoading: false })

    }

    onSectionHeaderPress = key => {
        let test = this.state.questionIndex
        if (test.includes(key))
            test = test.filter(data => data !== key)
        else
            test.push(key)
        this.setState({ questionIndex: test })
        this.forceUpdate()

    }
    // Render FAQs header

    renderFAQHeader = (item, index) => {
        return (<TouchableOpacity
            activeOpacity={1}
            onPress={() => this.onSectionHeaderPress(index)}
        >
            <EDRTLView style={[style.sectionHeader, {
                // backgroundColor: this.state.questionIndex == index ? EDColors.primary : EDColors.white
            }]}>
                <EDRTLText title={item.question} style={[style.sectionTitle, {
                    flex: 1
                    // color: this.state.questionIndex == index ? EDColors.white : EDColors.primary
                }]} />
                <Icon name={this.state.questionIndex.includes(index) ? "remove" : "add"}
                    color={EDColors.primary}
                />
            </EDRTLView>
        </TouchableOpacity>
        )
    }

    // Render FAQs header

    renderData = (item, index) => {
        return (<View>
            {this.renderFAQHeader(item, index)}
            {this.state.questionIndex.includes(index) ?
                <View style={style.sectionBody}>
                    {/* <Hyperlink
                        onPress={this.handleHyperlink}
                        // linkDefault
                        linkStyle={{ color: EDColors.primary }}
                    >
                        <Text style={style.answer} >{item.answer}</Text>
                    </Hyperlink> */}

                    <Autolink
                        // Required: the text to parse for links
                        text={h2p(item.answer)}
                        // Optional: enable email linking
                        email
                        // Optional: enable hashtag linking to instagram

                        mention="twitter"
                        // Optional: enable phone linking
                        phone="sms"
                        // Optional: enable URL linking
                        url
                        onPress={this.handleAutolink}
                        textProps={{
                            style: style.answer
                        }}
                        linkStyle={{ color: EDColors.primary }}


                    />

                </View> : null}
        </View>

        )
    }

    handleHyperlink = url => {
        if (url.slice(0, 4) === 'http') {
            Linking.openURL(url);
            return false;
        } else if (url.slice(0, 3) === 'tel') {
            const callNumber = url.slice(-10);
            Linking.openURL(`tel://${callNumber}`);
            return false;
        } else if (url.startsWith('mailto:')) {
            Linking.openURL(url);
            return false;
        }
    }


    handleAutolink = (url, match) => {

        debugLog("LINK TYPE ::::::", match.getType())
        switch (match.getType()) {
            case 'url':
                {
                    Linking.openURL(url);
                    break;
                }
            case 'phone':
                {
                    try {
                        Linking.openURL(`tel://${url.slice(4)}`);
                    }
                    catch {

                    }
                    break;

                }
            default:
                Linking.openURL(url);
        }
    }

    onTabPress = (index) => {
        this.scrollView.scrollToIndex({
            index: index,
            animated: true,
        });
        // this.scrollView.snapToItem(index)
        this.setState({ selectedSection: index, questionIndex: [0] })
    }

    renderTab = () => {
        return (
            <View>
                <FlatList
                    style={{
                        flexGrow: 0
                    }}
                    inverted={isRTLCheck()}
                    data={this.arrayFAQs}
                    ref={ref => this.tabRef = ref}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => {
                        return (
                            // <EDThemeButton
                            //     label={item.title}
                            //     style={[
                            //         style.categoryButton,
                            //         {
                            //             height: undefined,
                            //             width: undefined,
                            //             backgroundColor: this.state.selectedSection == index ? EDColors.primary : EDColors.white,
                            //             borderColor: this.state.selectedSection == index ? EDColors.primary : EDColors.separatorColorNew

                            //         }]}
                            //     textStyle={[
                            //         style.categoryButtonTitle,
                            //         {
                            //             color: this.state.selectedSection == index ? EDColors.white : EDColors.blackSecondary,
                            //         }]}
                            //     onPress={() => this.onTabPress(index)}
                            // />
                            <TouchableOpacity style={[style.categoryButton, {
                                backgroundColor: this.state.selectedSection == index ? EDColors.primary : EDColors.white,
                                borderColor: this.state.selectedSection == index ? EDColors.primary : EDColors.separatorColorNew,
                                paddingVertical: 15,
                                paddingHorizontal: 20

                            }]}
                                onPress={() => this.onTabPress(index)}
                            >
                                <EDRTLText title={item.title} style={[style.categoryButtonTitle,
                                {
                                    color: this.state.selectedSection == index ? EDColors.white : EDColors.blackSecondary,
                                }]} />

                            </TouchableOpacity>
                        )
                    }}
                />
            </View>
        )
    }

    renderContent = (data) => {
        return (<View style={style.mainView}>
            <FlatList
                data={data.data}
                renderItem={({ item, index }) => this.renderData(item, index)}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl
                        refreshing={this.refreshing || false}
                        titleColor={EDColors.textAccount}
                        title={strings("refreshing")}
                        tintColor={EDColors.textAccount}
                        colors={[EDColors.textAccount]}
                        onRefresh={this.onPullToRefreshHandler}
                    />
                }
                showsVerticalScrollIndicator={false}
            />

        </View>)
    }


    //#region 



    onMomentumScrollEnd = index => {
        this.setState({ selectedSection: index, questionIndex: [0] })
        this.tabRef.scrollToIndex({
            animated: true,
            index: index,
            viewPosition: 1
        })
    }

    onViewableItemsChanged = ({ viewableItems }) => {
        this.setState({ selectedSection: viewableItems[0].index, questionIndex: [0] })
        this.tabRef.scrollToIndex({
            animated: true,
            index: viewableItems[0].index,
            viewPosition: 1
        })
    }

    // RENDER METHOD
    render() {
        return (<BaseContainer
            title={strings('faqs')}
            left={'menu'}
            right={[]}
            onLeft={this.onDrawerOpen}
            onConnectionChangeHandler={this.networkConnectivityStatus}
            loading={this.state.isLoading}
            baseStyle={{ backgroundColor: EDColors.offWhite }}
        >
            <NavigationEvents onWillFocus={this.onWillFocusHandler} />

            {this.arrayFAQs !== undefined && this.arrayFAQs !== null && this.arrayFAQs instanceof Array && this.arrayFAQs.length !== 0 ?
                <View
                    style={{ paddingTop: 10 }}
                >
                    {this.renderTab()}
                    {/* <Carousel
                        inverted={isRTLCheck()}
                        ref={(c) => { this.scrollView = c; }}
                        data={this.arrayFAQs}
                        renderItem={({ item, index }) => this.renderContent(item)}
                        sliderWidth={metrics.screenWidth}
                        itemWidth={metrics.screenWidth}
                        onSnapToItem={this.onMomentumScrollEnd}
                        lockScrollWhileSnapping={true}
                        pagingEnabled={true}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.refreshing || false}
                                titleColor={EDColors.textAccount}
                                title={strings("refreshing")}
                                tintColor={EDColors.textAccount}
                                colors={[EDColors.textAccount]}
                                onRefresh={this.onPullToRefreshHandler}
                            />
                        }
                    /> */}

                    <FlatList
                        inverted={isRTLCheck()}
                        ref={(c) => { this.scrollView = c; }}
                        data={this.arrayFAQs}
                        renderItem={({ item, index }) => this.renderContent(item)}

                        onViewableItemsChanged={this.onViewableItemsChanged}
                        viewabilityConfig={{
                            itemVisiblePercentThreshold: 50
                        }}
                        showsHorizontalScrollIndicator={false}
                        horizontal
                        pagingEnabled={true}

                    />


                </View>
                : (this.strOnScreenMessage || '').trim().length > 0 ? (
                    <ScrollView contentContainerStyle={{ flex: 1 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={this.refreshing || false}
                                titleColor={EDColors.textAccount}
                                title={strings("refreshing")}
                                tintColor={EDColors.textAccount}
                                colors={[EDColors.textAccount]}
                                onRefresh={this.onPullToRefreshHandler}
                            />
                        }
                    >
                        <EDPlaceholderComponent
                            title={this.strOnScreenMessage}
                            subTitle={this.strOnScreenSubtitle}
                        />
                    </ScrollView>
                ) : null

            }

        </BaseContainer>
        );
    }
    //#endregion




}

export default connect(
    state => {
        return {
            userID: state.userOperations.userIdInRedux,
            token: state.userOperations.phoneNumberInRedux,
            lan: state.userOperations.lan
        };
    },
    dispatch => {
        return {
            saveNavigationSelection: dataToSave => {
                dispatch(saveNavigationSelection(dataToSave));
            }
        };
    }
)(FAQsContainer);

export const style = StyleSheet.create({
    mainView: {
        width: metrics.screenWidth,
        padding: 10,
        marginBottom: 10,
        // flex: 1

    },
    categoryButton: {
        // padding: 20,
        marginHorizontal: 10,
        borderRadius: 8,
        marginTop: 5,
        marginVertical: 5,
        borderWidth: 2

    },
    sectionHeader: {
        // backgroundColor: EDColors.white,
        // borderRadius: 8,
        paddingHorizontal: 10,
        alignItems: "center",
        borderColor: EDColors.separatorColorNew,
        marginBottom: 5,
        justifyContent: "space-between",
        // flex: 1,
    },
    sectionBody: {
        // backgroundColor: EDColors.white,
        paddingTop: 0,
        padding: 10,
        marginBottom: 10
    },
    categoryButtonTitle: {
        color: EDColors.black,
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(16),
    },
    sectionTitle: {
        color: EDColors.black,
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(15),
        paddingVertical: 0,
        marginVertical: 10
    },
    question: {
        color: EDColors.black,
        fontFamily: EDFonts.semiBold,
        fontSize: getProportionalFontSize(15),
        marginBottom: 10
    },
    answer: {
        color: EDColors.text,
        fontFamily: EDFonts.regular,
        fontSize: getProportionalFontSize(14),
    },

});



