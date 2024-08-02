/* eslint-disable prettier/prettier */
import React from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Carousel from "react-native-banner-carousel";
import Assets from "../assets";
import { default as Metrics, default as metrics } from "../utils/metrics";
import EDImage from "./EDImage";
import Video from 'react-native-video';
import { URL } from 'react-native-url-polyfill';
const BannerHeight = 450;

// Function to check if a URL is a video URL
const isVideoURL = (url) => {
  const parsedUrl = new URL(url);
  const fileExtension = parsedUrl.pathname.split('.').pop();

  // List of common video file extensions
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];

  // Check if the file extension is in the list of video extensions
  return videoExtensions.includes(fileExtension.toLowerCase());
};

export default class BookingBannerImage extends React.PureComponent {
  /** CONSTRUCTOR */
  constructor(props) {
    super(props);
    this.currentSliderIndex = 0;
    this.state = {
      videoDuration: 0,
    };
    console.log("duration:",this.state.videoDuration)
  }

  
  onPageChanged = (currentIndex) => {
    this.currentSliderIndex = currentIndex;
  };

  onImageSelectionHandler = () => {
    if (this.props.onImageSelectionHandler !== undefined) {
      this.props.onImageSelectionHandler(this.currentSliderIndex);
    }
  };

  handleOnLoad = (data) => {
    const duration = data.duration * 1000; // Convert duration to milliseconds
    this.setState({ videoDuration: duration });
  };


 renderVideoItem (image, index) {
    return (
      <View style={{flex:1,}} key={index}>
        
        {
         image.image !== undefined && image.image !== "" && isVideoURL(image.image) === true ? <>
          <Video
          source={{ uri: image.image }}
          style={{ width: Metrics.screenWidth - 30, height: BannerHeight, borderRadius:8}}
          controls={false}
          repeat={true}
          resizeMode={'cover'}
          onLoad={this.handleOnLoad}
          muted
        />
          </> : <>

          <EDImage
          style={{ width: Metrics.screenWidth - 30, height: BannerHeight, borderRadius:8 }}
          source={image.image}
          placeholder={Assets.header_placeholder}
          placeholderResizeMode={index == 0 ? "contain" : "cover"}
          resizeMode={index == 0 ? "contain" : "cover"}
        />

          </>
        }
      </View>
    );
  };

  render() {
    return (
      <View style={style.container}>
        {this.props.images !== undefined && this.props.images.length > 0 ? (
          <Carousel
            autoplay={true}
            autoplayTimeout={this.state.videoDuration == 0 ? 5000 : this.state.videoDuration}
            loop
            showsPageIndicator={false}
            index={1}
            pageSize={Metrics.screenWidth - 30}
          >
            {
              this.props.images.map((image, index) =>
              this.renderVideoItem(image,index)
            )
            }
          </Carousel>
        ) : (
          <Image
            source={Assets.header_placeholder}
            style={style.imageStyle}
            resizeMode={"contain"}
          />
        )}
      </View>
    );
  }
}

//#region STYLES
const style = StyleSheet.create({
  imageStyle: {
    alignItems: "center",
    width: metrics.screenWidth - 30,
    height: BannerHeight,
  },
  container: {
    flex: 1,
    width:metrics.screenWidth - 30,
    borderRadius:8,
    elevation:4,
    shadowOpacity:0.3,
    alignSelf:'center',
  },
});
