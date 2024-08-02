// /* eslint-disable react/no-string-refs */
// /* eslint-disable react-native/no-inline-styles */
// /* eslint-disable prettier/prettier */
// import React from 'react';
// import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { Icon } from 'react-native-elements';
// import EDRTLView from '../components/EDRTLView';
// import { strings } from '../locales/i18n';
// import { EDColors } from '../utils/EDColors';
// import { getProportionalFontSize } from "../utils/EDConstants";
// import { EDFonts } from '../utils/EDFontConstants';
// import Validations from '../utils/Validations';
// import EDCustomRadioComponent from './EDCustomRadioComponent';
// import FilterRadioComponent from './FilterRadioComponent';

// export default class EDLanguageSelect extends React.Component {
//     //#region LIFE CYCLE METHODS
//     constructor(props) {
//         super(props)
//         this.validationsHelper = new Validations();
//     }

//     state = {
//         isLoading: false,
//         selectLanguage:
//         this.props.languages !== undefined &&
//             this.props.languages !== null &&
//             this.props.languages.length !== 0 ?
//             this.props.languages.map(data => data.language_slug).indexOf(this.props.lan) : -1
//     }

//     render() {
//         return (
//             <View style={styles.modalContainer} pointerEvents={this.state.isLoading ? 'none' : 'auto'}>
//                 <View style={styles.modalSubContainer}>
//                     <EDRTLView style={{ justifyContent: 'space-between' }}>
//                         <Text style={styles.titleTextStyle}>
//                             {this.props.title}
//                         </Text>
//                         <TouchableOpacity onPress={this.props.onDismissHandler} style={{ alignSelf: 'center', }}>
//                             <Icon
//                                 name={"close"}
//                                 size={getProportionalFontSize(20)}
//                                 color={EDColors.grayNew}
//                             />
//                         </TouchableOpacity>
//                     </EDRTLView>

//                     <View style={styles.separator} />
//                     <EDCustomRadioComponent
//                         data={this.props.languages !== undefined ? this.props.languages : this.language}
//                         selectedIndex={this.state.selectLanguage}
//                         keyName={"language_name"}
//                         onSelected={value => { this.onChangeLanguageClick(value); }}

//                     />
//                 </View>
//             </View>
//         );
//     }

//     /**
//  * @param { Option selected for Launguage } language
//  */
//     lanSelectClick = () => {

//     };

//     onChangeLanguageClick = (language) => {
//         if (this.props.languages !== undefined &&
//             this.props.languages !== null &&
//             this.props.languages.length !== 0) {
//             this.props.onChangeLanguageHandler(this.props.languages[this.state.selectLanguage].language_slug)
//         }
//     }
// }

// //#region STYLES
// const styles = StyleSheet.create({
//     modalContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         backgroundColor: 'rgba(0,0,0,0.35)'
//     },
//     modalSubContainer: {
//         backgroundColor: EDColors.white,
//         padding: 20,
//         marginHorizontal: 20,
//         borderRadius: 24,
//         marginTop: 20,
//         marginBottom: 20,
//     },
//     titleTextStyle: { fontFamily: EDFonts.bold, fontSize: getProportionalFontSize(18), margin: 5, color: EDColors.primary },
//     separator: { height: 1, backgroundColor: EDColors.separatorColor, width: "100%", marginVertical: 10 }
// })

/* eslint-disable react/no-string-refs */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import EDRTLView from '../components/EDRTLView';
import { strings } from '../locales/i18n';
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize } from "../utils/EDConstants";
import { EDFonts } from '../utils/EDFontConstants';
import Validations from '../utils/Validations';
import EDButton from './EDButton';
import EDCustomRadioComponent from './EDCustomRadioComponent';

export default class EDLanguageSelect extends React.Component {
    //#region LIFE CYCLE METHODS
    constructor(props) {
        super(props)
        this.validationsHelper = new Validations();


    }

    state = {
        isLoading: false,
        selectLanguage:
            this.props.languages !== undefined &&
                this.props.languages !== null &&
                this.props.languages.length !== 0 ?
                this.props.languages.map(data => data.language_slug).indexOf(this.props.lan) : -1

    }

    onSubmit = () => {
        if (this.props.languages !== undefined &&
            this.props.languages !== null &&
            this.props.languages.length !== 0) {
            this.props.onChangeLanguageHandler(this.props.languages[this.state.selectLanguage].language_slug)
        }
    }

    render() {
        return (
            <View style={styles.modalContainer} pointerEvents={this.state.isLoading ? 'none' : 'auto'}>
                <View style={styles.modalSubContainer}>
                    <EDRTLView style={{ justifyContent: 'space-between' }}>
                        <Text style={styles.titleTextStyle}>
                            {this.props.title}
                        </Text>
                        <TouchableOpacity onPress={this.props.onDismissHandler} style={{ alignSelf: 'center', }}>
                            <Icon
                                name={"close"}
                                size={getProportionalFontSize(20)}
                                color={EDColors.grayNew}
                            />
                        </TouchableOpacity>
                    </EDRTLView>

                    <View style={styles.separator} />
                    <EDCustomRadioComponent
                        data={this.props.languages}
                        selectedIndex={this.state.selectLanguage}
                        keyName={"language_name"}
                        onSelected={value => { this.onChangeLanguageClick(value); }}

                    />
                    <EDButton label={strings("save")} style={{ marginHorizontal: 0, marginTop: 20, paddingVertical: 15 }}
                        onPress={this.onSubmit}
                    />
                </View>
            </View>
        );
    }

    /**
 * @param { Option selected for Launguage } language
 */
    lanSelectClick = () => {

    };

    onChangeLanguageClick = (language) => {
        this.setState({ selectLanguage: language })
    }
}

//#region STYLES
const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)'
    },
    modalSubContainer: {
        backgroundColor: EDColors.white,
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 24,
        marginTop: 20,
        marginBottom: 20,
    },
    titleTextStyle: { fontFamily: EDFonts.bold, fontSize: getProportionalFontSize(18), margin: 5, color: EDColors.primary },
    separator: { height: 1, backgroundColor: EDColors.separatorColor, width: "100%", marginVertical: 10 }
})