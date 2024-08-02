
import moment from 'moment';
import React, { useRef } from 'react';
import { FlatList, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CreditCardInput } from 'react-native-credit-card-input';
import { Icon } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { PERMISSIONS } from 'react-native-permissions';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationEvents } from 'react-navigation';
import { connect } from 'react-redux';
import Assets from '../assets';
import AddressComponent from '../components/AddressComponent';
import { EDCardComponent } from '../components/EDCardComponent';
import EDDatePicker from '../components/EDDatePicker';
import EDPopupView from '../components/EDPopupView';
import EDRTLText from '../components/EDRTLText';
import EDRTLTextInput from '../components/EDRTLTextInput';
import EDRTLView from '../components/EDRTLView';
import EDThemeButton from '../components/EDThemeButton';
import { EDTimeSlotPicker } from '../components/EDTimeSlotPicker';
import { strings } from '../locales/i18n';
import { saveCheckoutDetails, saveGuestAddress, saveGuestDetails } from '../redux/actions/Checkout';
import { showDialogue, showNoInternetAlert, showValidationAlert } from '../utils/EDAlert';
import { EDColors } from '../utils/EDColors';
import { CARD_BRANDS, debugLog, funGetDateStr, funGetTime, getProportionalFontSize, GOOGLE_API_KEY, isRTLCheck, PAYMENT_TYPES, RESPONSE_SUCCESS, TextFieldTypes } from '../utils/EDConstants';
import { EDFonts } from '../utils/EDFontConstants';
import { getCountryName } from '../utils/LocationServiceManager';
import metrics from '../utils/metrics';
import { netStatus } from '../utils/NetworkStatusConnection';
import { checkPermission } from '../utils/PermissionServices';
import { checkOrder, checkScheduleDelivery, deleteAddress, getAddress, getAddressListAPI, getPaymentList, getSavedCardsAPI } from '../utils/ServiceManager';
import Validations from '../utils/Validations';
import BaseContainer from './BaseContainer';

export class AddressListContainer extends React.PureComponent {
	//#region LIFE CYCLE METHODS

	constructor(props) {
		super(props);
		this.validationsHelper = new Validations()
		this.countryCode = ""
		this.noCards = false
		this.strOnScreenMessage = '';
		this.strOnScreenSubtitle = '';
		this.isScheduleMandatory = false
		this.allowPreOrder = false
		this.allowedDates = {}
		this.state = {
			isPreOrder: false,
			isLoading: false,
			isPaymentLoading: false,
			isSavedCardLoading: false,
			isAsyncSync: false,
			cartData: '',
			addressLine1: '',
			addressLine2: '',
			value: this.props.orderModeInRedux == 1 ? 0 : 1,
			latitude: 0.0,
			longitude: 0.0,
			city: '',
			zipCode: '',
			addressId: '',
			isSelectAddress: this.props.navigation.state.params.isSelectAddress,
			cartItems: this.props.navigation.state.params.cartItems,
			selectedIndex: -1,
			strComment: "",
			strDriverComment: "",
			selectedOption: '',
			availableOrderModes: undefined,
			strFullName: "",
			strLastName: "",
			strPhone: "",
			strEmail: '',
			shouldPerformValidation: false,
			guestAddress: undefined,
			eventTime: funGetTime(new Date().toString()),
			// eventDate: funGetDateStr(new Date().toString(), 'MMM DD, YYYY'),
			// eventDate: moment(new Date().toString()).format('MMM DD, YYYY'),
			eventDate: "",
			startTime: "",
			endTime: "",
			currentDate: '',
			isDatePickerVisible: false,
			isTimePickerVisible: false,
			arrTimeSlots: [],
			dateIndex: 0,
			defaultCard: undefined,
			cardError: "",
			countryCode: undefined,
			isCardSave: false,
			showCardInput: true,
			isDefaultCard: false,
			noDefaultCard: false,
			selectedAddress: undefined,
			isPaystack: false
			// isGuestVerified: true
		};
		this.checkoutData = this.props.checkoutDetail;
	}



	onCountrySelect = country => {
		this.countryCode = country.callingCode[0]
	}

	onStripeCountrySelect = country => {
		this.isCountryError = false
		this.selectedCountry = country
		debugLog("COUNTRY :::::", country)
		this.setState({ cardError: '', countryCode: undefined })
	}


	//#region 
	onTextChangeHandler = (value) => {
		this.setState({
			strComment: value
		})
	}
	onDriverTextChangeHandler = (value) => {
		this.setState({
			strDriverComment: value
		})
	}
	//#endregion

	//#region TEXT CHANGE EVENTS
	/**
	 * @param {Value of textfield whatever user type} value
	 ** @param {Unique identifier for every text field} identifier
	 */
	textFieldTextDidChangeHandler = (value, identifier) => {
		var newText = value
		if (identifier == "strPhone") {
			newText = value.replace(/[^0-9\\]/g, "");
			// this.setState({ isGuestVerified: false })
		}
		this.state[identifier] = newText
		this.forceUpdate()
		this.setState({ shouldPerformValidation: false })

	}
	//#endregion

	showInfo = (type) => {
		switch (type) {
			case PAYMENT_TYPES.cash:
				showValidationAlert(strings("payCashMsg"));
				break;
			case PAYMENT_TYPES.online:
				showValidationAlert(strings("payOnlineMsg"));
				break;
		}
	}

	renderCustomCalender = () => {
		return (
			<EDPopupView isModalVisible={this.state.isDatePickerVisible}>
				<EDDatePicker
					currentDate={this.state.currentDate}
					_handleDatePicked={this._handleDatePicked}
					confirmDate={this.confirmDate}
					_hideDatePicker={this._hideDatePicker}
					// minDate={this.min_scheduled_date}
					// maxDate={this.max_scheduled_date}
					disabledByDefault={true}
					markedDates={this.allowedDates}
				/>
			</EDPopupView>
		)
	}

	renderCustomTimePicker = () => {
		let keys = Object.keys(this.state.arrTimeSlots)
		let dateIndex = 0
		keys.map((data, index) => {
			if (data == moment(this.state.currentDate).format("YYYY-MM-DD"))
				dateIndex = index
		})
		let slotsToLoad = Object.values(this.state.arrTimeSlots)[dateIndex]
		return (
			<EDPopupView isModalVisible={this.state.isTimePickerVisible} shouldDismissModalOnBackButton
				onRequestClose={this._hideTimePicker}
			>
				{/* <EDTimePicker
					onCancel={this._hideTimePicker}
					onConfirm={this._handleTimePicked}
					isShowInterval={false}
					value={this.state.eventTime}
				/> */}
				<EDTimeSlotPicker
					onDismiss={this._hideTimePicker}
					arrSlot={slotsToLoad}
					selectedTime={this.state.startTime}
					onTimePicked={this.onTimePicked}
				/>
			</EDPopupView>
		)
	}

	onTimePicked = (slot) => {
		this.setState({ startTime: slot.start, endTime: slot.end });

		this._hideTimePicker();
	}

	/** SHOW DATE PICKER */
	_showDatePicker = () => { this.setState({ isDatePickerVisible: true }) };

	/** HIDE DATE PICKER */
	_hideDatePicker = () => {
		this.setState({ isDatePickerVisible: false, currentDate: this.state.eventDate })
	};

	/** SHOW TIME PICKER */
	_showTimePicker = (value) => this.setState({ isTimePickerVisible: true, forTime: value });

	/** HIDE TIME PICKER */
	_hideTimePicker = () => this.setState({ isTimePickerVisible: false });

