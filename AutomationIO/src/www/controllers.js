/*
 * Copyright (c) 2015 Intel Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var BLUETOOTH = null;
var DEVICE = null;
var NAVIGATOR = null;
var STATUS_BAR = null;
var TOAST = null;

var BLUETOOTH_DISABLED = 1000;
var BLUETOOTH_ENABLED = 1001;
var BLUETOOTH_CONNECTING = 1002;
var BLUETOOTH_CONNECTED = 1003;
var BLUETOOTH_DISCONNECTING = 1004;
var BLUETOOTH_DISCONNECTED = 1005;

angular.module('bleApplication.controllers', [])

.controller('ApplicationController', ['$scope', '$ionicPlatform', function($scope, $ionicPlatform) 
{
    $scope.applicationProperties = {};
    
    $scope.logs = [];
    $scope.bluetoothIcon = {};
    $scope.homeListIcon = {};
    
    $scope.applicationProperties.pinsListener = null;
    
    $scope.applicationProperties.FOUND_BOARDS = [];
    
    $scope.applicationProperties.BOARD = 
    {
        name: null,
        address: null,
        serviceUuid: null,
        deviceObject: null,
        pins: []
    };
    
    $scope.applicationProperties.TOASTS = 
    {
        show: "YES",
        buttonStyle: "button-balanced"
    };
    
    $scope.applicationProperties.BLUETOOTH = 
    {
        status: "",
        disableOnClose: "YES",
        buttonStyle: "button-balanced"
    };

    ////////////////////////////////////////////////////////////
    
    $scope.applicationProperties.Two8bitBytesToOneInt = function(byteHigh, byteLow)
    {
        return (byteHigh << 8 ) | (byteLow & 0xFF);
    };
    
    $scope.applicationProperties.ToggleToast = function()
    {
        if ($scope.applicationProperties.TOASTS.show == "YES")
        {
            $scope.applicationProperties.TOASTS.buttonStyle = "button-energized";
            $scope.applicationProperties.TOASTS.show = "NO";
        }
        else
        {
            $scope.applicationProperties.TOASTS.buttonStyle = "button-balanced";
            $scope.applicationProperties.TOASTS.show = "YES";
        }
        
        $scope.$apply();
    };
    
    $scope.applicationProperties.ToggleBluetooth = function()
    {
        if ($scope.applicationProperties.BLUETOOTH.disableOnClose == "YES")
        {
            $scope.applicationProperties.BLUETOOTH.buttonStyle = "button-energized";
            $scope.applicationProperties.BLUETOOTH.disableOnClose = "NO";
        }
        else
        {
            $scope.applicationProperties.BLUETOOTH.buttonStyle = "button-balanced";
            $scope.applicationProperties.BLUETOOTH.disableOnClose = "YES";
        }
        
        $scope.$apply();
    };
    
    $scope.applicationProperties.WriteLog = function(message, type)
    {
        var getCurrentTime = function()
        {
            var now = new Date();
            return (now.getHours() + ':' +
                     ((now.getMinutes() < 10)
                         ? ("0" + now.getMinutes())
                         : (now.getMinutes())) + ':' +
                     ((now.getSeconds() < 10)
                         ? ("0" + now.getSeconds())
                         : (now.getSeconds())));
        };

        var log = {message: "[" + getCurrentTime() + "] " + message, type: type};
        
        $scope.logs.push(log);
        $scope.$apply();
    };
    
    $scope.applicationProperties.ShowToast = function(message)
    {
        if ($scope.applicationProperties.TOASTS.show == "YES")
        {
            TOAST.showShortBottom(message); 
        }
    };
    
    $scope.applicationProperties.SetStatus = function(status, object)
    {
        switch (status)
        {
            case "disabled":
                $scope.applicationProperties.BLUETOOTH.status = BLUETOOTH_DISABLED;
                $scope.applicationProperties.WriteLog("Bluetooth is disabled, no board is connected", "warning");
                $scope.applicationProperties.ShowToast("Bluetooth is disabled, no board is connected");
                break;

            case "enabled":
                $scope.applicationProperties.BLUETOOTH.status = BLUETOOTH_ENABLED;
                $scope.applicationProperties.WriteLog("Bluetooth is enabled, no board is connected", "normal");
                $scope.applicationProperties.ShowToast("Bluetooth is enabled, no board is connected");
                break;
                
            case "connecting":
                $scope.applicationProperties.BLUETOOTH.status = BLUETOOTH_CONNECTING;
                $scope.applicationProperties.WriteLog("Bluetooth is connecting...", "normal");
                $scope.applicationProperties.ShowToast("Bluetooth is connecting...");
                break;

            case "connected":
                $scope.applicationProperties.BLUETOOTH.status = BLUETOOTH_CONNECTED;
                $scope.applicationProperties.WriteLog("Bluetooth is connected to: " + object.name, "normal");
                $scope.applicationProperties.ShowToast("Bluetooth is connected to: " + object.name);
                break;
                
            case "disconnecting":
                $scope.applicationProperties.BLUETOOTH.status = BLUETOOTH_DISCONNECTING;
                $scope.applicationProperties.WriteLog("Bluetooth is disconnecting...", "warning");
                $scope.applicationProperties.ShowToast("Bluetooth is disconnecting...");
                break;
                
            case "disconnected":
                $scope.applicationProperties.BLUETOOTH.status = BLUETOOTH_DISCONNECTED;
                $scope.applicationProperties.WriteLog("Bluetooth is disconnected from: " + object.name, "warning");
                $scope.applicationProperties.ShowToast("Bluetooth is disconnected from: " + object.name);
                break;
                
            case "error":
                $scope.applicationProperties.WriteLog(object.message, "error");
                $scope.applicationProperties.ShowToast(object.message);
                break;
        }
        
        $scope.applicationProperties.SetIcon(status);
    };
    
    $scope.applicationProperties.SetIcon = function(status)
    {
        switch (status)
        {
            case "disabled":
                $scope.bluetoothStatus = "Bluetooth is disabled, no board is connected";
                $scope.bluetoothIcon.class = "grey";
                $scope.homeListIcon.first = "ion-android-arrow-forward";
                $scope.homeListIcon.second = "ion-android-arrow-forward";
                $scope.homeListIcon.third = "ion-android-arrow-forward";
                break;

            case "enabled":
            case "disconnected":
                $scope.bluetoothStatus = "Bluetooth is enabled, but no board is connected";
                $scope.bluetoothIcon.class = "green";
                $scope.homeListIcon.first = "ion-android-checkbox-outline";
                $scope.homeListIcon.second = "ion-android-arrow-forward";
                break;

            case "connected":
                $scope.bluetoothStatus = "Bluetooth is connected with the board";
                $scope.bluetoothIcon.class = "blue";
                $scope.homeListIcon.first = "ion-android-checkbox-outline";
                $scope.homeListIcon.second = "ion-android-checkbox-outline";
                break;
        }
        
        $scope.$apply();
    };
    
    $scope.applicationProperties.EnableBluetooth = function()
	{ 
        if (DEVICE.platform == "Android")
        {
            BLUETOOTH.isEnabled
            (
                //callback
                function(returnedObject)
                {
                    if (returnedObject.isEnabled === false)
                    {
                        BLUETOOTH.enable
                        (
                            //onBluetoothEnable
                            function()
                            {
                                //not in use
                                //BLUETOOTH.initialize callback used instead
                            },
                            //onBluetoothEnableError
                            function(errorObject)
                            {
                                $scope.applicationProperties.SetStatus("error", errorObject);
                            }
                        );
                    }
                }
            );
        }
	};
    
    $scope.applicationProperties.CloseConnection = function(success, error)
    {
        BLUETOOTH.close
        (
            //onCloseSuccess
            function(returnedObject)
            {
                if (returnedObject.status == "closed")
                {
                    $scope.applicationProperties.WriteLog("Bluetooth closed", "normal");
                    $scope.applicationProperties.ShowToast("Bluetooth closed");
                    success();
                }
            },
            //onDisconnectError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address
            }
        );
    };
    
    $scope.applicationProperties.ReadDescriptor = function(success, error, pin)
    {
        BLUETOOTH.readDescriptor
        (
            //onReadSuccess
            function(returnedObject)
            {
                if (returnedObject.status == "readDescriptor")
                {
                    success(BLUETOOTH.bytesToString(BLUETOOTH.encodedStringToBytes(returnedObject.value)));
                }
            }, 
            //onReadError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address,
                serviceUuid: $scope.applicationProperties.BOARD.serviceUuid,
                characteristicUuid: pin.characteristicUuid,
                characteristicId: pin.characteristicId,
                descriptorUuid: pin.descriptor.descriptorUuid
            }
        );
    };
    
    $scope.applicationProperties.ReadPinNumbers = function()
    {
        var index = 0;
        var length = $scope.applicationProperties.BOARD.pins.length;

        var pinReader = setInterval
        (
            function()
            {
                if (index == length)
                {
                    clearInterval(pinReader);
                    return;
                }
                
                $scope.applicationProperties.ReadDescriptor
                (
                    //onSuccess
                    function(returnedValue)
                    {
                        $scope.applicationProperties.BOARD.pins[index].number = returnedValue;
                        index++;
                    },
                    //onError
                    function(errorObject)
                    {
                        $scope.applicationProperties.SetStatus("error", errorObject);
                    },
                    //params
                    $scope.applicationProperties.BOARD.pins[index]
                );
            },
            //wait
            500
        );
    }; 
    
    $scope.applicationProperties.AdjustFirstStepDescription = function()
    {
        if (DEVICE.platform == "Android")
        {
            $scope.firstStepDescription = "Tap to enable the Bluetooth";
        }
        else
        {
            $scope.firstStepDescription = "Enable the Bluetooth in control panel";
        }
        
        $scope.$apply();
    };
    
    ////////////////////////////////////////////////////////////

    $ionicPlatform.ready(function() 
	{
        document.addEventListener("deviceready", function() 
        {
            BLUETOOTH = bluetoothle;
            DEVICE = device;
            NAVIGATOR = window.navigator;
            STATUS_BAR = window.StatusBar;
            TOAST = window.plugins.toast;
            
            //////////////////////////  
            
            NAVIGATOR.splashscreen.hide();
            STATUS_BAR.styleDefault();
            
            BLUETOOTH.initialize
            (
                //onBluetoothEnabled
                function()
                {
                    $scope.applicationProperties.SetIcon("enabled");
                    $scope.$apply();
                },
                //onBluetoothDisabled
                function()
                {
                    $scope.applicationProperties.SetIcon("disabled");
                    $scope.$apply();
                },
                //params
                {
                    request: false,
                    statusReceiver: true
                }
            );
            
            $scope.applicationProperties.AdjustFirstStepDescription();
        });
	});
}])

.controller('HomeController', function($scope, $stateParams) 
{
    //not in use
})

.controller('PinsController', function($scope, $stateParams, $ionicPopup) 
{
    if ($scope.applicationProperties.pinsListener == null)
    {
        $scope.applicationProperties.pinsListener = setInterval
        (
            function()
            {
                $scope.$apply();
            },
            //wait miliseconds
            200
        );
    }

    $scope.SubscribeToPin = function(pin, success, error)
    {
        BLUETOOTH.subscribe
        (
            function(returnedObject)
            {
                //onSubscribe
                if (returnedObject.status == "subscribed")
                {
                    $scope.applicationProperties.WriteLog("Subscribed to pin: " + pin.number, "normal");
                    $scope.applicationProperties.ShowToast("Subscribed to pin: " + pin.number);
                }
                //onDataReceived
                else if (returnedObject.status == "subscribedResult")
                {          
                    var object = 
                    {
                        characteristicUuid: returnedObject.characteristicUuid,
                        characteristicId: returnedObject.characteristicId,
                        data: BLUETOOTH.encodedStringToBytes(returnedObject.value)
                    };

                    success(object);
                }
            },
            //onSubscribeError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address,
                serviceUuid: $scope.applicationProperties.BOARD.serviceUuid,
                characteristicUuid: pin.characteristicUuid,
                characteristicId: pin.characteristicId,
                isNotification: true
            }
        );  
    };
    
    $scope.UnsubscribeFromPin = function(pin, success, error)
    {
        BLUETOOTH.unsubscribe
        (
            function(returnedObject)
            {
                //onUnsubscribe
                if (returnedObject.status == "unsubscribed")
                {
                    $scope.applicationProperties.WriteLog("Unsubscribed from pin: " + pin.number, "normal");
                    $scope.applicationProperties.ShowToast("Unsubscribed from pin: " + pin.number);
                    success();
                }
            },
            //onUnsubscribeError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address,
                serviceUuid: $scope.applicationProperties.BOARD.serviceUuid,
                characteristicUuid: pin.characteristicUuid,
                characteristicId: pin.characteristicId
            }
        );  
    };
    
    $scope.ListenAnalogPin = function(pin)
    {
        $scope.SubscribeToPin
        (
            pin, 
            //onSuccess
            function(returnedObject)
            {
                for (var a = 0; a < $scope.applicationProperties.BOARD.pins.length; a++)
                {
                    if ($scope.applicationProperties.BOARD.pins[a].characteristicId == returnedObject.characteristicId && $scope.applicationProperties.BOARD.pins[a].characteristicUuid == returnedObject.characteristicUuid)
                    {
                        $scope.applicationProperties.BOARD.pins[a].value = $scope.applicationProperties.Two8bitBytesToOneInt(returnedObject.data[1], returnedObject.data[0]);
                        break;
                    }
                }
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };  
    
    $scope.ListenDigitalPin = function(pin)
    {
        $scope.SubscribeToPin
        (
            pin, 
            //onSuccess
            function(returnedObject)
            {
                for (var a = 0; a < $scope.applicationProperties.BOARD.pins.length; a++)
                {
                    if ($scope.applicationProperties.BOARD.pins[a].characteristicId == returnedObject.characteristicId && $scope.applicationProperties.BOARD.pins[a].characteristicUuid == returnedObject.characteristicUuid)
                    {
                        var decimalValue = BLUETOOTH.convert.toDec(returnedObject.data[0]);
                        decimalValue = (decimalValue == 0) ? "HIGH" : "LOW";
                        $scope.applicationProperties.BOARD.pins[a].value = decimalValue;
                        break;
                    }
                }
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    }; 
    
    $scope.DontListenPin = function(pin)
    {
        $scope.UnsubscribeFromPin
        (
            pin, 
            //onSuccess
            function()
            {
                //not in use
                //info about unsubscribing already shown
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };
    
    $scope.WriteToPin = function(pin, data, success, error)
    {    
        BLUETOOTH.write
        (
            //onWriteSuccess
            function()
            {
                success();
            },
            //onWriteError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                value: data,
                serviceUuid: $scope.applicationProperties.BOARD.serviceUuid,
                characteristicUuid: pin.characteristicUuid,
                characteristicId: pin.characteristicId,
                address: applicationProperties.BOARD.address,
                type: "noResponse"
            }
        );
    };
    
    $scope.DigitalOut = function(pin, success, error)
    {
        var bytes = new Uint8Array(1);
        bytes[0] = (pin.value == 1) ? 0x40 : 0x00;
        $scope.WriteToPin(pin, BLUETOOTH.bytesToEncodedString(data), success, error);
    };
    
    $scope.AnalogOut = function(pin, success, error)
    {
        var buffer = new ArrayBuffer(2);
        var dataView = new DataView(buffer).setUint16(0, pin.value, true);
        $scope.WriteToPin(pin, BLUETOOTH.bytesToEncodedString(buffer), success, error);
    };
    
    $scope.DigitalChange = function(pin)
    {
        if (pin.value == 0)
        {
            pin.value = 1;
        }
        else
        {
            pin.value = 0;
        }
        
        $scope.applicationProperties.BOARD.pins[pin.index].value = pin.value;
        
        $scope.DigitalOut
        (
            pin,
            //onSuccess
            function()
            {
                $scope.applicationProperties.WriteLog("Pin " + pin.number + " changed to: " + pin.value, "normal");
                $scope.applicationProperties.ShowToast("Pin " + pin.number + " changed to: " + pin.value);
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };
    
    $scope.AnalogChange = function(pin)
    {    
        $scope.applicationProperties.BOARD.pins[pin.index].value = pin.value;
        
        $scope.AnalogOut
        (
            pin,
            //onSuccess
            function()
            {
                $scope.applicationProperties.WriteLog("Pin " + pin.number + " changed to: " + pin.value, "normal");
                $scope.applicationProperties.ShowToast("Pin " + pin.number + " changed to: " + pin.value);
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };

    $scope.GetNumberOfUsed = function(type, direction)
    {
        var counter = 0;
        
        $scope.applicationProperties.BOARD.pins.forEach(function(pin)
        {
            if (pin.inUse == "YES" && pin.type == type && pin.direction == direction)
            {
                counter++;
            }
        });
        
        return counter;
    };
    
    $scope.ToggleSelectedPin = function(pin)
    {
        if (pin.inUse == "NO")
        {
            $scope.applicationProperties.BOARD.pins[pin.index].inUse = "YES";
        }
        else
        {
            $scope.applicationProperties.BOARD.pins[pin.index].inUse = "NO";
        }
        
        if ($scope.applicationProperties.BOARD.pins[pin.index].inUse == "YES")
        {
            if (pin.type == "DIGITAL" && pin.direction == "IN")
            {
                $scope.ListenDigitalPin(pin);
            }
            else if (pin.type == "ANALOG" && pin.direction == "IN")
            {
                $scope.ListenAnalogPin(pin);
            }
        }
        else if ($scope.applicationProperties.BOARD.pins[pin.index].inUse == "NO")
        {
            if ((pin.type == "DIGITAL" && pin.direction == "IN") || (pin.type == "ANALOG" && pin.direction == "IN"))
            {
                $scope.DontListenPin(pin);
            }
        }
        
        if ($scope.applicationProperties.BOARD.pins[pin.index].style == "button-balanced")
        {
            $scope.applicationProperties.BOARD.pins[pin.index].style = "button-dark";
        }
        else
        {
            $scope.applicationProperties.BOARD.pins[pin.index].style = "button-balanced";
        }
        
        $scope.$apply();
    };
    
    $scope.AddRemovePinPopup = function()
    {
        var addPinPopup = $ionicPopup.show(
        {
            templateUrl: "app/pin.html",
            title: '<b>Add or remove pins to manage</b>',
            scope: $scope,
            buttons: 
            [
                {
                    text: 'OK', 
                    type: 'button-stable', 
                    onTap: function(e)
                    {
                        return {button: "OK"};
                    }
                }
            ]
        });
        
        addPinPopup.then(function(result) 
        {
			if (result.button == "OK")
				window.location.assign("#/app/pins");
        });
    };
})

.controller('BoardsController', function($scope, $stateParams) 
{
    $scope.bar =
    {
        text: "",
        visible: false
    };
    
    $scope.button =
    {
        text: "",
        style: "",
        visible: false,
    };

    $scope.DIGITAL_UUID = "2a56";
    $scope.ANALOG_UUID =  "2a58";
    $scope.DESCRIPTOR_PIN_UUID = "2901";
    $scope.AUTOMATION_IO_SERVICE_UUID = "1815";
    
    $scope.IsBoardUnique = function(boardObject)
    {
        var isUnique;
        
        $scope.applicationProperties.FOUND_BOARDS.forEach(function(foundBoard)
        {
            if (foundBoard.address == boardObject.address)
            {
                isUnique = false;
            }
        });
        
        return (isUnique === false) ? false : true;
    };
    
    $scope.RetrievePins = function(deviceObject)
    {
        for (var a = 0; a < deviceObject.services.length; a++)
        {
            if (deviceObject.services[a].serviceUuid == $scope.AUTOMATION_IO_SERVICE_UUID)
            {
                for (var b = 0; b < deviceObject.services[a].characteristics.length; b++)
                {
                    var pin = 
                    {
                        number: "",
                        type: "",
                        direction: "",
                        characteristicUuid: deviceObject.services[a].characteristics[b].characteristicUuid,
                        characteristicId: deviceObject.services[a].characteristics[b].characteristicId,
                        descriptor: null,
                        inUse: "NO",
                        index: b,
                        value: "?",
                        checked: false,
                        style: "button-balanced"
                    };

                    if (deviceObject.services[a].characteristics[b].characteristicUuid == $scope.DIGITAL_UUID)
                    {
                        pin.type = "DIGITAL";
                    }
                    else if (deviceObject.services[a].characteristics[b].characteristicUuid == $scope.ANALOG_UUID)
                    {
                        pin.type = "ANALOG";
                    }

                    if (deviceObject.services[a].characteristics[b].properties.hasOwnProperty("read"))
                    {
                        pin.direction = "IN";
                    }
                    else if (deviceObject.services[a].characteristics[b].properties.hasOwnProperty("write"))
                    {
                        pin.direction = "OUT";
                    }
                    
                    for (var c = 0; c < deviceObject.services[a].characteristics[b].descriptors.length; c++)
                    {
                        if (deviceObject.services[a].characteristics[b].descriptors[c].descriptorUuid == $scope.DESCRIPTOR_PIN_UUID)
                        {
                            pin.descriptor = deviceObject.services[a].characteristics[b].descriptors[c];
                        }
                    }

                    $scope.applicationProperties.BOARD.pins.push(pin);
                    $scope.$apply();
                }
            }
        }
    };
    
    $scope.GoToHome = function()
    {
        setTimeout
        (
            //go to home screen after 1 second
            function()
            {
                window.location.assign("#/app/home");
            },
            //wait time
            $scope.applicationProperties.BOARD.pins.length * 500
        );
    };
    
    $scope.Action = function(boardObject)
    {
        $scope.IsBluetoothConnected
        (
            //yes
            function()
            {
                $scope.Disconnect();
            },
            //no
            function()
            {
                $scope.Connect(boardObject);
            }
        );
    };

    $scope.ConnectToBoard = function(success, error, params)
    {    
        BLUETOOTH.connect
        (
            //onConnectSuccess
			function(returnedObject)
			{
                if (returnedObject.status == "connected")
                {
                    $scope.applicationProperties.BOARD.address = params.address;
                    $scope.applicationProperties.BOARD.name = returnedObject.name;
                    $scope.applicationProperties.SetStatus("connected", returnedObject);
                    success();
                }
            },
            //onConnectionError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                address: params.address
            }
        );
    };
    
    $scope.Reconnect = function(boardObject)
    {
        $scope.ReconnectToBoard
        (
            //onSuccess
            function()
            {
                $scope.ActionAfterConnected();
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
                $scope.button.visible = false;
                $scope.$apply();
            },
            //params
            boardObject
        );
    };
    
    $scope.ReconnectToBoard = function(success, error, params)
    {
        BLUETOOTH.reconnect
        (
            //onReconnectSuccess
            function(returnedObject)
            {
                if (returnedObject.status == "connected")
                {
                    $scope.applicationProperties.BOARD.address = params.address;
                    $scope.applicationProperties.BOARD.name = returnedObject.name;
                    $scope.applicationProperties.SetStatus("connected", returnedObject);
                    success();
                }
            },
            //onReconnectError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                address: params.address
            }
        );
    };
    
    $scope.ActionAfterConnected = function()
    {
        $scope.Discover
        (
            function()
            {
                $scope.GoToHome();
                $scope.bar.visible = true;
                $scope.bar.text = "Reading pins data. Please wait...";
                $scope.$apply();
                $scope.applicationProperties.ReadPinNumbers();
            }
        );
    };
        
    $scope.Connect = function(boardObject)
    {
        $scope.button.visible = false;
        $scope.bar.visible = true;
        $scope.bar.text = "Connecting to board. Please wait...";
        $scope.applicationProperties.BOARD.name = boardObject.name;
        $scope.applicationProperties.BOARD.address = boardObject.address;
        $scope.applicationProperties.FOUND_BOARDS = [];
        $scope.applicationProperties.FOUND_BOARDS.push($scope.applicationProperties.BOARD);
        $scope.$apply();

        $scope.ConnectToBoard
        (
            //onSuccess
            function()
            {
                $scope.ActionAfterConnected();
            },
            //onError
            function()
            {
                $scope.Reconnect(boardObject);
            },
            //params
            boardObject
        );
    };
    
    $scope.IsBluetoothConnected = function(yes, no)
    {
        BLUETOOTH.isConnected
        (
            //callback
            function(returnedObject)
            {
                if (returnedObject.isConnected === true)
                {
                    yes();
                }
                else
                {
                    no();
                }
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address
            }
        );
    };
    
    $scope.DiscoverBoard = function(success, error)
    {
        BLUETOOTH.discover
        (
            //onDiscovered
            function(deviceObject)
            {
                if (deviceObject.status == "discovered")
                {
                    $scope.applicationProperties.BOARD.deviceObject = deviceObject;
                    success(deviceObject);
                }
            },
            //onDiscoveredError
            function(errorObject)
            {
                error(errorObject);
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address
            }
        );
    };
    
    $scope.Discover = function(callback)
    {
        $scope.DiscoverBoard
        (
            //onDiscovered
            function(deviceObject)
            {
                $scope.RetrievePins(deviceObject);
                callback();
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };
    
    $scope.SearchForBoards = function()
    {
        var SCAN_TIME = 3000;
        
        $scope.bar.text = "Scanning for boards. Please wait...";
        $scope.bar.visible = true;
        $scope.button.visible = false;
        $scope.$apply();
        
        BLUETOOTH.startScan
        (
            //onStartScanSuccess
            function(returnedObject)
            {
                if (returnedObject.status == "scanStarted")
                {
                    $scope.applicationProperties.WriteLog("Scanning for boards", "normal");
                    $scope.applicationProperties.ShowToast("Scanning for boards");
                }
                else if (returnedObject.status == "scanResult")
                {
                    if ($scope.IsBoardUnique(returnedObject))
                    {
                        $scope.applicationProperties.FOUND_BOARDS.push(returnedObject);
                        $scope.$apply();
                    }
                }
            },
            //onStartScanError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            },
            //params
            {
                serviceUuids: 
                [
                    $scope.AUTOMATION_IO_SERVICE_UUID
                ]
            }
        );

        setTimeout(function()
        {
            BLUETOOTH.stopScan
            (
                //onScanStopped
                function(returnedObject)
                {
                    if (returnedObject.status == "scanStopped")
                    {
                        $scope.applicationProperties.WriteLog("Scanning finished", "normal");
                        $scope.applicationProperties.ShowToast("Scanning finished");
                    }
                },
                //onScanStoppedError
                function(errorObject)
                {
                    $scope.applicationProperties.SetStatus("error", errorObject);
                }
            );

            if ($scope.applicationProperties.FOUND_BOARDS.length > 0)
            {
                $scope.bar.visible = false;
                $scope.button.text = "Connect";
                $scope.button.style = "button-positive";
                $scope.button.visible = true;
            }
            else
            {
                $scope.bar.visible = true;
                $scope.bar.text = "No boards found";
            }
            
            $scope.$apply();
        }, SCAN_TIME);
    };
    
    $scope.Disconnect = function()
    {
        $scope.DisconnectBoard
        (
            //onSuccess
            function()
            {
                $scope.applicationProperties.SetStatus("disconnected", $scope.applicationProperties.BOARD);
                $scope.Close();
                $scope.CheckIsBluetoothConnected();
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };
    
    $scope.Close = function()
    {
        $scope.applicationProperties.CloseConnection
        (
            //onSuccess
            function()
            {
                //not in use
            }, 
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };

    $scope.DisconnectBoard = function(success, error)
    {
        BLUETOOTH.isConnected
        (
            //callback
            function(returnedObject)
            {
                if (returnedObject.isConnected === true)
                {
                    BLUETOOTH.disconnect
                    (
                        //onDisconnectSuccess
                        function(returnedObject)
                        {
                            if (returnedObject.status == "disconnected")
                            {
                                $scope.applicationProperties.WriteLog("Board disconnected", "normal");
                                $scope.applicationProperties.ShowToast("Board disconnected");
                                $scope.applicationProperties.BOARD.pins = [];
                                success();
                            }
                        },
                        //onDisconnectError
                        function(errorObject)
                        {
                            error(errorObject);
                        },
                        //params
                        {
                            address: $scope.applicationProperties.BOARD.address
                        }
                    );
                }
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address
            }
        );
    };
    
    $scope.applicationProperties.BOARD.serviceUuid = $scope.AUTOMATION_IO_SERVICE_UUID;
    
    $scope.CheckIsBluetoothConnected = function()
    {
        $scope.applicationProperties.FOUND_BOARDS = [];
        $scope.$apply();
        
        $scope.IsBluetoothConnected
        (
            //yes
            function()
            {
                $scope.applicationProperties.FOUND_BOARDS.push($scope.applicationProperties.BOARD);
                $scope.$apply();
                $scope.button.text = "Disconnect";
                $scope.button.style = "button-energized";
                $scope.button.visible = true;
                $scope.$apply();
            },
            //no
            function()
            {
                $scope.button.text = "Connect";
                $scope.button.style = "button-positive";
                $scope.button.visible = true;
                $scope.$apply();
                $scope.SearchForBoards();
            }
        );
    };
    
    $scope.CheckIsBluetoothConnected();
})

.controller('ConsoleController', function($scope, $stateParams) 
{
    //not in use
})

.controller('AboutController', function($scope, $stateParams) 
{
    //not in use
})

.controller('CloseController', function($scope, $stateParams) 
{
    $scope.CloseApplication = function(callback)
    {
        if ($scope.applicationProperties.BLUETOOTH.disableOnClose == "YES")
        {
            BLUETOOTH.isEnabled
            (
                function(returnedObject)
                {
                    if (returnedObject.isEnabled === true)
                    {
                        $scope.DisableBluetooth(callback);
                    }
                    else
                    {
                        callback();
                    }
                }
            ); 
        }
        else
        {
            callback();
        }
    };
    
    $scope.DisableBluetooth = function(callback)
    {
        BLUETOOTH.isEnabled
        (
            //callback
            function(returnedObject)
            {
                if (returnedObject.isEnabled === true)
                {
                    BLUETOOTH.disable
                    (
                        //onBluetoothDisabled
                        function()
                        {
                            callback();
                        },
                        //onBluetoothDisableError
                        function(errorObject)
                        {
                            $scope.applicationProperties.SetStatus("error", errorObject);
                        }
                    );
                }
            }
        );
    };
    
    $scope.Close = function()
    {
        $scope.applicationProperties.CloseConnection
        (
            //onSuccess
            function()
            {
                $scope.CloseApplication(function()
                {
                    NAVIGATOR.app.exitApp();
                });
            }, 
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };

    $scope.Disconnect = function()
    {
        $scope.DisconnectBoard
        (
            //onSuccess
            function()
            {
                $scope.applicationProperties.SetStatus("disconnected", $scope.applicationProperties.BOARD);
                $scope.Close();
            },
            //onError
            function(errorObject)
            {
                $scope.applicationProperties.SetStatus("error", errorObject);
            }
        );
    };

    $scope.DisconnectBoard = function(success, error)
    {
        BLUETOOTH.isConnected
        (
            //callback
            function(returnedObject)
            {
                if (returnedObject.isConnected === true)
                {
                    BLUETOOTH.disconnect
                    (
                        //onDisconnectSuccess
                        function(returnedObject)
                        {
                            if (returnedObject.status == "disconnected")
                            {
                                $scope.applicationProperties.WriteLog("Board disconnected", "normal");
                                $scope.applicationProperties.ShowToast("Board disconnected");
                                $scope.applicationProperties.BOARD.pins = [];
                                success();
                            }
                        },
                        //onDisconnectError
                        function(errorObject)
                        {
                            error(errorObject);
                        },
                        //params
                        {
                            address: $scope.applicationProperties.BOARD.address
                        }
                    );
                }
                else
                {
                    $scope.CloseApplication(function()
                    {
                        NAVIGATOR.app.exitApp();
                    });
                }
            },
            //params
            {
                address: $scope.applicationProperties.BOARD.address
            }
        );
    };
    
    $scope.Yes = function()
    {
        $scope.Disconnect();
    };
    
    $scope.No = function()
    {
        window.location.assign("#/app/home");
    };
})

.controller("IconController", function($scope, $ionicPopup) 
{
    $scope.bluetoothIcon.class = "black";
    
    var bluetoothStatusPopup;
    
    $scope.ShowBluetoothStatus = function() 
    {
        $scope.data = {};

        bluetoothStatusPopup = $ionicPopup.show(
        {
            templateUrl: "app/icon.html",
            title: '<b>Bluetooth status</b>',
            scope: $scope,
            buttons: 
            [
                {
                    text: 'OK',
                    type: 'button-positive', 
                    onTap: function()
                    {
                        return {button: "OK"};
                    }
                },
                {
                    text: 'More info', 
                    type: 'button-stable', 
                    onTap: function(e)
                    {
                        return {button: "MORE_INFO"};
                    }
                }
            ]
        });
        
        bluetoothStatusPopup.then(function(result) 
        {
			if (result.button == "MORE_INFO")
				window.location.assign("#/app/console");
        });
    };
});
