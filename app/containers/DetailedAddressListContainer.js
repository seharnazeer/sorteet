import React from 'react';
import { FlatList, Linking, Platform, StyleSheet, Text, View, TouchableOpacity, BackHandler } from 'react-native';
import { RadioButton, RadioGroup } from 'react-native-flexi-radio-button';
import { PERMISSIONS } from 'react-native-permissions';
import { NavigationEvents } from 'react-navigation';
import { connect } from 'react-redux';
import AddressComponent from '../components/AddressComponent';
import EDPlaceholderComponent from '../components/EDPlaceholderComponent';
import EDRTLText from '../components/EDRTLText';
import EDRTLView from '../components/EDRTLView';
import EDThemeButton from '../components/EDThemeButton';
import { strings } from '../locales/i18n';
import { saveCheckoutDetails } from '../redux/actions/Checkout';
import { showDialogue, showNoInternetAlert, showValidationAlert } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { debugLog, getProportionalFontSize, isRTLCheck, RESPONSE_SUCCESS, PAYMENT_TYPES } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import { checkPermission } from '../utils/PermissionServices';
import metrics from '../utils/metrics';
import { netStatus } from '../utils/NetworkStatusConnection';
import { checkOrder, deleteAddress, getAddress, addAddress, getAddressListAPI } from '../utils/ServiceManager';
import BaseContainer from './BaseContainer';
import { Icon } from 'react-native-elements';
import Assets from '../assets';


class DetailedAddressListContainer extends React.PureComponent {
	//#region LIFE CYCLE METHODS

	constructor(props) {
		super(props);

		this.strOnScreenMessage = '';
		this.strOnScreenSubtitle = '';
		this.state = {
			isLoading: false,
			isAsyncSync: false,
			cartData: '',
			addressLine1: '',
			addressLine2: '',
			value: 0,
			latitude: 0.0,
			longitude: 0.0,
			city: '',
			zipCode: '',
			addressId: '',
			isSelectAddress: this.props.navigation.state.params.isSelectAddress || false,
			setSelectedAddress: this.props.navigation.state.params.setSelectedAddress,
			selectedAddress: this.props.navigation.state.params.selectedAddress,
			selectedIndex: 0,
			cash: false
		};
		this.checkoutData = this.props.checkoutDetail;
		this.address_deleted = false

	}

	//#region


