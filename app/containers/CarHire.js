//import liraries
import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from "react-native-webview";
import BaseContainer from './BaseContainer';
import { strings } from "../locales/i18n";

// create a component
const CarContainer = (props) => {

  const onMenuPressed = () => {
    props.navigation.openDrawer();
  };

  return (
    <View style={{ flex: 1 }}>
      <BaseContainer
        title={"Car Hire"}
        left={"menu"}
        onLeft={onMenuPressed}
      // loading={isLoading}
      >

        <WebView
          source={{ uri: 'https://rentals.sorteet.com' }} // Specify the web page you want to load
          javaScriptEnabled={true}
        />

      </BaseContainer>

    </View>
  );
};

// define your styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
});

//make this component available to the app
export default CarContainer;