	confirmDate = () => {
		// var datePicked = funGetDate(this.state.currentDate)
		let keys = Object.keys(this.state.arrTimeSlots)
		let dateIndex = 0
		keys.map((data, index) => {
			if (data == moment(this.state.currentDate).format("YYYY-MM-DD"))
				dateIndex = index
		})
		let slotsToLoad = Object.values(this.state.arrTimeSlots)[dateIndex]
		var datePicked = funGetDateStr(this.state.currentDate.toString(), 'MMM DD, YYYY')
		this.setState({ eventDate: datePicked, isDatePickerVisible: false, startTime: slotsToLoad[0].start, endTime: slotsToLoad[0].end })
	};

	/** DATE PICKER HANDLER */
	_handleDatePicked = date => {
		for (var key in this.allowedDates) {
			this.allowedDates[key].selected = (key == date.dateString)
			this.allowedDates[key].marked = (key == date.dateString)
			if (key == date.dateString)
				this.setState({ currentDate: date.dateString });
		}

		// this._hideDatePicker()
	};

	/** TIME PICKER HANDLER */
	_handleTimePicked = time => {

		this.setState({ eventTime: time });

		this._hideTimePicker();
	};

	togglePreOrder = () => {
		this.setState({ isPreOrder: !this.state.isPreOrder })
	}

	verifyPhoneNumber = (checkout_data) => {
		this.props.navigation.navigate('OTPVerificationFromAddressList', {
			isForGuest: true,
			phNo: this.state.strPhone,
			phoneCode: this.countryCode,
			// setVerified: this.setVerified,
			checkout_data: checkout_data,
			guest_first_name: this.state.strFullName,
			guest_email: this.state.strEmail,
		})
	}

	setVerified = () => {
		this.setState({ isGuestVerified: true })
	}