	componentDidMount = () => {

		this.backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
			this.onBackEventHandler();
			return true;
		})
	}

	componentWillUnmount = () => {
		if (this.backHandler)
			this.backHandler.remove()
	}

	/** RENDER METHOD */
	render() {
		return (
			<BaseContainer
				title={strings('myAddress')}
				left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
				right={[]}
				onLeft={this.onBackEventHandler}
				loading={this.state.isLoading}
				onConnectionChangeHandler={this.getAddressList}
			>
				{/* MAIN VIEW */}
				<View pointerEvents={this.state.isLoading ? 'none' : 'auto'} style={{ flex: 1, backgroundColor: EDColors.white }}>
					<NavigationEvents onWillFocus={this.getAddressList} />

					{/* ADD ADDRESS */}
					<EDRTLView style={style.addView}>
						<TouchableOpacity onPress={this.onAddAddressEventHandler} style={[style.addButtonStyle, { flexDirection: isRTLCheck() ? "row-reverse" : "row" }]} >
							<Icon name="add" size={getProportionalFontSize(26)} style={style.addIconStyle} color={EDColors.blackSecondary} />
							<EDRTLText title={strings('addNewAddress')} style={style.titleText} />
						</TouchableOpacity>
					</EDRTLView>

					{/* ADDRESS LIST */}
					{this.arrayAddress != undefined && this.arrayAddress != null && this.arrayAddress.length > 0
						?
						<FlatList
							data={this.arrayAddress}
							extraData={this.state}
							showsVerticalScrollIndicator={true} //R.K 07-01-2021
							ref="flatList"
							keyExtractor={(item, index) => item + index}
							renderItem={this.renderAddressList}
							contentContainerStyle={{ paddingHorizontal: 15, marginTop: 5, paddingBottom: 10 }}
							ItemSeparatorComponent={
								() => {
									return <View style={{ width: "100%", height: 1, backgroundColor: EDColors.separatorColorNew, marginVertical: 0 }} />

								}
							}
						/>
						:
						this.strOnScreenMessage.trim().length > 0
							? <View style={{ flex: 1 }}>
								<EDPlaceholderComponent
									title={this.strOnScreenMessage}
									subTitle={this.strOnScreenSubtitle}
									placeholderIcon={Assets.logo}
								/>
							</View>
							: <View />
					}
				</View>
				{/* IF SELECT ADDRESS */}
				{
					!this.state.isSelectAddress &&
						this.arrayAddress != undefined && this.arrayAddress != null && this.arrayAddress.length > 0 &&
						this.state.selectedIndex !== -1 &&
						this.arrayAddress[this.state.selectedIndex].is_main !== "1"

						?
						<View>

							<View style={style.continueStyle}>
								<EDThemeButton
									isLoading={this.state.isLoading}
									style={style.contButtonStyle}
									onPress={this.onContinueEventHandler}
									label={strings('setAsDefault')}
									textStyle={style.orderText}
								/>
							</View>
						</View>
						: null}
			</BaseContainer>
		);
	}
	//#endregion

	//#region
	/** BACK EVENT HANDLER */
	onBackEventHandler = () => {
		if (this.state.isSelectAddress && this.address_deleted)
			if (this.state.setSelectedAddress !== undefined) {
				this.state.setSelectedAddress(this.arrayAddress !== undefined && this.arrayAddress !== null && this.arrayAddress.length !== 0 ? this.arrayAddress[0] : undefined);
				this.props.navigation.goBack()
			}
			else
				this.props.navigation.goBack();
		else
			this.props.navigation.goBack();
	};
	//#endregion

	//#region
	/** GET DATA */
	getData = () => {
		this.getAddressList();
	};
	//#endregion

	//#region
	/** INDEX SELECTION */
	onSelectedIndex = value => {
		debugLog('SELECTED VALUE ::::::::: ', value);
		this.setState({ value: value });
	};
	//#endregion


	/** CALL API  */
	saveAddress(selectedAddress) {
		netStatus(status => {
			if (status) {

				this.setState({ isLoading: true });
				let param = {
					language_slug: this.props.lan,
					address: selectedAddress.address,
					landmark: selectedAddress.landmark,
					latitude: selectedAddress.latitude,
					longitude: selectedAddress.longitude,
					city: selectedAddress.city,
					zipcode: selectedAddress.zipcode,
					is_main: "1",
					user_id: this.props.userID,
					// token: this.props.token,
					address_id: selectedAddress.address_id,
					address_label: selectedAddress.address_label,

				};
				addAddress(param, this.onSuccessSaveAddress, this.onFailureSaveAddress, this.props);

			} else {
				showValidationAlert(strings('noInternet'));
			}
		});
	}

	/**
 * @param { Success Response object } onSuccess
 */
	onSuccessSaveAddress = onSuccess => {
		if (onSuccess != undefined) {
			if (onSuccess.status == RESPONSE_SUCCESS) {
				this.props.navigation.goBack();
			} else {
				showValidationAlert(onSuccess.message);
				this.setState({ isLoading: false });
			}
		} else {
			showValidationAlert(strings('generalWebServiceError'));
			this.setState({ isLoading: false });
		}
	};

	/**
	 * @param { FAiure response Object } onFailure
	 */
	onFailureSaveAddress = onFailure => {
		this.setState({ isLoading: false });
		showValidationAlert(strings('generalWebServiceError'));
	};

	//#endregion

	//#region
	/** CONTINUE EVENT HANDLER */
	onContinueEventHandler = () => {
		this.saveAddress(this.arrayAddress[this.state.selectedIndex])
	};
	//#endregion

	//#region ADD ADDRESS
	onAddAddressEventHandler = () => {
		this.navigateTomap('', 1);
	};
	//#endregion

	//#region
	/** on EDIT PRESS */

	navigateTomap = (item, index) => {
		console.log("value::", index)
		netStatus(isConnected => {
			if (isConnected) {
				var paramPermission =
					Platform.OS === 'ios'
						? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
						: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
				checkPermission(
					paramPermission,
					() => {
						switch (index) {
							case 1:
								this.props.navigation.navigate('AddressMapContainer', {
									getData: this.getData,
									totalCount: this.arrayAddress.length,
									isEdit: index

								});
							case 2:
								var sendData = {
									addressId: item.address_id,
									addressLine1: item.address_label,
									addressLine2: item.address,
									latitude: item.latitude,
									longitude: item.longitude,
									city: item.city,
									zipCode: item.zipcode,
									is_main: item.is_main,
									address_label: item.landmark,
									business: item.business,
									state: item.state,
									country: item.country
								};
								this.props.navigation.navigate('AddressMapContainer', {
									getDataAll: sendData,
									getData: this.getData,
									totalCount: this.arrayAddress.length,
									isEdit: index

								});
								break;
						}
					},
					() => {
						showDialogue(
							strings('locationPermission'),
							[{ text: strings('dialogCancel'), isNotPreferred: true }],
							'',
							() => {
								if (Platform.OS == "ios")
									Linking.openURL('app-settings:');
								else
									Linking.openSettings();
							}
						);
					}
				);
			} else {
				showNoInternetAlert();
			}
		});
	};

	//#region
	/** ADDRESS ID EVENT HANDLER */
	onDeleteAddressEventHandler = (address_id, is_default) => {
		showDialogue(
			strings('deleteAddressConfirm'),
			[
				{
					text: strings('dialogCancel'),
					isNotPreferred: true
				},
			],
			'',
			() => this.deleteAddress(address_id, is_default)
		);
	};
	//#endregion

	//#region
	/** CREATE ADDRESS LIST */
	renderAddressList = ({ item, index }) => {
		return (
			<AddressComponent
				data={item}
				index={index}
				isSelected={this.state.selectedIndex === index ? true : false}
				onPress={this.addressSelectionAction}
				deleteAddress={this.onDeleteAddressEventHandler}
				editAddress={this.navigateTomap}
			/>
		);
	};
	//#endregion

	//#region CHECK ORDER
	/**
	 * @param { Success Response Object } onSuccess
	 */
	onSucessCheckOrder = onSuccess => {
		debugLog('CHECK API SUCCESS ::::::: ', onSuccess);
		if (onSuccess.status === 0) {
			this.setState({ isLoading: false });
			showDialogue(onSuccess.message, [], '');
		} else {
			this.props.navigation.navigate('CheckOutContainer', {
				delivery_status: this.state.value === 1 ? 'Delivery' : 'PickUp',
				latitude: this.arrayAddress[this.state.selectedIndex].latitude,
				longitude: this.arrayAddress[this.state.selectedIndex].longitude,
				address_id: this.arrayAddress[this.state.selectedIndex].address_id,
			});
		}
	};

	/**
	 * @param { Failure Response Object } onFailure
	 */
	onFailureCheckOrder = onfailure => {
		debugLog('CHECK API FAILURE ::::::: ', onfailure);
		this.setState({ isLoading: false });
	};

	/** CALL API FOR CHECK ORDER */
	checkOrderAPI = () => {
		let param = {
			language_slug: this.props.lan,
			// token: this.props.token,
			user_id: this.props.userID,
			order_delivery: 'Delivery',
			users_latitude: this.arrayAddress[this.state.selectedIndex].latitude,
			users_longitude: this.arrayAddress[this.state.selectedIndex].longitude,
			restaurant_id: this.props.navigation.state.params.resId,
		};
		this.setState({ isLoading: true });
		netStatus(status => {
			if (status) {
				checkOrder(param, this.onSucessCheckOrder, this.onFailureCheckOrder, this.props);
			} else {
				this.setState({ isLoading: false });
				this.strOnScreenMessage = strings('noInternetTitle');
			}
		});
	};
	//#endregion

	//#region LOAD ADDRESS
	/**
	 * @param { Success Response Object } onSuccess
	 */
	onSuccessLoadAddress = onSuccess => {
		console.log('[]][][][]]]][][][][ LOAD ADDRESS SUCCCESS', onSuccess);
		this.strOnScreenMessage = '';

		if (onSuccess != undefined) {
			if (onSuccess.status == RESPONSE_SUCCESS) {
				if (onSuccess.address !== undefined && onSuccess.address.length > 0) {
					this.arrayAddress = onSuccess.address
					if (this.state.isSelectAddress && this.state.selectedAddress !== undefined && this.state.selectedAddress !== null) {
						onSuccess.address.map((item, index) => {
							if (item.address_id == this.state.selectedAddress.address_id)
								this.setState({ selectedIndex: index })
						})
					}
				} else {
					this.arrayAddress = [];
					this.strOnScreenMessage = strings('noDataFound');
				}

				this.setState({ isLoading: false });
			} else {
				// showValidationAlert(onSuccess.message);
				this.strOnScreenMessage = strings('noDataFound');
				this.setState({ isLoading: false });
			}
		} else {
			// showValidationAlert(strings("generalWebServiceError"));
			this.strOnScreenMessage = strings('generalWebServiceError');
			this.setState({ isLoading: false });
		}
	};

	/**
	 * @param { FAilure Response Objetc } onfailure
	 */
	onFailureLoadAddress = onFailure => {
		console.log('[]][][][]]]][][][][ LOAD ADDRESS FAILURE', onFailure);
		this.strOnScreenMessage = '';
		this.strOnScreenSubtitle = '';
		this.strOnScreenMessage = strings('generalWebServiceError');
		this.setState({ isLoading: false });
		// showValidationAlert(strings("noInternet"));
	};

	/** GET ADDRESS API */
	getAddressList = () => {
		this.strOnScreenMessage = '';
		this.strOnScreenSubtitle = '';
		this.setState({ isLoading: true });
		netStatus(status => {
			if (status) {
				let param = {
					language_slug: this.props.lan,
					user_id: this.props.userID || 0,
					// token: this.props.token,
				};
				getAddressListAPI(param, this.onSuccessLoadAddress, this.onFailureLoadAddress, this.props);
			} else {
				// showValidationAlert(strings("noInternet"));
				this.strOnScreenMessage = strings('noInternetTitle');
				this.strOnScreenSubtitle = strings('noInternet');
				this.setState({ isLoading: false });
			}
		});
	};
	//#endregion

	//#region DELETE ADDRESS
	/**
	 * 
	 * @param { Success Response Object } onSuccess 
	 */
	onSuccessDeleteAddress = onSuccess => {
		console.log('Address Delete response ::::: ', onSuccess);
		if (onSuccess != undefined) {
			if (onSuccess.status == RESPONSE_SUCCESS) {
				// this.arrayAddress = this.arrayAddress.filter(data => { return data.address_id == this.delete_id })
				// if (!this.is_default)
				this.getAddressList();
				// else if (this.arrayAddress.length == 0) {
				// 	this.getAddressList();
				// }
				// else {
				// 	this.setDefaultAddess()
				// }
			} else {
				showValidationAlert(onSuccess.message);
				this.setState({ isLoading: false });
			}
		} else {
			this.strOnScreenMessage = strings('generalWebServiceError');
			// showValidationAlert(strings("generalWebServiceError"));
			this.setState({ isLoading: false });
		}
	};

	/**
	 * 
	 * @param {Fauilre Response Objewtc} onFailure 
	 */
	onFailureDeleteAddress = onFailure => {
		this.setState({ isLoading: false });
		this.strOnScreenMessage = strings('noInternet');
	};

	/** DELETE API */
	deleteAddress(addId, is_default) {
		netStatus(status => {
			if (status) {
				if (this.state.isSelectAddress && this.state.selectedAddress !== undefined && this.state.selectedAddress !== null && this.state.selectedAddress.address_id == addId) {
					this.address_deleted = true
				}
				if (is_default) {
					this.is_default = true
				}
				else {
					this.is_default = false
				}
				this.delete_id = addId
				this.setState({ isLoading: true, selectedIndex: -1 });
				let param = {
					language_slug: this.props.lan,
					user_id: this.props.userID,
					address_id: addId,
					// token: this.props.token,
				};
				deleteAddress(param, this.onSuccessDeleteAddress, this.onFailureDeleteAddress, this.props);
			} else {
				this.strOnScreenMessage = strings('noInternetTitle');
				this.strOnScreenSubtitle = strings('noInternet');
			}
		});
	}
	//#endregion

	/**
	 *
	 * @param {The success response object} objSuccess
	 */
	onaddAddressSuccess = objSuccess => {
		debugLog('OBJ SUCCESS ADDRESS :: ' + JSON.stringify(objSuccess));
		this.getAddressList()
	}

	/**
	*
	* @param {The success response object} objSuccess
	*/
	onaddAddressFailure = objFailure => {
		this.setState({ isLoading: false });
		debugLog('OBJ FAILURE ADDRESS :: ', objFailure);
		showValidationAlert(objFailure.message);
	}

	setDefaultAddess = () => {

		netStatus(isConnected => {
			if (isConnected) {
				let objaddAddressParams = {
					language_slug: this.props.lan,
					address: this.arrayAddress[0].address,
					landmark: this.arrayAddress[0].landmark,
					latitude: this.arrayAddress[0].latitude,
					longitude: this.arrayAddress[0].longitude,
					city: this.arrayAddress[0].city,
					zipcode: this.arrayAddress[0].zipcode,
					is_main: "1",
					user_id: this.props.userID,
					// token: this.props.PhoneNumber,
					address_id: this.arrayAddress[0].address_id,

				};
				this.setState({ isLoading: true });
				addAddress(objaddAddressParams, this.onaddAddressSuccess, this.onaddAddressFailure, this.props);
			} else {
				showNoInternetAlert();
			}
		});
	}


	addressSelectionAction = index => {
		this.setState({ selectedIndex: index });
		if (this.state.setSelectedAddress !== undefined) {
			this.state.setSelectedAddress(this.arrayAddress[index]);
			this.props.navigation.goBack()
		}
	};
}
//#endregion

