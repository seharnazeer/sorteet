import MultiSlider from "@ptomasroos/react-native-multi-slider";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-elements";
import { EDColors } from "../utils/EDColors";
import { debugLog, getProportionalFontSize, isRTLCheck } from "../utils/EDConstants";
import { EDFonts } from "../utils/EDFontConstants";
import metrics from "../utils/metrics";
import EDRTLText from "./EDRTLText";
import EDRTLView from "./EDRTLView";
import SliderText from 'react-native-slider-text';
export default class ETSlider extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            sliderOneValue: this.props.initialValue,
            value: this.props.initialValue,
            valueType: this.props.valueType,
            isShow: true
        };
    }

    handleIsShow = () => {
        this.setState({ isShow: !this.state.isShow })
    }

    render() {
        return (
            <View style={[style.container , this.props.sliderStyle]}>
                <View >
                    <EDRTLView style={{ marginHorizontal: 10, alignSelf: "center", flexDirection: isRTLCheck() ? "row-reverse" : "row", justifyContent: "space-between" }}>
                        <EDRTLText style={style.title} title={this.props.title} />
                        {/* <Icon name = { this.state.isShow ? "expand-less" : "expand-more"} size = {30} onPress = {this.handleIsShow} /> */}
                        {/* <EDRTLText style={style.valuetext} title={this.state.value} />
                        <EDRTLText style={style.valuetext} title={this.state.valueType} /> */}
                    </EDRTLView>
                    <View style={{ borderWidth: 1, borderColor: EDColors.radioSelected, marginHorizontal: 10, marginTop: 25, marginBottom: 0 }} />
                    {this.state.isShow ?
                        <>
                            {/* <EDRTLView style = {{ marginTop : 10, alignSelf : "center" }}>
                        <EDRTLText style={style.valuetext} title={this.state.value} />
                        <EDRTLText style={style.valuetext} title={this.state.valueType} />
                    </EDRTLView> */}

                            {/* <MultiSlider
                        containerStyle={{alignSelf : "center"}}
                        values={this.state.sliderOneValue}
                        sliderLength={metrics.screenWidth - 95}
                        onLayout={event => { this.slider_bound(event); }}
                        selectedStyle={{ backgroundColor: EDColors.primary }}
                        max={this.props.max}
                        min={this.props.min}
                        onValuesChange={values => {
                            let newValues = [0];
                            newValues[0] = values[0];
                            this.props.onSlide(newValues[0]);
                            this.setState({ value: newValues[0] });
                        }}
                        customMarker={() => { return <View style = {{ marginBottom : 50 }} >
                            <EDRTLView style = {{   marginBottom: 25, alignItems : "flex-start", marginRight: 25 }}>
                                <EDRTLText style={style.valuetext} title={this.state.value} />
                                <EDRTLText style={style.valuetext} title={this.state.valueType} />
                            </EDRTLView>
                            <View style={style.marker} />
                        </View>; }}
                        touchDimensions={{ width: metrics.screenWidth - 70 }}
                        snapped
                    />  */}

                            <SliderText
                                containerStyle={[{ alignSelf: "center"  } ]}
                                maximumValue={this.props.max}
                                minimumValue={this.props.min}
                                stepValue={1}
                                maximumTrackTintColor={EDColors.primary}
                                minimumTrackTintColor={EDColors.primary}
                                thumbTintColor={EDColors.primary}
                                onValueChange={(values) => {
                                    this.props.onSlide(values);
                                    this.setState({ value: values });
                                }
                                }
                                width={metrics.screenWidth * .75}
                                sliderValue={Math.floor(this.state.value) || 0}
                                value={Math.floor(this.state.value) || 0}
                                isRTL={isRTLCheck()}
                                sliderType={this.state.valueType}
                                customCountStyle={style.valuetext}
                                renderCustomLabel={() => {
                                    return <EDRTLText style={[style.valuetext, isRTLCheck() ? { marginLeft: 30  } : { marginRight: 30 }]} title={this.state.value +" "+ this.state.valueType} />
                                }}
                            />
                        </>
                        : null}
                </View>
            </View>
        );
    }
}

export const style = StyleSheet.create({
    container: {
        borderRadius: 6,
        // shadowColor: "#000",
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.8,
        // shadowRadius: 2,
        // elevation: 2,
        padding: 10,
        backgroundColor: "#fff",
        margin: 10,
        flex:1,
    },
    title: {
        flex: 1,
        fontFamily: EDFonts.semiBold,
        color: "#000",
        fontSize: getProportionalFontSize(16),
    },
    marker: {
        borderRadius: 15,
        width: 15,
        height: 15,
        alignSelf: "center",
        backgroundColor: EDColors.primary
    },
    valuetext: { fontFamily: EDFonts.semiBold, color: "#000", fontSize: getProportionalFontSize(11), }
});