	//#region
	/** RENDER METHOD */
	render() {
		return (
			<BaseContainer
				title={this.state.isSelectAddress ? strings('selectAddress') : strings('myAddress')}
				left={isRTLCheck() ? 'arrow-forward' : 'arrow-back'}
				right={[]}
				onLeft={this.onBackEventHandler}
				loading={this.state.isLoading || this.state.isPaymentLoading || this.state.isSavedCardLoading}
				onConnectionChangeHandler={this.onWillFocus}
			>

				{this.renderCustomCalender()}
				{this.renderCustomTimePicker()}

				{/* MAIN VIEW */}
				<KeyboardAwareScrollView style={{ flex: 1, backgroundColor: EDColors.radioSelected }}
					bounces={false}
					keyboardShouldPersistTaps="handled"
					behavior="padding"
					showsVerticalScrollIndicator={false}
					enabled
					enableAutoAutomaticScroll={false}
					enableOnAndroid={true}
				>
					<View pointerEvents={this.state.isLoading ? 'none' : 'auto'} style={{ flex: 1 }}>
						<NavigationEvents onWillFocus={this.onWillFocus} />
						{this.props.userID !== undefined && this.props.userID !== null ? null :
							<View style={style.contactView}>
								<EDRTLText style={[style.titleText, {
									marginHorizontal: 0,
								}]} title={strings('contactInfo')} />
								{/* USERNAME */}
								<EDRTLTextInput
									textstyle={{ color: EDColors.black }}
									icon="person"
									type={TextFieldTypes.default}
									identifier={'strFullName'}
									placeholder={strings('firstName')}
									onChangeText={this.textFieldTextDidChangeHandler}
									initialValue={this.state.strFullName}
									errorFromScreen={
										this.state.shouldPerformValidation
											? this.validationsHelper.checkForEmpty(
												this.state.strFullName,
												strings('emptyName'),
											)
											: ''
									}
								/>

								{/* LAST NAME */}
								<EDRTLTextInput
									textstyle={{ color: EDColors.black }}
									icon="person"
									type={TextFieldTypes.default}
									identifier={'strLastName'}
									placeholder={strings('lastName')}
									onChangeText={this.textFieldTextDidChangeHandler}
									initialValue={this.state.strLastName}
									errorFromScreen={
										this.state.shouldPerformValidation
											? this.validationsHelper.checkForEmpty(
												this.state.strLastName,
												strings('emptyLastName'),
											)
											: ''
									}
								/>
								{/* PHONE NUMBER */}
								<EDRTLTextInput
									textstyle={{ color: EDColors.black }}
									icon="call"
									type={TextFieldTypes.phone}
									countryData={this.props.countryArray}
									dialCode={this.countryCode !== "" ? this.countryCode :
										this.props.countryArray !== undefined && this.props.countryArray !== null && this.props.countryArray[0] !== undefined && this.props.countryArray[0].phonecode !== undefined ?
											this.props.countryArray[0].phonecode : undefined
									}
									identifier={'strPhone'}
									onCountrySelect={this.onCountrySelect}
									placeholder={strings('phoneNumber')}
									onChangeText={this.textFieldTextDidChangeHandler}
									initialValue={this.state.strPhone}
									errorFromScreen={
										this.state.shouldPerformValidation
											? this.validationsHelper.validateMobile(
												this.state.strPhone,
												strings('emptyPhone'),
												this.countryCode
											)
											: ''
									}
								/>
								{/* {this.validationsHelper.validateMobile(
									this.state.strPhone,
									strings('emptyPhone'),
									this.countryCode
								).trim() == "" ?
									(this.state.isGuestVerified ?
										<EDRTLText title={strings("verified")} style={[style.verifiedText, { color: EDColors.veg, textAlign: "right" }]} />
										:
										<EDRTLView style={{ alignItems: "center", justifyContent: "space-between", flex: 1 }}>
											<EDRTLText title={strings("notVerified")} style={[style.verifiedText, { color: EDColors.error }]} />
											<EDRTLText title={strings("verifyNow")}
												onPress={this.verifyPhoneNumber}
												style={{
													color: EDColors.primary, textDecorationLine: "underline",
													fontFamily: EDFonts.bold, fontSize: getProportionalFontSize(13)
												}} />

										</EDRTLView>
									) : null} */}

								<EDRTLTextInput
									icon="email"
									textstyle={{ color: EDColors.black }}
									type={TextFieldTypes.email}
									identifier={'strEmail'}
									placeholder={strings('email')}
									onChangeText={this.textFieldTextDidChangeHandler}
									initialValue={this.state.strEmail}
									errorFromScreen={
										this.state.shouldPerformValidation
											? this.validationsHelper.validateEmail(
												this.state.strEmail,
												strings("emptyEmail")
											)
											: ''
									}
								/>
							</View>}

						{/* IF SELECT ADDRESS */}
						{this.state.isSelectAddress && this.state.availableOrderModes !== undefined && this.state.availableOrderModes !== null && this.state.availableOrderModes.length !== 0
							? <View>
								{this.allowPreOrder ?
									<EDRTLView style={{ flex: 1, marginTop: 10, marginHorizontal: 10, padding: 10 }}>
										<EDRTLText
											onPress={this.isScheduleMandatory ? null : this.togglePreOrder}
											style={[style.orderView, { flex: 1, margin: 0, padding: 0 }]} title={
												this.isScheduleMandatory ? strings('scheduleMandatory') :
													strings('scheduleOptional')} />
										{this.isScheduleMandatory ? null :
											<Icon type="feather"
												color={EDColors.primary}
												name={this.state.isPreOrder ? "check-square" : "square"}
												onPress={this.togglePreOrder}
											/>
										}

									</EDRTLView>
									: null}
								{this.allowPreOrder && (this.isScheduleMandatory || this.state.isPreOrder) ?
									<EDRTLView style={{ alignItems: 'center', justifyContent: "space-between", flex: 1 }}>
										<View style={style.dateView}>
											<EDRTLView style={[style.dataView]}>
												<Icon
													name={"calendar"}
													color={EDColors.primary}
													containerStyle={style.personIconStyle}
													size={getProportionalFontSize(15)}
													type={'ant-design'}
												/>
												<EDRTLText
													numberOfLines={1}
													style={[style.dateTimeText]}
													title={strings("selectDate")}

												/>
												<Icon
													name={"calendar"}
													color={EDColors.transparent}
													containerStyle={style.personIconStyle}
													size={getProportionalFontSize(15)}
													type={'ant-design'}
												/>

											</EDRTLView>
											<View style={style.datePickerView}>
												<TouchableOpacity onPress={this._showDatePicker}>
													<EDRTLView>
														<EDRTLText
															numberOfLines={1}
															style={[[style.datePickerText, { marginHorizontal: 3 }]]}
															title={this.state.eventDate !== "Invalid date" ? this.state.eventDate : moment(new Date().toString()).format('MMM DD, YYYY')} />
														<Icon name={'keyboard-arrow-down'} size={getProportionalFontSize(15)} color={'#C4C4C4'} style={style.dateIcon} />
													</EDRTLView>
												</TouchableOpacity>

											</View>
										</View>
										<View style={style.dateView}>
											<EDRTLView style={[style.dataView]}>
												<Icon
													name={"clockcircleo"}
													color={EDColors.primary}
													containerStyle={style.personIconStyle}
													size={getProportionalFontSize(15)}
													type={'ant-design'}
												/>
												<EDRTLText
													numberOfLines={1}
													style={[style.dateTimeText]}
													title={strings("selectTime")}

												/>
												<Icon
													name={"clockcircleo"}
													color={EDColors.transparent}
													containerStyle={style.personIconStyle}
													size={getProportionalFontSize(15)}
													type={'ant-design'}
												/>

											</EDRTLView>

											{/* SELECT TIME */}
											<View style={style.datePickerView}>
												<TouchableOpacity onPress={() => this._showTimePicker('event')}>
													<EDRTLText
														numberOfLines={1}
														style={[style.timeTextStyle]}
														title={this.state.startTime + " - " + this.state.endTime} />
												</TouchableOpacity>
											</View>
										</View>
									</EDRTLView> : null}
								<EDRTLText style={style.orderView} title={strings('orderType')} />

								<View style={style.deliveryOptionView} >
									{this.state.availableOrderModes.includes("Delivery") ?
										<TouchableOpacity onPress={this.selectCod} style={[style.touchableView, { flexDirection: isRTLCheck() ? "row-reverse" : "row", marginBottom: 20 }]}>
											<EDRTLView style={style.childDeliveryOptionView}>
												<Icon name={"directions-bike"} size={getProportionalFontSize(20)} style={style.headerIconStyle} color={this.state.value == 1 ? EDColors.primary : EDColors.text} />
												<EDRTLText style={[style.deliveryTextStyle, { color: this.state.value == 1 ? EDColors.black : EDColors.text }]} title={strings('byDelivery')} ></EDRTLText>
											</EDRTLView>
											{this.state.value == 1 ? <Icon name={'done'} size={getProportionalFontSize(18)} color={EDColors.primary} /> : null}
										</TouchableOpacity> : null}
									{this.state.availableOrderModes.includes("PickUp") ?
										<TouchableOpacity onPress={this.selectPickUp} style={[style.touchableView, { flexDirection: isRTLCheck() ? "row-reverse" : "row", marginTop: 20 }]}>
											<EDRTLView style={style.childDeliveryOptionView} >
												<Icon name={"directions-walk"} size={getProportionalFontSize(20)} style={style.headerIconStyle} color={this.state.value == 0 ? EDColors.primary : EDColors.text} />
												<EDRTLText style={[style.deliveryTextStyle, { color: this.state.value == 0 ? EDColors.black : EDColors.text }]} title={strings('selfPickup')} />
											</EDRTLView>
											{this.state.value == 0 ? <Icon name={'done'} size={getProportionalFontSize(18)} color={EDColors.primary} /> : null}
										</TouchableOpacity> : null}

								</View>

							</View>
							: null}
						{this.state.value == 1 ?
							<>
								{/* ADD ADDRESS */}
								<EDRTLView style={style.addView}>
									<EDRTLText style={style.titleText} title={strings('addressTitle')} />
									<EDThemeButton
										icon={this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" ? this.state.selectedAddress != undefined && this.state.selectedAddress != null ? "edit" : "add" : (this.state.guestAddress == undefined ? "add" : "edit")}
										label={this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" ? this.state.selectedAddress && this.state.selectedAddress != null ? strings('changeAddress') : strings("addAddress") : (this.state.guestAddress == undefined ? strings("addAddress") : strings('changeAddress'))}
										style={{ flex: 1, marginTop: 0, height: 40, borderRadius: 16, paddingVertical: 0, marginHorizontal: 3 }}
										textStyle={{ fontSize: getProportionalFontSize(14), paddingLeft: 7, paddingRight: 7, }}
										onPress={this.onAddAddressEventHandler}
									/>
								</EDRTLView>
								{/* ADDRESS LIST */}
								{this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== '' ?
									(this.state.selectedAddress != undefined && this.state.selectedAddress != null && this.state.selectedAddress.address !== undefined
										?

										<AddressComponent
											data={this.state.selectedAddress}
											index={0}
											isSelectedAddress={this.state.isSelectAddress}
											isAddressList={true}
											onPress={this.addressSelectionAction}
											deleteAddress={this.onDeleteAddressEventHandler}
											editAddress={this.navigateTomap}
										/>
										:
										this.state.isLoading ? null :
											<EDRTLText title={strings("noAddressMsg")} style={style.noAddress} />
									) : null}
								{this.props.userID == undefined || this.props.userID == null || this.props.userID == '' ?
									(this.state.guestAddress !== undefined
										?
										<AddressComponent
											data={this.state.guestAddress}
											index={0}
											isSelectedAddress={true}
											isAddressList={true}
											onPress={this.addressSelectionAction}
											deleteAddress={this.onDeleteAddressEventHandler}
											editAddress={this.navigateTomap}
										/> : this.state.isLoading || this.state.value !== 1 ? null :
											<EDRTLText title={strings("guestAddressError")} style={style.noAddress} />
									) : null}

							</> : null}
						{this.state.isSelectAddress
							?
							<View style={{ flex: 1 }}>

								{this.paymentOptions !== undefined && this.paymentOptions !== null && this.paymentOptions.length !== 0 ?
									<EDRTLText title={strings("choosePaymentOption")} style={style.paymentHeader} /> : null}
								{this.paymentOptions !== undefined && this.paymentOptions !== null && this.paymentOptions.length !== 0 ?

									<FlatList
										data={this.paymentOptions}
										extraData={this.state}
										renderItem={this.createPaymentList}
									/> : null}

								{/* COMMENT RES */}
								{/* <View style={style.subContainer}> */}
								{/* <View style={{ marginHorizontal: 10, marginBottom: 20, marginTop: 20 }}>
									<EDRTLText style={style.titleText} title={strings("addCookingInstruction")} />
									<EDRTLView style={style.footerStyle}>
										<Icon name={"edit"} type={"feather"} color={EDColors.black} size={getProportionalFontSize(20)} style={style.editIconStyle} />
										<TextInput
											style={{
												textAlign: isRTLCheck() ? 'right' : 'left',
												flexDirection: isRTLCheck() ? 'row-reverse' : 'row',
												marginHorizontal: 10, flex: 1, marginVertical: 20, color: EDColors.grayNew, fontFamily: EDFonts.medium
											}}
											placeholder={strings("bringCutlery")}
											value={this.state.strComment}
											onChangeText={this.onTextChangeHandler}
											maxLength={250}
										/>
									</EDRTLView>
									<Text style={[style.counterStyle, { textAlign: isRTLCheck() ? "left" : "right" }]} >
										{this.state.strComment.length}/250
									</Text>
								</View> */}
								{this.state.value == 1 ?
									<View style={{ marginHorizontal: 10, marginBottom: 20, marginTop: 20 }}>
										<EDRTLText style={style.titleText} title={strings("addDeliveryInstruction")} />
										<EDRTLView style={style.footerStyle}>
											<Icon name={"edit"} type={"feather"} color={EDColors.black} size={getProportionalFontSize(20)} style={style.editIconStyle} />
											<TextInput
												style={{
													textAlign: isRTLCheck() ? 'right' : 'left',
													flexDirection: isRTLCheck() ? 'row-reverse' : 'row',
													marginHorizontal: 10, flex: 1, marginVertical: 20, color: EDColors.grayNew, fontFamily: EDFonts.medium
												}}
												placeholder={strings("doNotRing")}
												value={this.state.strDriverComment}
												onChangeText={this.onDriverTextChangeHandler}
												maxLength={250}
												selectionColor={EDColors.palePrimary}
											/>
										</EDRTLView>
										<Text style={[style.counterStyle, { textAlign: isRTLCheck() ? "left" : "right" }]} >
											{this.state.strDriverComment.length}/250
										</Text>
									</View> : null
								}
							</View>
							:
							null}
					</View>
				</KeyboardAwareScrollView>

				{/* IF SELECT ADDRESS */}
				{this.state.isSelectAddress
					?
					<View style={{ marginHorizontal: 10 }}>
						<EDThemeButton
							isLoading={this.state.isLoading}
							onPress={this.onContinueEventHandler}
							label={strings('continue')}
							style={[style.themeButton, {
								marginBottom: (Platform.OS == "ios" ? initialWindowMetrics.insets.bottom : 0) + 10,
							}]}
							textStyle={style.themeButtonText}
						/>
					</View>
					: null}
			</BaseContainer>
		);
	}
	//#endregion

	changeCard = () => {
		this.props.navigation.push('savedCards', { isForAddressList: true, });

	}

	addCard = () => {
		this.setState({ showCardInput: !this.state.showCardInput })
	}

	refreshDefaultCard = (card) => {
		this.setState({ defaultCard: card })
	}

	onOptionSelection = (data) => {
		this.setState({ selectedOption: data.payment_gateway_slug })
		if (data.payment_gateway_slug == "applepay") {
			this.publishable_key = data.enable_live_mode == "1" ? data.live_publishable_key : data.test_publishable_key
		}
		else if(data.payment_gateway_slug == "paystack") {
			this.publishable_key = data.enable_live_mode == "1" ? data.live_publishable_key : data.test_publishable_key
			this.secret_key = data.enable_live_mode == "1" ? data.live_secret_key : data.test_secret_key
		}
	}



	myValidatePostalCode(postalCode) {
		return postalCode.match(/^\d{5,6}$/) ? "valid" :
			postalCode.length > 6 ? "invalid" :
				"incomplete";
	}

	/**
   * On Credit card input
   */
	onCCInput = (data) => {
		this.isCardError = false
		this.isExpiryError = false
		this.isCVCError = false
		this.isCountryError = false
		this.isPostalError = false

		this.setState({ cardError: "" })
		this.cardData = data
	}

	validateCard = () => {
		if (this.cardData !== undefined) {
			if (this.isForEditing || this.cardData.status.number == "valid") {
				if (this.cardData.status.expiry == "valid") {
					if (this.isForEditing || this.cardData.status.cvc == "valid") {
						if (this.selectedCountry !== undefined || this.state.countryCode !== undefined) {
							if (this.cardData.status.postalCode == "valid") {
								this.isCardError = false
								this.isExpiryError = false
								this.isCVCError = false
								this.isCountryError = false
								this.isPostalError = false
								this.setState({ cardError: "" })

							}
							else {
								this.isPostalError = true
								this.setState({ cardError: strings("invalidPostal") })
							}
						}
						else {
							this.isCountryError = true
							this.setState({ cardError: strings("noCountry") })
						}
					}
					else {
						this.isCVCError = true
						console.log("Invalid CVC")
						this.setState({ cardError: strings("invalidCVC") })
					}
				}
				else {
					this.isExpiryError = true
					console.log("Invalid expiry date", this.state.cardError)
					this.setState({ cardError: strings("invalidExpiry") })
				}
			}
			else {
				this.isCardError = true
				console.log("Invalid card number")
				this.setState({ cardError: this.cardData.values.number == '' ? strings("nocardData") : strings("invalidCard") })
			}
		}
		else {
			this.isCardError = true
			this.setState({ cardError: strings("nocardData") })
		}
		return this.state.cardError;
	}

	createPaymentList = item => {
		let display_name = `display_name_${this.props.lan}`
		return (

			<View>
				<TouchableOpacity style={[style.subContainer]}
					activeOpacity={1}
					onPress={() => this.onOptionSelection(item.item)}>
					<EDRTLView>
						<EDRTLView style={{ alignItems: 'center', flex: 1 }}>
							<Icon name={
								item.item.payment_gateway_slug === 'applepay' ? 'apple-pay'
									:
									item.item.payment_gateway_slug === 'paypal' ? 'paypal' : item.item.payment_gateway_slug === 'cod' ? 'account-balance-wallet' : 'cc-stripe'}
								type={
									item.item.payment_gateway_slug === 'applepay' ? 'fontisto' :
										item.item.payment_gateway_slug === 'paypal' ? 'entypo' : item.item.payment_gateway_slug === 'cod' ? 'material' : 'font-awesome'} size={20} color={this.state.selectedOption == item.item.payment_gateway_slug ? EDColors.primary : EDColors.text} style={style.paymentIconStyle} />
							<EDRTLText style={[style.paymentMethodTitle, { color: this.state.selectedOption == item.item.payment_gateway_slug ? EDColors.black : EDColors.blackSecondary }]} title={
								item.item[display_name]} />
						</EDRTLView>
						<Icon name={"check"} size={getProportionalFontSize(16)} selectionColor={EDColors.primary} color={this.state.selectedOption == item.item.payment_gateway_slug ? EDColors.primary : EDColors.white} style={{ margin: 10 }} />
					</EDRTLView>
					{this.state.selectedOption == "stripe" && item.item.payment_gateway_slug == "stripe" ?
						<>
							{!this.state.showCardInput ?
								this.state.defaultCard !== undefined ?
									<>
										<EDRTLView style={[style.cardView]}>
											<EDRTLView style={style.cardSubView}>
												<Icon
													name={this.state.defaultCard.card.brand == CARD_BRANDS.visa ? "cc-visa" :
														this.state.defaultCard.card.brand == CARD_BRANDS.mastercard ? "cc-mastercard" :
															this.state.defaultCard.card.brand == CARD_BRANDS.amex ? "cc-amex" : "credit-card"
													}
													color={this.state.defaultCard.card.brand == CARD_BRANDS.visa ? EDColors.visa :
														this.state.defaultCard.card.brand == CARD_BRANDS.mastercard ? EDColors.mastercard :
															this.state.defaultCard.card.brand == CARD_BRANDS.amex ? EDColors.amex : EDColors.primary
													}
													size={20}
													type="font-awesome"
												/>
												<View style={{ marginHorizontal: 20, flex: 1 }}>
													<EDRTLView style={{ alignItems: 'center' }}>
														<Text style={{ color: EDColors.black }}>•••• </Text>
														<EDRTLText title={this.state.defaultCard.card.last4} style={style.last4Text} />
													</EDRTLView>
													{(new Date().setFullYear(this.state.defaultCard.card.exp_year, this.state.defaultCard.card.exp_month, 1) < new Date()) ?
														<EDRTLText title={strings("expired")} style={style.expiredText} /> : null}
												</View>
												<EDRTLText title={strings("change")} style={style.changeCard} onPress={this.changeCard} />
												<EDRTLText title={
													strings("homeNew")} style={style.changeCard} onPress={this.addCard} />

											</EDRTLView>
										</EDRTLView>
										<EDRTLText title={strings("defaultCard")} style={{ fontFamily: EDFonts.regular, color: EDColors.textNew, marginHorizontal: 7.5, flex: 1, fontSize: getProportionalFontSize(14), marginTop: 10 }} />

									</> :

									this.state.isLoading || this.state.isPaymentLoading || this.state.isSavedCardLoading ? null :
										<>
											<EDRTLText title={
												this.noCards ?
													strings("noCards") :
													strings("noDefaultCard")} style={{ fontFamily: EDFonts.regular, color: EDColors.error, marginHorizontal: 7.5, flex: 1, fontSize: getProportionalFontSize(14), marginTop: 10 }} />
											<EDRTLView style={{ alignItems: 'center', marginTop: 10, }}>
												{this.noCards ? null :
													<EDRTLText title={strings("setNow")} style={[style.changeCard, { marginLeft: 7.5 }]} onPress={this.changeCard} />}
												<EDRTLText title={strings("homeNew")} style={style.changeCard} onPress={this.addCard} />
											</EDRTLView>
										</>


								: null}
							{this.state.showCardInput ?
								< View style={{}}>
									{this.state.defaultCard !== undefined || this.state.noDefaultCard ?
										<EDRTLText title={
											strings("dialogCancel")} style={[style.changeCard, { textAlign: 'left', marginLeft: 0 }]} onPress={this.addCard} /> : null}
									<CreditCardInput
										ref={ref => this.creditcardRef = ref}
										autoFocus={false}
										onChange={this.onCCInput}
										cardFontFamily={EDFonts.regular}
										cardImageFront={Assets.card_front}
										cardImageBack={Assets.card_back}
										errorMessage={this.state.cardError}
										isCardError={this.isCardError}
										isExpiryError={this.isExpiryError}
										isCVCError={this.isCVCError}
										isPostalError={this.isPostalError}
										isCountryError={this.isCountryError}
										onCountrySelect={this.onStripeCountrySelect}
										requiresPostalCode
										requiresCVC={true}
										// requiresCountry={this.order_delivery == "Delivery"}
										requiresCountry={true}
										dialCode={this.state.countryCode}
										isReadOnly={false}
										validatePostalCode={this.myValidatePostalCode}
										countryData={this.props.countryArray}
										cvcStyle={{ width: metrics.screenWidth / 2 - 40, marginLeft: 15 }}
										expiryStyle={{ width: metrics.screenWidth / 2 - 40 }}
										errorLeftPadding={metrics.screenWidth / 2 - 25}
									/>
									{this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" ?
										<TouchableOpacity onPress={this.toggleCardSave} activeOpacity={1}>
											<EDRTLView style={{ alignItems: 'center', marginTop: 10 }}>
												<Icon name={this.state.isCardSave ? "check-square-o" : "square-o"}
													color={EDColors.primary}
													size={20}
													type="font-awesome"
												/>
												<EDRTLText title={strings("askSaveCard")} style={{ fontFamily: EDFonts.medium, color: EDColors.black, marginHorizontal: 7.5, flex: 1, fontSize: getProportionalFontSize(14) }} />
											</EDRTLView>
										</TouchableOpacity> : null}

									{this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" && this.state.isCardSave && !this.noCards ?
										<TouchableOpacity onPress={this.toggleCardDefault} activeOpacity={1}>
											<EDRTLView style={{ alignItems: 'center', marginTop: 10 }}>
												<Icon name={this.state.isDefaultCard ? "check-square-o" : "square-o"}
													color={EDColors.primary}
													size={20}
													type="font-awesome"
												/>
												<EDRTLText title={strings("setDefaultCard")} style={{ fontFamily: EDFonts.medium, color: EDColors.black, marginHorizontal: 7.5, flex: 1, fontSize: getProportionalFontSize(14) }} />
											</EDRTLView>
										</TouchableOpacity> : null}
								</View> : null}</>

						: null}
				</TouchableOpacity>
			</View >
		)
	}


	toggleCardSave = () => {
		this.setState({ isCardSave: !this.state.isCardSave, isDefaultCard: false })
	}

	toggleCardDefault = () => {
		this.setState({ isDefaultCard: !this.state.isDefaultCard })
	}

	//#region
	/** BACK EVENT HANDLER */
	onBackEventHandler = () => {
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
		this.setState({ value: value });
	};
	//#endregion
	selectPickUp = () => {
		// this.state.value = 0;
		this.setState({ value: 0 });
	}

	selectCod = () => {
		// this.state.value = 1;
		this.setState({ value: 1 });
	}


	// navigate to checkout
	navigateToCheckout = (isDelivery = false, onSuccess) => {

		let checkout_data =
			isDelivery ?
				{
					publishable_key: this.publishable_key,
					secret_key: this.secret_key,
					delivery_status: this.state.value === 1 ? 'Delivery' : 'PickUp',
					latitude: this.state.guestAddress !== undefined ? this.state.guestAddress.latitude : this.state.selectedAddress.latitude,
					longitude: this.state.guestAddress !== undefined ? this.state.guestAddress.longitude : this.state.selectedAddress.longitude,
					address_id: this.state.guestAddress !== undefined ? undefined : this.state.selectedAddress.address_id,
					is_cod: this.state.cash,
					comment: this.state.strComment,
					delivery_instructions: this.state.strDriverComment,
					payment_option: this.state.selectedOption,
					selectedCard: this.state.defaultCard,
					cardData: this.cardData,
					default_tip_percent_val: onSuccess.default_tip_percent_val,
					completeAddress: this.state.guestAddress !== undefined ? this.state.guestAddress : this.state.selectedAddress,
					isPreOrder: this.allowPreOrder && (this.isScheduleMandatory || this.state.isPreOrder),
					scheduled_date: moment(this.state.currentDate).format("DD-MM-YYYY"),
					slot_open_time: this.state.startTime,
					slot_close_time: this.state.endTime,
					allowPreOrder: this.allowPreOrder,
					countryCode: this.state.countryCode || (this.selectedCountry !== undefined ? this.selectedCountry.cca2 : ''),
					isCardSave: this.state.isCardSave,
					isDefaultCard: this.noCards || this.state.isDefaultCard,
					paystackMethod:this.state.isPaystack,
					email:this.state.strEmail
				} :
				{
					publishable_key: this.publishable_key,
					secret_key: this.secret_key,
					delivery_status: 'PickUp',
					latitude: '',
					longitude: '',
					address_id: '',
					payment_option: this.state.selectedOption,
					comment: this.state.strComment,
					delivery_instructions: this.state.strDriverComment,
					completeAddress: this.props.currentLocation,
					isPreOrder: this.allowPreOrder && (this.isScheduleMandatory || this.state.isPreOrder),
					scheduled_date: moment(this.state.currentDate).format("DD-MM-YYYY"),
					slot_open_time: this.state.startTime,
					slot_close_time: this.state.endTime,
					allowPreOrder: this.allowPreOrder,
					selectedCard: this.state.defaultCard,
					cardData: this.cardData,
					countryCode: this.state.countryCode || (this.selectedCountry !== undefined ? this.selectedCountry.cca2 : ''),
					isCardSave: this.state.isCardSave,
					isDefaultCard: this.noCards || this.state.isDefaultCard,
					paystackMethod:this.state.isPaystack,
					email:this.state.strEmail
				};
		if (this.props.userID !== undefined && this.props.userID !== null) {
			this.props.navigation.navigate("CheckOutContainer", checkout_data)
		}
		else (
			this.verifyPhoneNumber(checkout_data)
		)
	}


// proceed to checkout
	proceedToCheckout = () => {
		if (this.state.selectedOption !== "") {
			if (this.state.value == 0) {
				this.props.saveCheckoutDetails(this.checkoutData);
				this.state.strFullName !== "" ?
					this.props.saveGuestDetails({
						first_name: this.state.strFullName,
						last_name: this.state.strLastName,
						phone_number: this.state.strPhone,
						phone_code: this.countryCode,
						email: this.state.strEmail
					}) : null
				this.navigateToCheckout()
			}
			else if (this.state.value == -1) {
				showValidationAlert(strings("noDeliveryOption"))
			}
			else {
				if (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== '') {
					if (this.state.selectedIndex === -1)
						showValidationAlert(strings('noAddressMsg'));
					else
						this.checkOrderAPI();
				}
				else {
					if (this.state.guestAddress === undefined)
						showValidationAlert(strings('guestAddressError'));
					else
						this.checkOrderAPI();
				}

			}
		}
		else {
			if (this.paymentOptions !== undefined)
				showValidationAlert(strings("choosePaymentError"))
			else
				showValidationAlert(strings("noPaymentMethods"))
		}
	}


	//#region
	/** CONTINUE EVENT HANDLER */
	onContinueEventHandler = () => {
		netStatus(status => {
			if (status) {
				if (this.props.userID === undefined || this.props.userID === null) {
					this.setState({ shouldPerformValidation: true })
					if (this.state.strFullName.trim().length > 0 &&
						this.state.strLastName.trim().length > 0 &&
						this.validationsHelper
							.validateMobile(
								this.state.strPhone,
								strings("emptyPhone"),
								this.countryCode
							)
							.trim() == "" &&
						this.validationsHelper
							.validateEmail(
								this.state.strEmail,
								strings("emptyEmail")
							)
							.trim() == ""
					) {

					} else { return }
				}
				if (this.state.selectedOption == "stripe" && (this.state.defaultCard == undefined || this.state.showCardInput)) {
					debugLog("VALIDATE CARD :::::", this.validateCard())
					if (this.validateCard() !== "")
						return;
				}
				if (this.allowPreOrder && (this.state.isPreOrder || this.isScheduleMandatory))
					this.validateScheduling()
				else {
					if (this.isScheduleMandatory)
						showValidationAlert(strings("noTimeSlot"))
					else
						this.proceedToCheckout()
				}
			} else {
				this.strOnScreenMessage = strings('noInternetTitle');
			}
		});
	};
	//#endregion






	setGuestAddress = address => {
		this.props.saveGuestAddress(address)
		this.setState({ guestAddress: address })
	}

	setSelectedAddress = address => {
		if (address !== undefined && address !== null && address !== {} && address.address !== undefined) {
			this.isAddressChanged = true
		}
		this.setState({ selectedAddress: address })

	}
	//#region ADD ADDRESS
	onAddAddressEventHandler = () => {
		if (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== '')
			this.props.navigation.navigate('DetailedAddressListContainer', {
				isSelectAddress: true,
				resId: this.props.navigation.state.params.resId,
				setSelectedAddress: this.setSelectedAddress,
				selectedAddress: this.state.selectedAddress
			})
		else
			this.navigateTomap("", 3)
	};
	//#endregion

	//#region
	/** on EDIT PRESS */

	navigateTomap = (item, index) => {
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
									addressLine2: item.landmark,
									addressLine1: item.address,
									latitude: item.latitude,
									longitude: item.longitude,
									city: item.city,
									is_main: item.is_main,
									zipCode: item.zipcode,
									address_label: item.address_label,
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
							case 3:
								this.props.navigation.navigate('AddressMapContainer', {
									getGuestAddress: this.setGuestAddress,
									totalCount: 0,
									isGuest: true,
									isEdit: index
								})
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
	onDeleteAddressEventHandler = address_id => {
		showDialogue(
			strings('deleteAddressConfirm'),
			[
				{
					text: strings('dialogCancel'),
					isNotPreferred: true
				},
			],
			'',
			() => this.deleteAddress(address_id)
		);
	};
	//#endregion

	//#region
	/** CREATE ADDRESS LIST */
	renderAddressList = ({ item, index }) => {
		console.log("INDEX OF ADDRESS:::::::::::", index)
		return (
			<AddressComponent
				data={item}
				index={index}
				isSelectedAddress={this.state.isSelectAddress}
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
			this.state.strFullName !== "" ?
				this.props.saveGuestDetails({
					first_name: this.state.strFullName,
					last_name: this.state.strLastName,
					phone_number: this.state.strPhone,
					phone_code: this.countryCode,
					email: this.state.strEmail
				}) : null
			this.navigateToCheckout(true, onSuccess)

		}
	};

	/**
	 * @param { Failure Response Object } onFailure
	 */
	onFailureCheckOrder = onfailure => {
		this.setState({ isLoading: false });
	};

	/** CALL API FOR CHECK ORDER */
	checkOrderAPI = () => {
		let param = {
			language_slug: this.props.lan,
			// token: this.props.token,
			user_id: this.props.userID,
			order_delivery: 'Delivery',
			users_latitude: this.state.guestAddress !== undefined ? this.state.guestAddress.latitude : this.state.selectedAddress.latitude,
			users_longitude: this.state.guestAddress !== undefined ? this.state.guestAddress.longitude : this.state.selectedAddress.longitude,
			restaurant_id: this.props.navigation.state.params.resId,
			isLoggedIn: (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "") ? 1 : 0

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

	/**
	 * @param { Success Response Object } onSuccess
	 */
	onSucessSchdeule = onSuccess => {
		debugLog('CHECK SCHEDULING SUCCESS ::::::: ', onSuccess);
		this.setState({ isLoading: false });
		if (onSuccess.status === RESPONSE_SUCCESS) {
			this.proceedToCheckout()
		} else {
			showDialogue(onSuccess.message, [], '');
		}
	};

	/**
	 * @param { Failure Response Object } onFailure
	 */
	onFailureSchedule = onfailure => {
		this.setState({ isLoading: false });
	};

	/** CALL API FOR CHECKING SCHEDULING TIME AND DATE */
	validateScheduling = () => {
		let param = {
			language_slug: this.props.lan,
			// token: this.props.token,
			restaurant_id: this.props.navigation.state.params.resId,
			scheduled_date: moment(this.state.currentDate).format("DD-MM-YYYY"),
			slot_open_time: this.state.startTime,
			slot_close_time: this.state.endTime

		};
		this.setState({ isLoading: true });
		netStatus(status => {
			if (status) {
				checkScheduleDelivery(param, this.onSucessSchdeule, this.onFailureSchedule, this.props);
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
					this.setState({ selectedIndex: 0, selectedAddress: onSuccess.address[0] })
					getCountryName(onSuccess.address[0].latitude, onSuccess.address[0].longitude,
						success => {
							if (success[0].short_name !== undefined)
								this.setState({ countryCode: success[0].short_name })

						},
						failure => {
							debugLog("COUNTRY CODE FAILURE :::::", failure)
						}
						, this.props.googleMapKey || GOOGLE_API_KEY)
					this.forceUpdate();
					console.log("Address Array[][][][]", this.arrayAddress)
				} else {

					this.strOnScreenMessage = strings('noDataFound');
				}

				this.setState({ isLoading: false });
			} else {
				// showValidationAlert(onSuccess.message);
				this.strOnScreenMessage = strings('noDataFound');
				this.setState({ isLoading: false });
			}
		} else {
			console.log("onSuccess.status", onSuccess.status)
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

	fetchCards = () => {
		this.state.defaultCard = undefined
		this.state.noDefaultCard = false
		netStatus(status => {
			if (status) {
				this.setState({ isSavedCardLoading: true })
				let userParams = {
					language_slug: this.props.lan,
					user_id: this.props.userID,
					isLoggedIn: 1
				}
				getSavedCardsAPI(userParams, this.onSuccessFetchCards, this.onFailureFetchCards, this.props)
			}
			else {
				this.setState({ isSavedCardLoading: false });
			}
		})
	}

	onSuccessFetchCards = onSuccess => {
		this.noCards = false

		if (onSuccess.stripe_response !== undefined &&
			onSuccess.stripe_response !== null &&
			onSuccess.stripe_response.length !== 0
		) {

			let valid_cards = []
			valid_cards = onSuccess.stripe_response.filter(cardData => { return new Date() < new Date().setFullYear(cardData.card.exp_year, cardData.card.exp_month, 1) })
			this.setState({
				noDefaultCard: !(valid_cards !== undefined && valid_cards !== null && valid_cards.length !== 0 && valid_cards[0].is_default_card == "1"),
				showCardInput: false,
				defaultCard: valid_cards !== undefined && valid_cards !== null && valid_cards.length !== 0 && valid_cards[0].is_default_card == "1" ? valid_cards[0] : undefined
			})
		}
		else {
			debugLog("NO CARDS ::::::")
			this.noCards = true

		}

		this.setState({ isSavedCardLoading: false });
	}

	onFailureFetchCards = onFailure => {
		this.setState({ isSavedCardLoading: false });
	}



	onWillFocus = () => {


		if (this.state.cartItems.map(data => data.in_stock).includes("0"))
			this.isScheduleMandatory = true

		if (this.props.countryArray !== undefined && this.props.countryArray !== null && this.props.countryArray[0] !== undefined && this.props.countryArray[0].phonecode !== undefined) {
			if (this.countryCode == "")
				this.countryCode = this.props.countryArray[0].phonecode
			if (this.state.countryCode == "")
				this.state.countryCode = this.props.countryArray[0].phonecode
		}
		this.setState({ isLoading: false, isPaymentLoading: false })
		if (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "" && this.isAddressChanged !== true)
			this.getAddressList()
		this.getPaymentOptionsAPI()
	}

	/** GET ADDRESS API */
	getAddressList = () => {
		this.strOnScreenMessage = '';
		this.strOnScreenSubtitle = '';
		this.setState({ isLoading: true, selectedIndex: -1 });
		netStatus(status => {
			if (status) {
				let param = {
					language_slug: this.props.lan,
					user_id: this.props.userID || 0,
					// token: this.props.token,
					showonly_main: 1
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

	getPaymentOptionsAPI = () => {
		netStatus(isConnected => {
			if (isConnected) {
				this.setState({ isPaymentLoading: true })

				var params = {
					language_slug: this.props.lan,
					user_id: this.props.userID,
					is_dine_in: '0',
					restaurant_id: this.props.navigation.state.params.resId,
					isLoggedIn: (this.props.userID !== undefined && this.props.userID !== null && this.props.userID !== "") ? 1 : 0
				}

				//console.log('params11',params)
				
				getPaymentList(params, this.onSuccessPaymentList, this.onFailurePaymentList, this.props)
				
			} else {
				showNoInternetAlert()
			}
		})
	}

	onSuccessPaymentList = onSuccess => {
		// return;
		if (onSuccess.allow_scheduled_delivery == "1") {
			this.allowPreOrder = true
			let permitted_dates = Object.keys(onSuccess.datetimeslot_arr)
			if (permitted_dates.length > 0) {
				let temp = permitted_dates

				if (this.isScheduleMandatory) {
					temp = temp.slice(1, temp.length)
				}
				temp.map(data => {

					this.allowedDates[data] = {
						selected: false,
						marked: false,
						dotColor: EDColors.black, disabled: false,
						testDate: data

					}
				})

				let timeslots = onSuccess.datetimeslot_arr
				if (this.isScheduleMandatory) {
					if (permitted_dates.length > 1) {
						let temp = onSuccess.datetimeslot_arr
						delete temp[Object.keys(temp)[0]];
						timeslots = temp
					}
					else
						showDialogue(strings("noTimeSlot"), [], "", this.onBackEventHandler)

				}
				this.min_scheduled_date = moment(permitted_dates[this.isScheduleMandatory ? 1 : 0], "YYYY-MM-DD").toDate()
				this.max_scheduled_date = moment(permitted_dates[permitted_dates.length - 1], "YYYY-MM-DD").toDate()
				this.setState({
					eventDate: moment(this.min_scheduled_date.toString()).format('MMM DD, YYYY'),
					currentDate: this.min_scheduled_date,
					arrTimeSlots: timeslots,
					startTime: Object.values(timeslots)[0][0].start,
					endTime: Object.values(timeslots)[0][0].end
				})
			}
			else
				showDialogue(strings("resNotAccepting"), [], "", this.onBackEventHandler)
		}

		else
			this.allowPreOrder = false
		if (onSuccess.Payment_method !== undefined && onSuccess.Payment_method !== null && onSuccess.Payment_method.length !== 0) {

			this.paymentOptions = onSuccess.Payment_method


			//FETCH SAVED CARDS IN STRIPE PAYMENT IF SUPPORTED
			if (this.props.userID !== undefined && this.props.userID !== null && this.paymentOptions.map(data =>
				data.payment_gateway_slug
			).includes("stripe"))
				this.fetchCards()

			if (this.state.selectedOption !== "stripe")
				this.setState({ selectedOption: onSuccess.Payment_method[0].payment_gateway_slug })
			this.forceUpdate();
		}
		if (onSuccess.orderMode !== undefined && onSuccess.orderMode !== null && onSuccess.orderMode !== '') {
			let orderModes = onSuccess.orderMode.split(',')
			if (orderModes.length == 1) {
				if (orderModes.includes("Delivery") && this.state.value == 0) {
					this.setState({ value: 1 })
				}
				if (orderModes.includes("PickUp") && this.state.value == 1) {
					this.setState({ value: 0 })
				}
			}
			this.setState({ availableOrderModes: orderModes })
		}
		else {
			this.setState({ value: -1 })

		}
		this.setState({ isPaymentLoading: false })

	}

	onFailurePaymentList = onFailure => {
		console.log('::::::::::: PAYMENT FALURE', onFailure)
		showValidationAlert(onFailure.message)
		this.setState({ isPaymentLoading: false })
	}



	//#region DELETE ADDRESS
	/**
	 * 
	 * @param { Success Response Object } onSuccess 
	 */
	onSuccessDeleteAddress = onSuccess => {
		console.log('Address Delete response ::::: ', onSuccess);
		if (onSuccess != undefined) {
			if (onSuccess.status == RESPONSE_SUCCESS) {
				this.getAddressList();
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
	deleteAddress(addId) {
		netStatus(status => {
			if (status) {
				this.setState({ isLoading: true });
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

	addressSelectionAction = index => {
		this.setState({ selectedIndex: index });
	};
}
//#endregion

//#region STYLES
const style = StyleSheet.create({
	dataView: { flex: 1, marginHorizontal: 10, alignItems: 'center', marginBottom: 5, justifyContent: "space-between" },
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
	themeButton: {
		backgroundColor: EDColors.homeButtonColor,
		borderRadius: 16,
		width: "100%",
		height: Platform.OS == 'android' ? heightPercentageToDP('6%') : heightPercentageToDP('6.0%'),
		justifyContent: 'center',
		alignSelf: 'center',
		flexDirection: 'row',
		marginBottom: 20,
		alignItems: 'center',
		paddingHorizontal: 10,

	},
	themeButtonText: {
		color: EDColors.white,
		textAlign: 'center',
		fontFamily: EDFonts.semiBold,
		fontSize: getProportionalFontSize(17),
	},
	deliveryTextStyle: { color: EDColors.primary, textAlignVertical: "center", marginTop: 2, marginHorizontal: 5 },
	touchableView: { marginVertical: 15, justifyContent: "space-between", marginHorizontal: 15 },
	headerIconStyle: { marginHorizontal: 15 },
	deliveryOptionView: { marginHorizontal: 20, backgroundColor: EDColors.white, borderWidth: 2, borderRadius: 16, borderColor: EDColors.white, marginBottom: 10, shadowColor: "rgba(0, 0, 0, 0.05)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2, },
	childDeliveryOptionView: {},
	footerStyle: { marginTop: 20, marginHorizontal: 10, backgroundColor: EDColors.white, borderWidth: 2, borderColor: EDColors.separatorColorNew, borderRadius: 16, alignItems: "center" },
	editIconStyle: { marginHorizontal: 15 },
	continueStyle: {
		width: '100%',
		height: metrics.screenHeight * 0.08,
		backgroundColor: EDColors.backgroundLight,
		marginBottom: 10,
	},
	counterStyle: {
		marginHorizontal: 20,
		marginTop: 5,
		fontSize: getProportionalFontSize(12),
		color: EDColors.text
	},
	contButtonStyle: {
		alignSelf: 'center',
		backgroundColor: EDColors.primary,
		justifyContent: 'center',
		marginTop: 5,
		marginBottom: 5,
		width: '90%',
		borderRadius: 16,
		height: heightPercentageToDP('7.5%'),
		textAlignVertical: "center",
		paddingVertical: 0
	},

	addView: {
		alignItems: 'center',
		padding: 10,
	},
	titleText: {
		color: EDColors.black,
		fontSize: getProportionalFontSize(15),
		fontFamily: EDFonts.semiBold,
		marginHorizontal: 10,
		flex: 1,
	},
	noAddress: {
		color: EDColors.error,
		fontSize: getProportionalFontSize(15),
		fontFamily: EDFonts.regular,
		marginHorizontal: 15,
		marginVertical: 10
	},
	textStyle: {
		fontSize: getProportionalFontSize(14),
		fontFamily: EDFonts.regular,
		flex: 1,
		padding: 5,
	},
	orderView: { fontSize: getProportionalFontSize(15), padding: 10, margin: 10, fontFamily: EDFonts.semiBold, color: EDColors.black, },
	orderText: { fontSize: getProportionalFontSize(16) },
	separatorView: { marginHorizontal: 10, borderColor: EDColors.placeholder, borderWidth: 0.5 },
	subContainer: {
		// flexDirection: "row",
		margin: 10,
		backgroundColor: EDColors.transparentBackground,
		// borderRadius: 6,
		padding: 10,
		// justifyContent: "center",
		marginHorizontal: 20,
		backgroundColor: EDColors.white, borderWidth: 2, borderRadius: 16, borderColor: EDColors.white, shadowColor: EDColors.shadowColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.8, shadowRadius: 2,
	},
	paymentMethodTitle: {
		// flex: 1,
		fontFamily: EDFonts.medium,
		fontSize: getProportionalFontSize(14),
		color: "#000",
		marginVertical: 10,
		marginStart: 10
	},
	verifiedText: {
		flex: 1,
		fontFamily: EDFonts.medium,
		fontSize: getProportionalFontSize(13),
	},
	paymentIconStyle: { marginHorizontal: 10 },
	paymentHeader: {
		fontSize: getProportionalFontSize(16),
		fontFamily: EDFonts.bold,
		color: EDColors.black,
		marginHorizontal: 15,
		marginTop: 20
	},
	contactView: {
		marginVertical: 10,
		marginHorizontal: 15
	},
	cardView: {
		alignItems: "center",
		justifyContent: "space-between",
		flex: 1,
		borderTopColor: EDColors.separatorColorNew,
		borderTopWidth: 1,
		paddingTop: 15,
		marginTop: 5,
		paddingHorizontal: 10
	},
	cardSubView: {
		alignItems: "center",
		flex: 1,

	},
	last4Text: {
		fontFamily: EDFonts.medium,
		fontSize: getProportionalFontSize(14),
		color: EDColors.black
	},
	expiredText: {
		fontFamily: EDFonts.regular,
		fontSize: getProportionalFontSize(13),
		color: EDColors.mastercard
	},
	changeCard: {
		fontFamily: EDFonts.semiBold,
		fontSize: getProportionalFontSize(13),
		color: EDColors.primary,
		// flex: 1,
		textAlign: "right",
		textDecorationLine: "underline",
		marginLeft: 10
	},
	datePickerView: { marginBottom: 10, paddingHorizontal: 10, alignItems: "center", marginHorizontal: 10, height: 30, borderRadius: 8, borderWidth: 1, borderColor: '#EDEDED' },
	dayPickerView: { backgroundColor: EDColors.white, alignItems: "center", alignSelf: 'center', marginHorizontal: 10, height: 30, width: metrics.screenWidth * 0.30, borderRadius: 8, borderWidth: 1, borderColor: '#EDEDED' },
	dateTimeText: { color: "#000", marginHorizontal: 5, fontSize: getProportionalFontSize(13), fontFamily: EDFonts.semiBold },
	dateView: { flex: 2, margin: 5, marginTop: 5, borderRadius: 16, backgroundColor: EDColors.white, },
	timeTextStyle: { fontSize: getProportionalFontSize(13), fontFamily: EDFonts.medium, color: EDColors.black, marginTop: 7, paddingHorizontal: 10 },
	pickerView: { alignItems: "center", marginHorizontal: 10, height: 30, borderRadius: 8, borderWidth: 1, borderColor: '#EDEDED' },
	timeView: { flex: 2, margin: 5, marginTop: 5, borderRadius: 16, backgroundColor: EDColors.white, },
	countText: { marginHorizontal: 10, fontSize: getProportionalFontSize(14), fontFamily: EDFonts.medium, color: EDColors.black },
	datePickerText: { fontSize: getProportionalFontSize(13), fontFamily: EDFonts.medium, color: EDColors.black, marginTop: 7 },
	dayPickerText: { paddingHorizontal: 4, textAlign: 'center', flex: 0, fontSize: getProportionalFontSize(13), fontFamily: EDFonts.medium, color: EDColors.black },
	packText: { margin: 5, fontSize: getProportionalFontSize(18), fontFamily: EDFonts.semiBold, color: EDColors.newColor, },
	themBtnStyle: { alignSelf: 'center', margin: 10, width: metrics.screenWidth * 0.90, height: metrics.screenHeight * 0.075, backgroundColor: EDColors.primary, borderRadius: 16 },
	dateIcon: { marginTop: 7 },
	thenBtnText: { fontSize: getProportionalFontSize(16), fontFamily: EDFonts.semiBold },
	personIconStyle: { margin: 5 },
	dateText: { marginHorizontal: 5, fontSize: getProportionalFontSize(14), fontFamily: EDFonts.semiBold, color: "#000" },
	countView: { marginTop: 10, marginHorizontal: 10, alignItems: "center", alignSelf: "center", borderRadius: 8, width: 80, height: 30, justifyContent: 'flex-end', backgroundColor: "#fff", borderWidth: 1, borderColor: '#EDEDED' },
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
			orderModeInRedux: state.userOperations.orderMode,
			countryArray: state.userOperations.countryArray,
			currentLocation: state.userOperations.currentLocation || {},
			googleMapKey: state.userOperations.googleMapKey

		};
	},
	dispatch => {
		return {
			saveCheckoutDetails: checkoutData => {
				dispatch(saveCheckoutDetails(checkoutData));
			},
			saveGuestAddress: checkoutData => {
				dispatch(saveGuestAddress(checkoutData));
			},
			saveGuestDetails: checkoutData => {
				dispatch(saveGuestDetails(checkoutData));
			},
		};
	}
)(AddressListContainer);
