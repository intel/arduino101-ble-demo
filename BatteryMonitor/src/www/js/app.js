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

angular.module('app', ['ionic', 'angular-svg-round-progress']).controller('appController', function($scope) 
{    
    var BATTERY_SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb";
    var BATTERY_LEVEL_UUID = "00002a19-0000-1000-8000-00805f9b34fb";
    
    var DEVICE_NAME = "AE_BATTMON";
    
    var remoteDevice;
    
    $scope.console = "";
    $scope.showBatteryLevel = "false";
    $scope.showConnectButton = "true";
    $scope.deviceList = [];
    
    var console = function(message)
    {
// Uncomment the following to enable console messages (e.g. for debug)
//        $scope.console += message + '\n';
//        $scope.$apply();
    };
    
    var data = function(batteryLevel)
    {
        $scope.batteryLevel = batteryLevel + "%";
        $scope.$apply();
    };
    
    var clean = function(params)
    {
        if (params.console)
            $scope.console = "";
        
        if (params.data)
            $scope.showBatteryLevel = "false";
        
        $scope.$apply();
    };
    
    var onPlatformReady = function()
    {
        navigator.splashscreen.hide();
    };
    
    ionic.Platform.ready(onPlatformReady);
        
    var onBluetoothEnabled = function()
    {        
        console("Bluetooth is enabled");
        console("Scanning for Arduino 101...");
        $scope.deviceList = [];
        $scope.$apply();
        ble.scan([], 5, function(device)
        {
            if (device.name == DEVICE_NAME)
            {
                $scope.deviceList.push(device);
                $scope.$apply();
            }
        }, onScanError);
    };
    
    var onBluetoothFailure = function()
    {
        console("Could not enable bluetooth");
    };

    var onBluetoothDisabled = function()
    {
        console("Bluetooth is not enabled");
        ble.enable(onBluetoothEnabled, onBluetoothFailure);
    };

    var onScanError = function(error)
    {
        console("Error occured during scanning:\n" + error.toString());
    };

    var onConnectSuccess = function(peripheralData)
    {
        console("Connected to Arduino 101");
        console("Starting sending data from Arduino 101...");
        $scope.showConnectButton = "false";
        $scope.showBatteryLevel = "true";
        $scope.$apply();
        ble.startNotification(remoteDevice.id, BATTERY_SERVICE_UUID, BATTERY_LEVEL_UUID, onNotificationSuccess, onNotificationFailure);
    };
    
    var onNotificationSuccess = function(buffer)
    {
        var uInt8Array = new Uint8Array(buffer);
        
        var output = "";
        
        for (var i = 0; i < uInt8Array.length; i++)
        {
            output += "\n" + uInt8Array[i].toString();
        }
        
        data(output);
    };
    
    var onNotificationFailure = function(error)
    {
        console("Notification failure:\n" + error.toString());
        $scope.showConnectButton = "true";
        $scope.showBatteryLevel = "false";
        $scope.$apply();
    };

    var onConnectFailure = function(error)
    {
        console("Could not connect to Arduino 101:\n" + error.toString());
        $scope.showConnectButton = "true";
        $scope.showBatteryLevel = "false";
        $scope.$apply();
    };
    
    var onDisconnectSuccess = function()
    {
        console("Disconnected from Arduino 101");
        $scope.deviceList = [];
        $scope.showConnectButton = "true";
        clean({console: false, data: true});
    };
    
    var onDisconnectFailure = function(error)
    {
        console("Could not disconnect from Arduino 101:\n" + error.toString());
    };
    
    var onIsConnectedFailure = function()
    {
        console("Arduino 101 is not connected");
    };
    
    var onIsConnectedSuccess = function()
    {
        console("Disconnecting from Arduino 101...");
        ble.disconnect(remoteDevice.id, onDisconnectSuccess, onDisconnectFailure);
    };

    $scope.connect = function(device)
    {
        console("Connecting to Arduino 101...");
        remoteDevice = device;
        ble.connect(device.id, onConnectSuccess, onConnectFailure);
    };
    
    $scope.scanDevices = function()
    {
        clean({console: true, data: true});
        
        ble.isEnabled(
            function() 
            {
                onBluetoothEnabled();
            },
            function() 
            {
                onBluetoothDisabled();
            }
        );
    };
    
    $scope.disconnect = function()
    {
        clean({console: true, data: true});
        ble.isConnected(remoteDevice.id, onIsConnectedSuccess, onIsConnectedFailure);
    };
});
