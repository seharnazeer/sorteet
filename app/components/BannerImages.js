/* eslint-disable prettier/prettier */
import React from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import Carousel from "react-native-banner-carousel";
import Assets from "../assets";
import { default as Metrics, default as metrics } from "../utils/metrics";
import EDImage from "./EDImage";
import Video from 'react-native-video';
import { URL } from 'react-native-url-polyfill';
import { set } from "react-native-reanimated";
const BannerHeight = 190;

// Function to check if a URL is a video URL
const isVideoURL = (url) => {
  const parsedUrl = new URL(url);
  const fileExtension = parsedUrl.pathname.split('.').pop();

  // List of common video file extensions
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];

  // Check if the file extension is in the list of video extensions
  return videoExtensions.includes(fileExtension.toLowerCase());
};

export default class BannerImages extends React.PureComponent {
  /** CONSTRUCTOR */
  constructor(props) {
    super(props);
    this.currentSliderIndex = 0;
    this.state = {
      videoDuration: 0,
    };
    console.log("duration:",this.state.videoDuration)
  
  }
  
  // componentDidMount(){
  //   setTimeout(()=>{
  //     console.log("hello")
  //     this.onPageChanged(this.currentSliderIndex+1); 
  //   },1000)
  // };

  
  onPageChanged = (currentIndex) => {
    console.log("helloooo")
    this.currentSliderIndex = currentIndex;
  };

  onImageSelectionHandler = () => {
    console.log('a')
    if (this.props.onImageSelectionHandler !== undefined) {
      this.props.onImageSelectionHandler(this.currentSliderIndex);
    }
  };

  handleOnLoad = (data) => {
    const duration = data.duration * 1000; // Convert duration to milliseconds
    this.setState({ videoDuration: duration });
  };

  renderImage(image, index) {
    console.log(image,index);
    return (
      <View key={index}>
        <EDImage
          style={{ width: Metrics.screenWidth, height: BannerHeight }}
          source={image.image}
          placeholder={Assets.header_placeholder}
          placeholderResizeMode={index == 0 ? "contain" : "cover"}
          resizeMode={index == 0 ? "contain" : "cover"}
        />
      </View>
    );
  }


  videos = [
    {
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },

    {
      url: 'https://fastly.picsum.photos/id/102/4320/3240.jpg?hmac=ico2KysoswVG8E8r550V_afIWN963F6ygTVrqHeHeRc',
    },
    {
      url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    },
    {
      url: 'https://fastly.picsum.photos/id/476/200/300.jpg?grayscale&hmac=rdN4pV7JFAtH4ZU68rquanFotYqni0n_KK5r1xHH_ZM',
    },
    {
      url: 'https://fastly.picsum.photos/id/870/200/300.jpg?blur=2&grayscale&hmac=ujRymp644uYVjdKJM7kyLDSsrqNSMVRPnGU99cKl6Vs',
    },
  ];

 renderVideoItem (image, index) {
    return (
      <View style={{flex:1}} key={index}>
        
        {
         image.image !== undefined && image.image !== "" && isVideoURL(image.image) === true ? <>
          <Video
          source={{ uri: image.image }}
          style={{ width: Metrics.screenWidth, height: BannerHeight}}
          controls={false}
          repeat={true}
          resizeMode={'cover'}
          onLoad={this.handleOnLoad}
          muted
        />
          </> : <>

          <EDImage
          style={{ width: Metrics.screenWidth, height: BannerHeight }}
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
      <View>
        {this.props.images !== undefined && this.props.images.length > 0 ? (
          <Carousel
            autoplay={true}
            autoplayTimeout={8000}
            loop
            showsPageIndicator={false}
            index={1}
            pageSize={Metrics.screenWidth}
          >
            {
              this.props.images.map((image, index) =>
              this.renderVideoItem(image,index)
            )
            }
            {/* {this.props.images.map((image, index) =>
              this.renderImage(image, index)
            )} */}
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
    width: metrics.screenWidth,
    height: BannerHeight,
  },
});
