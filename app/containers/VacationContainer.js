//import liraries
import React, { Component } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from "react-native-webview";
import BaseContainer from './BaseContainer';
import { strings } from "../locales/i18n";

// create a component
const VacationContainer = (props) => {

  const onMenuPressed = () => {
    props.navigation.openDrawer();
  };

  return (
    <View style={{ flex: 1 }}>
      <BaseContainer
        title={strings("vacation")}
        left={"menu"}
        onLeft={onMenuPressed}
      // loading={isLoading}
      >

        <WebView
          source={{ uri: 'https://be.synxis.com/?adult=1&arrive=2024-05-21&chain=31493&child=0&config=EKO&depart=2024-05-22&level=chain&locale=en-US&rooms=1&theme=EKO' }} // Specify the web page you want to load
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
export default VacationContainer;
