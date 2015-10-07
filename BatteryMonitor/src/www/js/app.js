angular.module('app', ['ionic', 'angular-svg-round-progress']).controller('appController', function($scope) 
{    
    var BATTERY_SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb";
    var BATTERY_LEVEL_UUID = "00002a19-0000-1000-8000-00805f9b34fb";
    
    var DEVICE_NAME = "AE_BATTMON";
    
    var remoteDevice;
    
    $scope.console = "";
    $scope.showBatteryLevel = "false";
    $scope.showConnectButton = "true";
    
    var console = function(message)
    {
        $scope.console += message + '\n';
        $scope.$apply();
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
    }
    
    var onPlatformReady = function()
    {
        navigator.splashscreen.hide();
    };
    
    ionic.Platform.ready(onPlatformReady);
        
    var onBluetoothEnabled = function()
    {        
        console("Bluetooth is enabled");
        console("Scanning for Atlas Edge...");
        ble.startScan([], function(device) 
        {
            if (device.name == DEVICE_NAME)
            {
                console("Atlas Edge was found", "log");
                remoteDevice = device;
                ble.stopScan(onStopScan, onStoppingScanError);
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

    var onStoppingScanError = function(error)
    {
        console("Error occured during stopping the scanning:\n" + error.toString());
    };

    var onStopScan = function()
    {
        console("Connecting to Atlas Edge...");
        ble.connect(remoteDevice.id, onConnectSuccess, onConnectFailure);
    };

    var onConnectSuccess = function(peripheralData)
    {
        console("Connected to Atlas Edge");
        console("Starting sending data from Atlas Edge...");
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
        console("Could not connect to Atlas Edge:\n" + error.toString());
        $scope.showConnectButton = "true";
        $scope.showBatteryLevel = "false";
        $scope.$apply();
    };
    
    var onDisconnectSuccess = function()
    {
        console("Disconnected from Atlas Edge");
        $scope.showConnectButton = "true";
        clean({console: false, data: true});
    };
    
    var onDisconnectFailure = function(error)
    {
        console("Could not disconnect from Atlas Edge:\n" + error.toString());
    };
    
    var onIsConnectedFailure = function()
    {
        console("Atlas Edge is not connected");
    };
    
    var onIsConnectedSuccess = function()
    {
        console("Disconnecting from Atlas Edge...");
        ble.disconnect(remoteDevice.id, onDisconnectSuccess, onDisconnectFailure);
    };
    
    $scope.connect = function()
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