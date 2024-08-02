import { check, request, RESULTS, requestNotifications } from 'react-native-permissions';
import { debugLog } from './EDConstants';

export async function requestPermission(paramPermission, onSuccess, onFailure) {
    request(paramPermission)
        .then((result) => {
            switch (result) {
                case RESULTS.UNAVAILABLE: {
                    console.log('::: REQUEST UNAVAILABLE :::')
                    onFailure(result)
                    break;
                }
                case RESULTS.DENIED: {
                    console.log('::: REQUEST DENIED :::')
                    onFailure(result)
                    break;
                }
                case RESULTS.GRANTED: {
                    console.log('::: REQUEST GRANTED :::')
                    onSuccess(result)
                    break;
                }
                case RESULTS.BLOCKED: {
                    console.log('::: REQUEST BLOCKED :::')
                    onFailure(result)
                    break;
                }
            }
        })
}

export async function checkPermission(paramPermission, onSuccess, onFailure) {
    console.log("::: CHECK paramPermission :::", paramPermission)

    check(paramPermission)
        .then((result) => {
            switch (result) {
                case RESULTS.UNAVAILABLE: {
                    console.log("::: CHECK UNAVAILABLE :::")
                    requestPermission(paramPermission, onSuccess, onFailure)
                    break;
                }
                case RESULTS.DENIED: {
                    console.log("::: CHECK DENIED :::")
                    requestPermission(paramPermission, onSuccess, onFailure)
                    break;
                }
                case RESULTS.GRANTED: {
                    console.log("::: CHECK GRANTED :::")
                    onSuccess(result)
                    // requestPermission(paramPermission, onSuccess, onFailure)
                    break;
                }
                case RESULTS.BLOCKED: {
                    console.log("::: CHECK BLOCKED :::")
                    onFailure(result)
                     requestPermission(paramPermission, onSuccess, onFailure)
                    break;
                }
            }
        })
}

export async function requestNotificationPermission(onSuccess, onFailure) {
    requestNotifications([]).then(({ status, settings }) => {
        debugLog("STATUS AND SETTINGS :::::", status, settings)
        switch (status) {
            case RESULTS.UNAVAILABLE: {
                console.log("::: CHECK UNAVAILABLE :::")
                requestNotificationPermission( onSuccess, onFailure)
                break;
            }
            case RESULTS.DENIED: {
                console.log("::: CHECK DENIED :::")
                requestNotificationPermission( onSuccess, onFailure)
                break;
            }
            case RESULTS.GRANTED: {
                console.log("::: CHECK GRANTED :::")
                onSuccess(status)
                // requestPermission(paramPermission, onSuccess, onFailure)
                break;
            }
            case RESULTS.BLOCKED: {
                console.log("::: CHECK BLOCKED :::")
                onFailure(status)
                // requestPermission(paramPermission, onSuccess, onFailure)
                break;
            }
        }
    })
}

