import { Spinner } from "native-base";
import React from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";
import AutoHeightWebView from 'react-native-autoheight-webview';
import { connect } from "react-redux";
import EDPlaceholderComponent from "../components/EDPlaceholderComponent";
import EDPopupView from "../components/EDPopupView";
import { EDReportError } from "../components/EDReportError";
import ProgressLoader from "../components/ProgressLoader";
import { strings } from "../locales/i18n";
import { showNoInternetAlert, showValidationAlert } from "../utils/EDAlert";
import { EDColors } from "../utils/EDColors";
import { getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { netStatus } from "../utils/NetworkStatusConnection";
import { reportErrorAPI } from "../utils/ServiceManager";
import BaseContainer from "./BaseContainer";

class AboutStoreContainer extends React.Component {


    //#region  LIFE CYCLE METHODS

    constructor(props) {
        super(props);
        this.resDetail = this.props.navigation.state.params != undefined &&
            this.props.navigation.state.params.htmlData != undefined
            ? this.props.navigation.state.params.htmlData : undefined;

        this.fontSize = Platform.OS == "ios" ? "18px" : "18px";
        this.meta = `
        <html `+ (isRTLCheck() ? "dir=rtl" : "dir=ltr") + `><head><meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"></head>`;
        this.customStyle =
            this.meta +
            "<style>* {max-width: 100%;} body { font-size:" +
            this.fontSize +
            ";}</style>";
        this.endTag = "</html>"
    }


    state = {
        reportModal: false,
        isLoading: false
    }

    dismissReport = () => {
        this.setState({ reportModal: false })
    }

    showReportModal = () => {
        this.setState({ reportModal: true })
    }

    renderErrorReport = () => {
        return <EDPopupView isModalVisible={this.state.reportModal}
            shouldDismissModalOnBackButton={true}
            onRequestClose={this.dismissReport}
        >
            <EDReportError onDismiss={this.dismissReport} onSubmit={this.onSubmitReport} />
        </EDPopupView>
    }

    onSubmitReport = (topic = [], email, message) => {
        this.dismissReport()
        netStatus(status => {
            if (status) {
                this.setState({ isLoading: true })
                let errorParams = {
                    language_slug: this.props.lan,
                    report_topic: topic.join(),
                    email: email,
                    message: message
                }
                reportErrorAPI(errorParams, this.onSuccessReport, this.onFailureReport, this.props)
            }
            else
                showNoInternetAlert()
        })
    }

    onSuccessReport = (onSuccess) => {
        this.setState({ isLoading: false })
        showValidationAlert(onSuccess.message)
    }

    onFailureReport = (onFailure) => {
        this.setState({ isLoading: false })
        showValidationAlert(onFailure.message)
    }

    // RENDER METHOD
    render() {

        var title =
            this.props.navigation.state.params != undefined &&
                this.props.navigation.state.params.resName != undefined
                ? this.props.navigation.state.params.resName
                : strings("about");
        return (
            <BaseContainer
                title={title}
                left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
                onLeft={this.onBackEventHandler}
                right={[{ url: "report", name: "report", type: "octicon", size: getProportionalFontSize(25) }]}
                onRight={this.showReportModal}
                loading={this.state.isLoading}

            >
                {this.renderErrorReport()}

                <View
                    style={style.mainContainer}>

                    {this.resDetail != undefined &&
                        this.resDetail != null &&
                        this.resDetail.trim().length != 0
                        ?
                        <AutoHeightWebView
                            source={{ html: this.customStyle + this.resDetail + this.endTag }}
                            startInLoadingState={true}
                            style={style.webViewStyle}
                            scrollEnabled={false}
                            renderLoading={() => { return (<ProgressLoader />) }}
                            originWhitelist={['http://*', 'https://*', 'intent://*', '*']}
                            onShouldStartLoadWithRequest={event => {
                                if (event.url.slice(0, 4) === 'http') {
                                    Linking.openURL(event.url);
                                    return false;
                                } else if (event.url.slice(0, 3) === 'tel') {
                                    const callNumber = event.url.slice(-10);
                                    Linking.openURL(`tel://${callNumber}`);
                                    return false;
                                } else if (event.url.startsWith('mailto:')) {
                                    this.openEmail(event);
                                    return false;
                                }
                                return true;
                            }}
                        />
                        :
                        <EDPlaceholderComponent title={strings("noDataFound")} />

                    }

                </View>
            </BaseContainer>
        );
    }
    //#endregion

    //#region 
    /** ON LEFT PRESSED */
    onBackEventHandler = () => {
        this.props.navigation.goBack()
    }
    //R.K 07-01-2021 Open email
    openEmail = email => {
        Linking.openURL(email.url).catch(er => {
            Alert.alert('Failed to open Link: ' + er.message);
        });
    };
    //#endregion

}

export default connect(
    state => {
        return {
            lan: state.userOperations.lan,
        };
    },
    dispatch => {
        return {

        };
    }
)(AboutStoreContainer);

//#region  STYLES
export const style = StyleSheet.create({
    webViewStyle: {
        backgroundColor: "transparent",
        margin: 5,
        width: '95%',
    },
    mainContainer: {
        flex: 1,
        backgroundColor: EDColors.white,
    },
});
//#endregion