//#region STYLES
const style = StyleSheet.create({
	selected: {
		flex: 1,
		alignItems: 'center',
		backgroundColor: EDColors.white,
		borderRadius: 5,
		padding: 5,
		borderWidth: 1,
		borderColor: EDColors.primary,
		marginTop: 10,
		marginLeft: 10,
		marginRight: 10,
	},
	continueStyle: {
		width: '100%',
		height: metrics.screenHeight * 0.09,
		backgroundColor: EDColors.backgroundLight,
		marginBottom: 10,
	},
	contButtonStyle: {
		alignSelf: 'center',
		backgroundColor: EDColors.primary,
		justifyContent: 'center',
		marginTop: 10,
		height: metrics.screenHeight * 0.07,
		width: '82.5%',
		borderRadius: 16
	},
	addView: {
		alignItems: 'center',
		padding: 10,
		marginHorizontal: 10
	},
	addButtonStyle: { width: "100%", borderColor: "#EDEDED", borderRadius: 16, borderWidth: 2, alignItems: "center", backgroundColor: EDColors.white },
	addIconStyle: { alignSelf: "center", marginHorizontal: 15, },
	titleText: {
		color: EDColors.blackSecondary,
		fontSize: getProportionalFontSize(16),
		fontFamily: EDFonts.semiBold,
		marginHorizontal: 15,
		marginVertical: 20
	},
	textStyle: {
		fontSize: getProportionalFontSize(14),
		fontFamily: EDFonts.regular,
		flex: 1,
		padding: 5,
	},
	orderView: { fontSize: getProportionalFontSize(16), padding: 10, backgroundColor: EDColors.white, margin: 10 },
	orderText: { fontSize: getProportionalFontSize(16), fontFamily: EDFonts.medium, marginVertical: 15 },
	separatorView: { marginHorizontal: 10, borderColor: EDColors.placeholder, borderWidth: 0.5 },
	subContainer: {
		flexDirection: "row",
		margin: 10,
		backgroundColor: "#fff",
		borderRadius: 6,
		padding: 10,
		// justifyContent: "center"
	},
	paymentMethodTitle: {
		// flex: 1,
		fontFamily: EDFonts.regular,
		fontSize: getProportionalFontSize(14),
		color: "#000",
		marginVertical: 10,
		marginStart: 10
	},
});
//#endregion

export default connect(
	state => {
		return {
			userID: state.userOperations.userIdInRedux,
			token: state.userOperations.phoneNumberInRedux,
			cartCount: state.checkoutReducer.cartCount,
			checkoutDetail: state.checkoutReducer.checkoutDetail,
			lan: state.userOperations.lan,
		};
	},
	dispatch => {
		return {
			saveCheckoutDetails: checkoutData => {
				dispatch(saveCheckoutDetails(checkoutData));
			},
		};
	}
)(DetailedAddressListContainer);
