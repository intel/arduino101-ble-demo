/*
 * Copyright (c) 2015 Intel Corporation.  All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.

 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.

 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
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
