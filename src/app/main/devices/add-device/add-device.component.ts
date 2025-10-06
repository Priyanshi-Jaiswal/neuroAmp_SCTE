import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { AppService } from '../../../app.service';
import { DeviceCacheService } from '../device-cache.sevice';


interface Sensor {
  Id: number | null;
    Name: string | null;
    SensorType: string | 'other';
    Scale: string | 'yocto';
    Precision: number | null;
    Value: number | null;
    OperStatus: string | 'other';
    UnitsDisplay: string | null;
    ValueTimeStamp: string | null;
    ValueUpdateRate: number | null;
}

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss']
})
export class AddDeviceComponent implements OnInit, AfterViewInit, OnDestroy {

  activeVerticalTab: 'General' | 'LoRaWAN' | 'SCTE283'  = 'General';
  activeSettingTab: string = 'Activation';
  private loRaWANTabSequence: string[] = ['Activation', 'Class', 'Frame settings', 'Features', 'Location', 'Payload'];
  private scte283TabSequence: string[] = ['System', 'RF', 'Networking', 'PNM'];
  isScte283: boolean = false;

  deviceId: string | null = null;
  isEditMode: boolean = false;

  // Form fields for the new device
  active: boolean = false;
  name: string = '';
  devEUI: string = '';
  region: string = '';
  selectedGateway: any | null = null;
  selectedGatewayId: string | null = null;
  gateway: any[] = [];
  regionOptions: string[] = ['US915', 'EU868', 'AS923', 'AU915'];

  // Activation Settings form fields
  otaaSupported: boolean = false;
  appKey: string = '';
  devAddr: string = '';
  nwkSKey: string = '';
  appSKey: string = '';

  // Class A Settings form fields
  rx1Delay: string = '';
  rx1Duration: string = '';
  rx1DataRateOffset: string = '';
  rx2Delay: string = '';
  rx2Duration: string = '';
  channelFrequency: string = '';
  dataRate: string = '';
  ackTimeout: string = '';

  // Class B Settings field
  classBSupported: boolean = false;

  // Class C Settings field
  classCSupported: boolean = false;

  // Frame Settings form fields
  uplinkDataRate: string = '';
  fPort: string = '';
  retransmission: string = '';
  fCnt: number = 0;
  fCntDownDisable: boolean = false;
  fCntDown: number | undefined;

  // Features Settings field
  adrEnabled: boolean = false;
  rangeAntenna: string = '';

  // Payload Settings form fields
  uplinkInterval: string = '';
  payloadExceedsAction: 'fragments' | 'truncates' = 'fragments';
  mType: 'ConfirmedDataUp' | 'UnConfirmedDataUp' = 'ConfirmedDataUp';
  payloadContent: string = '';
  base64Encoded: boolean = false;
  system: boolean = false;
  fault: boolean = false;
  pnm: boolean = false;

  // Location Settings
  latitude: number = 1;
  longitude: number = 1;
  altitude: number | undefined;
  locationAddress: string = 'Device Location';
  showAppKey: boolean = false;
  showNwkSKey: boolean = false;
  showAppSKey: boolean = false;
  searchAddress: string = '';
  showSearchBox: boolean = false;

  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  oui: string = this.devEUI.slice(0, 6);

  SystemCapabilities: {
    AmplifierType: string;
    SupportsPowerSupplyRedundancy: boolean;
    PowerSupplyRedundancyMode: string;
    SupportsPowerSavingMode: boolean;
    SupportsRfConfigFile: boolean;
    SupportsDebugFile: boolean;
    SupportsRfSpectrumCapture: boolean;
  } = {
      AmplifierType: 'other',
      SupportsPowerSupplyRedundancy: false,
      PowerSupplyRedundancyMode: 'other',
      SupportsPowerSavingMode: false,
      SupportsRfConfigFile: false,
      SupportsDebugFile: false,
      SupportsRfSpectrumCapture: false,
    };

  SystemStatus: {
    UniqueId: string;
    CurrentDateTime: string;
    UpTime: string;
  } = {
      UniqueId: '',
      CurrentDateTime: '',
      UpTime: '',
    };

  Identification: {
    ModelNumber: string;
    SerialNumber: string;
    DeviceAlias: string;
    DeviceDescription: string;
  } = {
      ModelNumber: '',
      SerialNumber: '',
      DeviceAlias: '',
      DeviceDescription: ''
    };

  Vendor: {
    Name: string;
    Oui: string ;
  } = {
      Name: '',
      Oui: '',
    };

  VersionSummary: {
    CurrentSwVersion: string;
    BootRomVersion: string;
    HwVersion: string;
  } = {
      CurrentSwVersion: '',
      BootRomVersion: '',
      HwVersion: ''
    };

  Enclosure: {
    IsOpen: boolean;
  } = {
      IsOpen: false
    };

  Sensor: {
    Id: number | null;
    Name: string;
    SensorType: string;
    Scale: string;
    Precision: number | null;
    Value: number | null;
    OperStatus: string;
    UnitsDisplay: string;
    ValueTimeStamp: string;
    ValueUpdateRate: number | null;
  }[] = [];

  PowerSupply: {
    Id: number | null;
    Description: string;
    OperStatus: string;
    InputVoltage: number | null;
    InputCurrent: number | null;
  } = {
      Id: null,
      Description: '',
      OperStatus: 'other',
      InputVoltage: null,
      InputCurrent: null
    };

  OutputRail: {
    Id: number | null;
    Description: string;
    OperStatus: string;
    Voltage: number | null;
    Current: number | null;
  } = {
      Id: null,
      Description: '',
      OperStatus: 'other',
      Voltage: null,
      Current: null
    };

  SystemCfg: {
    Hostname: string;
    AssetId: string;
    Description: string;
    CascadePosition: number | null
  } = {
      Hostname: '',
      AssetId: '',
      Description: '',
      CascadePosition: null
    }

  Location: {
    Description: string;
    Latitude: string;
    Longitude: string;
  } = {
      Description: '',
      Latitude: '',
      Longitude: ''
    }

  ResetCapabilities: {
    ResetTypesSupported: string;
    ResetHistorySize: number | null
  } = {
      ResetTypesSupported: 'softReset',
      ResetHistorySize: null
    }

  ResetHistoryStatus: {
    Index: number | null;
    ResetTimestamp: string;
    Type: string;
    Reason: string;
    EventIdRef: number | null;
    RecoveryTime: number | null
  } = {
      Index: null,
      ResetTimestamp: '',
      Type: 'softReset',
      Reason: '',
      EventIdRef: null,
      RecoveryTime: null
    }

  EventCapabilities: {
    LocalEventLogMaxSize: number | null;
  } = {
      LocalEventLogMaxSize: null,
    };

  EventStatus: {
    ThrottleThresholdExceeded: boolean;
  } = {
      ThrottleThresholdExceeded: false,
    };

  Event: {
    Index: number | null;
    FirstTime: string;
    LastTime: string;
    Counts: number | null
    Level: string;
    Id: string;
    Text: string;
  } = {
      Index: null,
      FirstTime: '',
      LastTime: '',
      Counts: null,
      Level: 'emergency',
      Id: '',
      Text: '',
    };

  Syslog: {
    Level: string;
    Timestamp: string;
    Hostname: string;
    NeType: string;
    Vendor: string;
    EventId: string;
    Text: string;
    VendorSpecificText: string;
  } = {
      Level: '',
      Timestamp: '',
      Hostname: '',
      NeType: '',
      Vendor: '',
      EventId: '',
      Text: '',
      VendorSpecificText: '',
    };

  EventSyslogStatus: {
    Index: number | null;
    ServerAddress: string;
    AddressOrigin: string;
  } = {
      Index: null,
      ServerAddress: '',
      AddressOrigin: 'other',
    };

  EventThrottleCfg: {
    AdminState: string;
    Threshold: number | null;
    Interval: number | null;
  } = {
      AdminState: 'unconstrained',
      Threshold: 10,
      Interval: 10
    };

  EventReportingCfg: {
    Priority: string;
    Reporting: string;
  } = {
      Priority: 'emergency',
      Reporting: 'local'
    };

  SyslogServerCfg: {
    Index: number | null;
    ServerAddress: string;
    AdminState: string;
  } = {
      Index: null,
      ServerAddress: '',
      AdminState: 'unconstrained'
    };

  FileCapabilities: {
    NumDebugFilesSupported: number | null;
    NumRfCfgFilesSupported: number | null;
    NumRfSpectrumCaptureFilesSupported: number | null;
  } = {
      NumDebugFilesSupported: null,
      NumRfCfgFilesSupported: null,
      NumRfSpectrumCaptureFilesSupported: null
    };

  FileStatus: {
    Filename: string;
    FileType: string;
    FileStatus: string;
    DateCreated: string;
  } = {
      Filename: '',
      FileType: 'other',
      FileStatus: 'other',
      DateCreated: ''
    };

  DataTransferCfg: {
    RemoteServerIndex: number | null;
    RemoteServerHost: string;
    RemoteServerPort: number | null;
    RemotServerBaseUri: string;
    Protocol: string;
    LocalStore: boolean;
  } = {
      RemoteServerIndex: null,
      RemoteServerHost: '',
      RemoteServerPort: null,
      RemotServerBaseUri: '',
      Protocol: 'other',
      LocalStore: false
    };

  RfCapabilities: {
    NumRfPorts: number | null;
    SupportsUniversalPlugin: boolean;
    NumDiplexFilters: number | null;
    SupportsRfSpectrumCapture: string;
  } = {
      NumRfPorts: null,
      SupportsUniversalPlugin: false,
      NumDiplexFilters: null,
      SupportsRfSpectrumCapture: 'notSupported',
    };

  RfPortCapabilities: {
    Index: number | null;
  } = {
      Index: null
    };

  DiplexFilterCapabilities: {
    DiplexFilterIndex: number | null;
    DiplexFilterUsUpperBandEdge: number | null;
    DiplexFilterDsLowerBandEdge: number | null;
  } = {
      DiplexFilterIndex: null,
      DiplexFilterUsUpperBandEdge: null,
      DiplexFilterDsLowerBandEdge: null
    };

  UsLogicalPortCapabilities: {
    MinUsFreq: number | null;
    MaxUsFreq: number | null;
    OperationalGain: number | null;
    NumUsStages: number | null;
    RfTestPointSupport: boolean;
    RfTestPointNumPoints: number | null;
    SupportsIngressSwitch: boolean;
    IngressSwitchAttenuationMinValue: number | null;
    IngressSwitchAttenuationMaxValue: number | null;
    IngressSwitchAttenuationStepSize: number | null;
    RfLevelControlType: string;
    ThermalLevelControlSelectRangeMinValue: number | null;
    ThermalLevelControlSelectRangeMaxValue: number | null;
    ThermalLevelControlSelectRangeStepSize: number | null;
  } = {
      MinUsFreq: null,
      MaxUsFreq: null,
      OperationalGain: null,
      NumUsStages: null,
      RfTestPointSupport: false,
      RfTestPointNumPoints: null,
      SupportsIngressSwitch: false,
      IngressSwitchAttenuationMinValue: null,
      IngressSwitchAttenuationMaxValue: null,
      IngressSwitchAttenuationStepSize: null,
      RfLevelControlType: 'other',
      ThermalLevelControlSelectRangeMinValue: null,
      ThermalLevelControlSelectRangeMaxValue: null,
      ThermalLevelControlSelectRangeStepSize: null,
    };

  DsLogicalPortCapabilities: {
    MinDsFreq: number | null;
    MaxDsFreq: number | null;
    OperationalGain: number | null;
    NumDsStages: number | null;
    RfTestPointSupport: boolean;
    RfTestPointNumPoints: number | null;
    AgcType: string;
    AgcNumAgilePilots: number | null;
    AgcPilotLossProtectionType: string;
  } = {
      MinDsFreq: null,
      MaxDsFreq: null,
      OperationalGain: null,
      NumDsStages: null,
      RfTestPointSupport: false,
      RfTestPointNumPoints: null,
      AgcType: 'other',
      AgcNumAgilePilots: null,
      AgcPilotLossProtectionType: '',
    };

  UsDsStageCapabilities: {
    StageIndex: number | null;
    Type: string;
    Location: string;
    MinAttenuation: number | null;
    MaxAttenuation: number | null;
    AttenuationStepSize: number | null;
    MinEqualization: number | null;
    MaxEqualization: number | null;
    EqualizationStepSize: number | null;
  } = {
      StageIndex: null,
      Type: 'other',
      Location: 'other',
      MinAttenuation: null,
      MaxAttenuation: null,
      AttenuationStepSize: null,
      MinEqualization: null,
      MaxEqualization: null,
      EqualizationStepSize: null
    };

  // NEW RF STATUS PROPERTIES
  RfStatusGrp: {
    UniversalPluginPresent: boolean;
    UniversalPluginDescr: string;
  } = {
      UniversalPluginPresent: false,
      UniversalPluginDescr: ''
    };

  UsLogicalPortStatus: {
    RfLevelControlEnabled: boolean;
    RfLevelControl: string;
    RfLevelControlToUpperLimit: number | null;
    RfLevelControlToLowerLimit: number | null;
  } = {
      RfLevelControlEnabled: false,
      RfLevelControl: 'other',
      RfLevelControlToUpperLimit: null,
      RfLevelControlToLowerLimit: null,
    };

  DsLogicalPortStatus: {
    ReportedOutputPower: number | null;
    DsAgcEnabled: boolean;
    DsAgcPilotLossProtection: string;
    DsAgcToUpperLimit: number | null;
    DsAgcToLowerLimit: number | null;
  } = {
      ReportedOutputPower: null,
      DsAgcEnabled: false,
      DsAgcPilotLossProtection: 'other',
      DsAgcToUpperLimit: null,
      DsAgcToLowerLimit: null,
    };

  LogicalPortStatus: {
    VendorDesc: string;
    OperStatus: string;
  } = {
      VendorDesc: '',
      OperStatus: 'other'
    };

  TestPointStatus: {
    PointIndex: number | null;
    PointFreq: number | null;
    PointLevel: number | null;
  } = {
      PointIndex: null,
      PointFreq: null,
      PointLevel: null
    };

  // NEW RF CONFIGURATION PROPERTIES
  RfPortCfg: {
    Index: number | null;
    AdminStatus: string;
  } = {
      Index: null,
      AdminStatus: 'up'
    };

  BidirLogicalPortCfg: {
    ActiveDiplexFilterIndex: number | null;
  } = {
      ActiveDiplexFilterIndex: null
    };

  LogicalPortCfg: {
    AdminStatus: string;
    RfMute: boolean;
  } = {
      AdminStatus: 'up',
      RfMute: false
    };

  UsLogicalPortCfg: {
    ThermalLevelControlSelectRangeSetting: number | null;
  } = {
      ThermalLevelControlSelectRangeSetting: null
    };

  UsIngressSwitchCfg: {
    State: string;
    Attenuation: number | null;
  } = {
      State: 'on',
      Attenuation: null
    };

  DsLogicalPortCfg: {
    DsAgcEnable: Boolean;
  } = {
      DsAgcEnable: false,
    };

  DsAgileAgcPilotCfg: {
    PilotNum: number | null;
    PilotFreq: number | null;
  } = {
      PilotNum: null,
      PilotFreq: null,
    };

  UsDsCfg: {
    StageIndex: number | null;
    Attenuation: number | null;
    Equalization: number | null;
  } = {
      StageIndex: null,
      Attenuation: null,
      Equalization: null
    };

  IPHostStatus: {
    Ip: string;
    SubnetMask: string;
    DefaultGateway: string;
    ManagementIp: string;
  } = {
      Ip: '',
      SubnetMask: '',
      DefaultGateway: '',
      ManagementIp: ''
    };

  LocalTimeStatus: {
    Index: number | null;
    ServerIp: string;
  } = {
      Index: null,
      ServerIp: ''
    };

  DhcpServerStatus: {
    ServerIp: string;
    RelayAgentIp: string;
  } = {
      ServerIp: '',
      RelayAgentIp: ''
    };

  DnsServerStatus: {
    Index: number | null;
    ServerIp: string;
  } = {
      Index: null,
      ServerIp: ''
    };

  PnmTestStatus: {
    TestId: string;
    Type: string;
    MeasurementStatus: string;
    RemoteServerIndex: number | null;
    DestinationFilename: string;
  } = {
      TestId: '',
      Type: 'other',
      MeasurementStatus: 'other',
      RemoteServerIndex: null,
      DestinationFilename: ''
    };

  PnmTestMeasurement: {
    TestId: string;
  } = {
      TestId: ''
    };

  PnmTestMeasHeader: {
    FileType: number | null;
    MajorVersion: number | null;
    MinorVersion: number | null;
    CaptureTime: number | null;
    UniqueId: string;
    ManagementIp: string;
    RfPortIndex: number | null;
    Direction: string;
  } = {
      FileType: null,
      MajorVersion: null,
      MinorVersion: null,
      CaptureTime: null,
      UniqueId: '',
      ManagementIp: '',
      RfPortIndex: null,
      Direction: 'upstream'
    };

  RfPortIndex: number | undefined;
  InactivityTimeout: number = 300;
  FirstSegmentCenterFreq: number | undefined;
  LastSegmentCenterFreq: number | undefined;
  SegmentFrequencySpan: number = 0;
  NumBinsPerSegment: number = 256;
  EquivalentNoiseBandwidth: number = 150;
  WindowFunction: string = 'other';
  NumAverages: number = 1;


  // Replaced message and isError with a single config object
  modalConfig = {
    show: false,
    message: '',
    isError: false,
    showCancelButton: false, // Simple alerts don't need a cancel button
  };

  private deviceCreatedForSession: boolean = false;

  expandedSCTESystemRow: string | null = null;
  deviceType: any;

  // sensors: Sensor[] = [];

  constructor(
    private router: Router,
    private appService: AppService,
    private route: ActivatedRoute,
    private deviceCacheService: DeviceCacheService // Inject the new service
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
        const deviceType = params.get('deviceType');
        if (deviceType === 'SCTE283') {
            this.isScte283 = true;
            this.activeVerticalTab = 'General';
            // Start on General tab, the next step (Save & Next) will navigate to LoRaWAN.
            // this.activeSettingTab = 'System'; // <-- REMOVE or change this line
            this.activeSettingTab = 'Activation'; // Set default horizontal tab to LoRaWAN's first tab
            this.addSensor();
        } else {
            this.isScte283 = false;
            this.activeVerticalTab = 'General';
            this.activeSettingTab = 'Activation';
        }
    });

    this.appService.getGateways().subscribe({
      next: (response) => {
        this.gateway = response.response;
        console.log('Gateways loaded:', this.gateway);
      },
      error: (err) => {
        console.error('Failed to fetch gateways:', err);
      },
    });
  }

  ngAfterViewInit(): void {
    // The map is now only initialized when the Location tab is opened.
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }
  }

  // New method to show the modal with a simple message
  private showModal(msg: string, isErr: boolean): void {
    this.modalConfig.message = msg;
    this.modalConfig.isError = isErr;
    this.modalConfig.show = true;
  }

  // New method to close the modal, triggered by the 'confirm' event
  onModalClose(): void {
    this.modalConfig.show = false;
  }

  isFirstSensorValid(): boolean {
    if (this.Sensor.length > 0) {
      const firstSensor = this.Sensor[0];
      // Check for a value in any of the primary fields.
      // This is more robust than checking just one field.
      if (firstSensor.Id || firstSensor.Name || firstSensor.SensorType  || firstSensor.Value || firstSensor.OperStatus){
        return true;
      }
    }
    return false;
  }

  isEventDataFilled(): boolean {
    if (this.Event && (this.Event.Id || this.Event.Level || this.Event.Text || this.Event.Index)) {
      return true;
  }
  return false;
}

  getPrefix(value: string | number): string {
    if (value === null || value === undefined) {
      return '';
    }
    // Convert to string and slice the first 6 characters
    return String(value).slice(0, 6);
  }

  onNameChange(newName: string): void {
    this.name = newName;
    this.SystemCfg.Hostname = newName;
    this.Syslog.Hostname = newName;
}

  setActiveVerticalTab(tabName: 'General' | 'LoRaWAN' | 'SCTE283' ): void {
    this.activeVerticalTab = tabName;
    console.log(`Switched to vertical tab: ${tabName}`);
    // If switching to LoRaWAN, ensure the first horizontal tab is active
    if (tabName === 'LoRaWAN') {
      this.setActiveLoRaWANTab('Activation');
    }
    else {
      this.setActiveSCTETab('System');
    }
  }

  setActiveLoRaWANTab(tabName: string): void {
    this.activeSettingTab = tabName;
    console.log(`Switched to horizontal tab: ${tabName}`);

    // If the Location tab is opened, initialize the map
    if (tabName === 'Location') {
      setTimeout(() => {
        if (!this.map) {
          this.initMap();
        }
        this.map?.invalidateSize();
      }, 100);
    }
  }

  setActiveSCTETab(tabName: string): void {
    this.activeSettingTab = tabName;
    console.log(`Switched to horizontal tab: ${tabName}`);
    this.expandedSCTESystemRow = null;
  }

  toggleSCTESystemRow(rowName: string): void {
    if (this.expandedSCTESystemRow === rowName) {
      this.expandedSCTESystemRow = null; // Collapse the row if it's already open
    } else {
      this.expandedSCTESystemRow = rowName; // Expand the new row
    }
  }

  /**
   * Handles the click event for sidebar navigation.
   * Sets the active tab.
   * @param tabName The name of the tab to activate.
   */
  setActiveTab(tabName: string): void {
    this.activeSettingTab = tabName;
    console.log(`Switched to: ${tabName}`);

    if (tabName === 'Location') {
      setTimeout(() => {
        if (!this.map) {
          this.initMap();
        }
        this.map?.invalidateSize();
      }, 100);
    }
  }

  addSensor(): void {
    this.Sensor.push({
      Id: null,
      Name: '',
      SensorType: 'other', // Default value
      Scale: 'yocto',     // Default value
      Precision: null,
      Value: null,
      OperStatus: 'other', // Default value
      UnitsDisplay: '',
      ValueTimeStamp: '',
      ValueUpdateRate: null
    });
  }

  removeSensor(index: number): void {
    this.Sensor.splice(index, 1);
  }

  /**
   * Private helper to consolidate data for API call.
   */
  private createFinalDevicePayload(): any {

    const lorawanData = {
      // lorawan: {
      isDeviceActive: this.active,
      name: this.name,
      devEUI: this.devEUI,
      region: this.region,
      gateway: this.selectedGateway?.name,
      gwEUI: this.selectedGateway?.macAddress,
      otaaSupported: this.otaaSupported,
      appKey: this.appKey,
      devAddr: this.devAddr,
      nwkSKey: this.nwkSKey,
      appSKey: this.appSKey,
      rx1Delay: this.rx1Delay,
      rx1Duration: this.rx1Duration,
      rx1DataRateOffset: this.rx1DataRateOffset,
      rx2Delay: this.rx2Delay,
      rx2Duration: this.rx2Duration,
      channelFrequency: this.channelFrequency,
      dataRate: this.dataRate,
      ackTimeout: this.ackTimeout,
      classBSupported: this.classBSupported,
      classCSupported: this.classCSupported,
      uplinkDataRate: this.uplinkDataRate,
      fPort: this.fPort,
      retransmission: this.retransmission,
      fCnt: this.fCnt,
      fCntDownDisable: this.fCntDownDisable,
      fCntDown: this.fCntDown,
      adrEnabled: this.adrEnabled,
      rangeAntenna: this.rangeAntenna,
      uplinkInterval: this.uplinkInterval,
      payloadExceedsAction: this.payloadExceedsAction,
      mType: this.mType,
      payloadContent: this.payloadContent,
      payload: {
        system: this.system,
        fault: this.fault,
        pnm: this.pnm
      },
      base64Encoded: this.base64Encoded,
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
        altitude: this.altitude
      },
      // }
    };

    const scte283Data = {
      // Scte279Amplifier:{
      SystemGrp: {
        SystemCapabilitiesGrp: {
          SystemCapabilities: this.SystemCapabilities,
        },
        SystemStatusGrp: {
          SystemStatus: {
            UniqueId: this.devEUI,
            CurrentDateTime: '',
            UpTime: '',
          },
          Identification: this.Identification,
          Vendor: this.Vendor,
          // {
          //   Name: '',
          //   Oui: this.devEUI.slice(0, 6),
          // },
          VersionSummary: this.VersionSummary,
          Enclosure: this.Enclosure,
          Sensor: this.Sensor.map(s => ({
            Id: s.Id,
            Name: s.Name,
            SensorType: s.SensorType,
            Scale: s.Scale,
            Precision: s.Precision,
            Value: s.Value,
            OperStatus: s.OperStatus,
            UnitsDisplay: s.UnitsDisplay,
            ValueTimeStamp: s.ValueTimeStamp,
            ValueUpdateRate: s.ValueUpdateRate
          })),
          PowerSupply: this.PowerSupply,
          OutputRail: this.OutputRail
        },
        SystemCfgGrp: {
          SystemCfg: this.SystemCfg,
          Location: this.Location
        },
        ResetStatusGrp: {
          ResetCapabilities: this.ResetCapabilities,
          ResetHistoryStatus: this.ResetHistoryStatus
        },
        EventStatusGrp: {
          EventCapabilities: this.EventCapabilities,
          EventStatus: this.EventStatus,
          Event: this.Event,
          Syslog: this.Syslog,
          EventSyslogStatus: this.EventSyslogStatus
        },
        EventCfgGrp: {
          EventThrottleCfg: this.EventThrottleCfg,
          EventReportingCfg: this.EventReportingCfg,
          SyslogServerCfg: this.SyslogServerCfg
        },
        FileManagement: {
          FileCapabilities: this.FileCapabilities,
          FileStatus: this.FileStatus,
          DataTransferCfg: this.DataTransferCfg
        }
      },

      RfGrp: {
        RfCapabilitiesGrp: {
          RfCapabilities: this.RfCapabilities,
          RfPortCapabilities: this.RfPortCapabilities,
          DiplexFilterCapabilities: this.DiplexFilterCapabilities,
          UsLogicalPortCapabilities: this.UsLogicalPortCapabilities,
          DsLogicalPortCapabilities: this.DsLogicalPortCapabilities,
          UsDsStageCapabilities: this.UsDsStageCapabilities,
        },
        RfStatusGrp: {
          RfStatusGrp: this.RfStatusGrp,
          UsLogicalPortStatus: this.UsLogicalPortStatus,
          DsLogicalPortStatus: this.DsLogicalPortStatus,
          LogicalPortStatus: this.LogicalPortStatus,
          TestPointStatus: this.TestPointStatus,
        },
        RfCfgGroup: {
          RfPortCfg: this.RfPortCfg,
          BidirLogicalPortCfg: this.BidirLogicalPortCfg,
          LogicalPortCfg: this.LogicalPortCfg,
          UsLogicalPortCfg: this.UsLogicalPortCfg,
          UsIngressSwitchCfg: this.UsIngressSwitchCfg,
          DsLogicalPortCfg: this.DsLogicalPortCfg,
          DsAgileAgcPilotCfg: this.DsAgileAgcPilotCfg,
          UsDsCfg: this.UsDsCfg,
        },
      },

      NetworkingGrp: {
        NetworkingStatusGrp: {
          IPHostStatus: this.IPHostStatus,
          LocalTimeStatus: this.LocalTimeStatus,
          DhcpServerStatus: this.DhcpServerStatus,
          DnsServerStatus: this.DnsServerStatus
        }
      },

      PnmGrp: {
        PnmStatus: {
          PnmTestStatus: this.PnmTestStatus,
        },
        PnmResult: {
          PnmTestMeasurement: this.PnmTestMeasurement,
          PnmTestMeasHeader: this.PnmTestMeasHeader,
        },
        PnmRfSpectrumCaptureCfg: {
          RfPortIndex: this.RfPortIndex,
          InactivityTimeout: this.InactivityTimeout,
          FirstSegmentCenterFreq: this.FirstSegmentCenterFreq,
          LastSegmentCenterFreq: this.LastSegmentCenterFreq,
          SegmentFrequencySpan: this.SegmentFrequencySpan,
          NumBinsPerSegment: this.NumBinsPerSegment,
          EquivalentNoiseBandwidth: this.EquivalentNoiseBandwidth,
          WindowFunction: this.WindowFunction,
          NumAverages: this.NumAverages
        },
      },
      // }
    };

    // Build the final payload by merging the collected data
    const finalPayload = {
      lorawan: lorawanData,
      ...(this.isScte283 && { Scte279Amplifier: scte283Data }),
      // ...(this.isScte283 ? { Scte279Amplifier: scte283Data } : { lorawan: lorawanData }),
      // sensors: this.sensors
    };

    console.log('Final Payload for API:', finalPayload);
    return finalPayload;
  }

  /**
   * Saves the current tab's data into the cache and navigates to the next tab.
   * No API call is made here.
   */
  saveAndNext(): void {
    // Check if General tab fields are filled before proceeding from any tab
    if (!this.name || !this.devEUI || !this.selectedGateway || !this.region) {
      this.showModal('Please fill in Name, DevEUI, Gateway, and Region in the General tab before proceeding.', true);
      this.activeVerticalTab = 'General';
      return;
    }

    if (this.activeVerticalTab === 'General') {
      // Always move from General to the start of LoRaWAN
      this.setActiveVerticalTab('LoRaWAN');
      this.setActiveLoRaWANTab(this.loRaWANTabSequence[0]);
  } else if (this.activeVerticalTab === 'LoRaWAN') {
      const currentIndex = this.loRaWANTabSequence.indexOf(this.activeSettingTab);
      
      if (currentIndex < this.loRaWANTabSequence.length - 1) {
          // Move to the next horizontal LoRaWAN tab
          this.setActiveLoRaWANTab(this.loRaWANTabSequence[currentIndex + 1]);
      } else if (this.isScte283) {
          // LoRaWAN is complete AND it's an SCTE283 device: Move to SCTE283 tab
          this.setActiveVerticalTab('SCTE283');
          this.setActiveSCTETab(this.scte283TabSequence[0]);
      }
      // If LoRaWAN is complete but it's NOT an SCTE283 device, do nothing (or show a final save prompt/disable the button)
  } else if (this.activeVerticalTab === 'SCTE283') {
      // Only run if the device is SCTE283 (which it is, by being in this block)
      const currentIndex = this.scte283TabSequence.indexOf(this.activeSettingTab);
      
      if (currentIndex < this.scte283TabSequence.length - 1) {
          // Move to the next horizontal SCTE283 tab
          this.setActiveSCTETab(this.scte283TabSequence[currentIndex + 1]);
      }
      // If SCTE283 is complete, do nothing (or prompt for final save)
  }
  
  console.log('Data cached, moving to the next tab.');
  }

  
  /**
   * Builds the final device payload from all component data and sends it to the API.
   * On success, navigates to the devices list page.
   */
  saveAndClose(): void {
    if (this.isScte283 && this.system && !this.isFirstSensorValid()) {
      this.showModal('System is selected in the payload, but sensor data is missing. Please fill the sensor data in the SCTE283 > System tab.', true);
      this.activeVerticalTab = 'SCTE283';
      this.setActiveSCTETab('System');
      return;
    }

    if (this.isScte283 && this.fault && !this.isEventDataFilled()) {
      this.showModal('Fault is selected in the payload, but event data is missing. Please fill the event data in the SCTE283 > System tab.', true);
      this.activeVerticalTab = 'SCTE283';
      this.setActiveSCTETab('System'); // Direct user back to the System tab
      return; // Stops the save operation
    }
    const devicePayload = this.createFinalDevicePayload();

    this.appService.createDevice(devicePayload).subscribe({
      next: (response) => {
        console.log('Device saved successfully and closing page.', response);
        this.showModal('Device added successfully!', false);
        this.router.navigate(['/devices']);
      },
      error: (error) => {
        console.error('Error saving device:', error);
        this.showModal('Failed to save device. Check console for details.', true);
      }
    });
  }

  /**
   * Builds the final device payload and sends it to the API.
   * On success, resets the form to add a new device.
   */
  saveAndNew(): void {
    if (this.isScte283 && this.system && !this.isFirstSensorValid()) {
      this.showModal('System is selected in the payload, but sensor data is missing. Please fill the sensor data in the SCTE283 > System > System Status.', true);
      this.activeVerticalTab = 'SCTE283';
      this.setActiveSCTETab('System');
      return;
    }

    if (this.isScte283 && this.fault && !this.isEventDataFilled()) {
      this.showModal('Fault is selected in the payload, but event data is missing. Please fill the event data in the SCTE283 > System > Event Status', true);
      this.activeVerticalTab = 'SCTE283';
      this.setActiveSCTETab('System'); // Direct user back to the System tab
      return; // Stops the save operation
    }
    const devicePayload = this.createFinalDevicePayload();

    this.appService.createDevice(devicePayload).subscribe({
      next: (response) => {
        console.log('Device saved successfully. Resetting form for a new device.', response);
        this.showModal('Device added successfully!', false);
        this._resetForm();
      },
      error: (error) => {
        console.error('Error saving device:', error);
        this.showModal('Failed to save device. Check console for details.', true);
      }
    });
  }

  /**
   * Resets all component properties to their initial state.
   */

  private _resetForm(): void {
    // General / LoRaWAN Resets
    this.name = '';
    this.devEUI = '';
    this.region = '';
    this.selectedGateway = null;
    this.otaaSupported = false;
    this.appKey = '';
    this.devAddr = '';
    this.nwkSKey = '';
    this.appSKey = '';
    this.rx1Delay = '';
    this.rx1Duration = '';
    this.rx1DataRateOffset = ''; // Added missing reset
    this.rx2Delay = ''; // Added missing reset
    this.rx2Duration = ''; // Added missing reset
    this.channelFrequency = ''; // Added missing reset
    this.dataRate = ''; // Added missing reset
    this.ackTimeout = ''; // Added missing reset
    this.classBSupported = false; // Added missing reset
    this.classCSupported = false; // Added missing reset
    this.uplinkDataRate = ''; // Added missing reset
    this.fPort = ''; // Added missing reset
    this.retransmission = ''; // Added missing reset
    this.fCnt = 0; // Added missing reset
    this.fCntDownDisable = false; // Added missing reset
    this.fCntDown = undefined; // Added missing reset
    this.adrEnabled = false; // Added missing reset
    this.rangeAntenna = ''; // Added missing reset
    this.system = false; // Added missing reset
    this.fault = false; // Added missing reset
    this.pnm = false; // Added missing reset
    this.uplinkInterval = '';
    this.payloadExceedsAction = 'fragments';
    this.mType = 'ConfirmedDataUp';
    this.payloadContent = '';
    this.base64Encoded = false;
    this.latitude = 1;
    this.longitude = 1;
    this.altitude = undefined; // Added missing reset
    this.locationAddress = 'Device Location';
    this.deviceCreatedForSession = false;
    this.showSearchBox = false; // Added missing reset
    this.searchAddress = ''; // Added missing reset
    this.activeVerticalTab = 'General';
    this.setActiveLoRaWANTab('Activation');

    // SCTE283 Resets
    // this.isScte283 = false; // Reset device type flag
    this.expandedSCTESystemRow = null; // Reset expanded row state

    // 1. System Group Resets (System, Status, Config, Reset, Event, File)
    this.SystemCapabilities = {
        AmplifierType: 'other',
        SupportsPowerSupplyRedundancy: false,
        PowerSupplyRedundancyMode: 'other',
        SupportsPowerSavingMode: false,
        SupportsRfConfigFile: false,
        SupportsDebugFile: false,
        SupportsRfSpectrumCapture: false,
    };
    this.SystemStatus = { UniqueId: '', CurrentDateTime: '', UpTime: '' };
    this.Identification = { ModelNumber: '', SerialNumber: '', DeviceAlias: '', DeviceDescription: '' };
    this.Vendor = { Name: 'hgjdbs', Oui: this.devEUI }; // Note: OUI depends on the reset devEUI
    this.VersionSummary = { CurrentSwVersion: '', BootRomVersion: '', HwVersion: '' };
    this.Enclosure = { IsOpen: false };
    this.Sensor = []; // Clear sensor array
    this.PowerSupply = { Id: null, Description: '', OperStatus: 'other', InputVoltage: null, InputCurrent: null };
    this.OutputRail = { Id: null, Description: '', OperStatus: 'other', Voltage: null, Current: null };
    this.SystemCfg = { Hostname: '', AssetId: '', Description: '', CascadePosition: null };
    this.Location = { Description: '', Latitude: '', Longitude: '' };
    this.ResetCapabilities = { ResetTypesSupported: 'softReset', ResetHistorySize: null };
    this.ResetHistoryStatus = { Index: null, ResetTimestamp: '', Type: 'softReset', Reason: '', EventIdRef: null, RecoveryTime: null };
    this.EventCapabilities = { LocalEventLogMaxSize: null };
    this.EventStatus = { ThrottleThresholdExceeded: false };
    this.Event = { Index: null, FirstTime: '', LastTime: '', Counts: null, Level: 'emergency', Id: '', Text: '' };
    this.Syslog = { Level: '', Timestamp: '', Hostname: '', NeType: '', Vendor: '', EventId: '', Text: '', VendorSpecificText: '' };
    this.EventSyslogStatus = { Index: null, ServerAddress: '', AddressOrigin: 'other' };
    this.EventThrottleCfg = { AdminState: 'unconstrained', Threshold: 10, Interval: 10 };
    this.EventReportingCfg = { Priority: 'emergency', Reporting: 'local' };
    this.SyslogServerCfg = { Index: null, ServerAddress: '', AdminState: 'unconstrained' };
    this.FileCapabilities = { NumDebugFilesSupported: null, NumRfCfgFilesSupported: null, NumRfSpectrumCaptureFilesSupported: null };
    this.FileStatus = { Filename: '', FileType: 'other', FileStatus: 'other', DateCreated: '' };
    this.DataTransferCfg = { RemoteServerIndex: null, RemoteServerHost: '', RemoteServerPort: null, RemotServerBaseUri: '', Protocol: 'other', LocalStore: false };

    // 2. RF Group Resets (Capabilities, Status, Config)
    this.RfCapabilities = { NumRfPorts: null, SupportsUniversalPlugin: false, NumDiplexFilters: null, SupportsRfSpectrumCapture: 'notSupported' };
    this.RfPortCapabilities = { Index: null };
    this.DiplexFilterCapabilities = { DiplexFilterIndex: null, DiplexFilterUsUpperBandEdge: null, DiplexFilterDsLowerBandEdge: null };
    this.UsLogicalPortCapabilities = { MinUsFreq: null, MaxUsFreq: null, OperationalGain: null, NumUsStages: null, RfTestPointSupport: false, RfTestPointNumPoints: null, SupportsIngressSwitch: false, IngressSwitchAttenuationMinValue: null, IngressSwitchAttenuationMaxValue: null, IngressSwitchAttenuationStepSize: null, RfLevelControlType: 'other', ThermalLevelControlSelectRangeMinValue: null, ThermalLevelControlSelectRangeMaxValue: null, ThermalLevelControlSelectRangeStepSize: null };
    this.DsLogicalPortCapabilities = { MinDsFreq: null, MaxDsFreq: null, OperationalGain: null, NumDsStages: null, RfTestPointSupport: false, RfTestPointNumPoints: null, AgcType: 'other', AgcNumAgilePilots: null, AgcPilotLossProtectionType: '' };
    this.UsDsStageCapabilities = { StageIndex: null, Type: 'other', Location: 'other', MinAttenuation: null, MaxAttenuation: null, AttenuationStepSize: null, MinEqualization: null, MaxEqualization: null, EqualizationStepSize: null };
    this.RfStatusGrp = { UniversalPluginPresent: false, UniversalPluginDescr: '' };
    this.UsLogicalPortStatus = { RfLevelControlEnabled: false, RfLevelControl: 'other', RfLevelControlToUpperLimit: null, RfLevelControlToLowerLimit: null };
    this.DsLogicalPortStatus = { ReportedOutputPower: null, DsAgcEnabled: false, DsAgcPilotLossProtection: 'other', DsAgcToUpperLimit: null, DsAgcToLowerLimit: null };
    this.LogicalPortStatus = { VendorDesc: '', OperStatus: 'other' };
    this.TestPointStatus = { PointIndex: null, PointFreq: null, PointLevel: null };
    this.RfPortCfg = { Index: null, AdminStatus: 'up' };
    this.BidirLogicalPortCfg = { ActiveDiplexFilterIndex: null };
    this.LogicalPortCfg = { AdminStatus: 'up', RfMute: false };
    this.UsLogicalPortCfg = { ThermalLevelControlSelectRangeSetting: null };
    this.UsIngressSwitchCfg = { State: 'on', Attenuation: null };
    this.DsLogicalPortCfg = { DsAgcEnable: false };
    this.DsAgileAgcPilotCfg = { PilotNum: null, PilotFreq: null };
    this.UsDsCfg = { StageIndex: null, Attenuation: null, Equalization: null };

    // 3. Networking Group Resets
    this.IPHostStatus = { Ip: '', SubnetMask: '', DefaultGateway: '', ManagementIp: '' };
    this.LocalTimeStatus = { Index: null, ServerIp: '' };
    this.DhcpServerStatus = { ServerIp: '', RelayAgentIp: '' };
    this.DnsServerStatus = { Index: null, ServerIp: '' };

    // 4. PNM Group Resets
    this.PnmTestStatus = { TestId: '', Type: 'other', MeasurementStatus: 'other', RemoteServerIndex: null, DestinationFilename: '' };
    this.PnmTestMeasurement = { TestId: '' };
    this.PnmTestMeasHeader = { FileType: null, MajorVersion: null, MinorVersion: null, CaptureTime: null, UniqueId: '', ManagementIp: '', RfPortIndex: null, Direction: 'upstream' };
    this.RfPortIndex = undefined;
    this.InactivityTimeout = 300;
    this.FirstSegmentCenterFreq = undefined;
    this.LastSegmentCenterFreq = undefined;
    this.SegmentFrequencySpan = 0;
    this.NumBinsPerSegment = 256;
    this.EquivalentNoiseBandwidth = 150;
    this.WindowFunction = 'other';
    this.NumAverages = 1;

    // Final action: Re-add the initial sensor for a new form
    this.addSensor();
}

  private initMap(): void {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map('map').setView([this.latitude, this.longitude], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
    const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
    const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
    const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
    const defaultIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = defaultIcon;
    this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map)
      .bindPopup(this.locationAddress)
      .openPopup();
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.latitude = parseFloat(e.latlng.lat.toFixed(6));
      this.longitude = parseFloat(e.latlng.lng.toFixed(6));
      this.updateMapMarker();
    });
    this.map.invalidateSize();
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.display_name) {
        this.locationAddress = data.display_name;
        if (this.marker) {
          this.marker.setPopupContent(this.locationAddress);
        }
      } else {
        this.locationAddress = 'Address not found';
        if (this.marker) {
          this.marker.setPopupContent(this.locationAddress);
        }
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      this.locationAddress = 'Address lookup failed';
      if (this.marker) {
        this.marker.setPopupContent(this.locationAddress);
      }
    }
  }

  updateMapMarker(): void {
    if (this.map && this.marker && this.latitude !== null && this.longitude !== null) {
      const newLatLng = new L.LatLng(this.latitude, this.longitude);
      this.marker.setLatLng(newLatLng);
      this.map.setView(newLatLng, this.map.getZoom() || 13);
    } else if (this.map && this.latitude !== null && this.longitude !== null) {
      this.marker = L.marker([this.latitude, this.longitude]).addTo(this.map);
      this.map.setView([this.latitude, this.longitude], this.map.getZoom() || 13);
    }
    this.reverseGeocode(this.latitude, this.longitude);
  }

  onLatLngChange(): void {
    this.updateMapMarker();
  }

  async searchLocation(): Promise<void> {
    if (!this.searchAddress) {
      console.warn('Please enter an address to search.');
      return;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.searchAddress)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        this.latitude = parseFloat(firstResult.lat);
        this.longitude = parseFloat(firstResult.lon);
        this.updateMapMarker();
        this.map?.setView([this.latitude, this.longitude], 13);
        console.log('Location found:', firstResult);
      } else {
        console.warn('Location not found for the given address.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  }

  generateDevEUI(): void {
    this.devEUI = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    this.Vendor.Oui = this.devEUI.slice(0, 6);
    console.log('Generated DevEUI:', this.devEUI);
    console.log('Set OUI:', this.Vendor.Oui);
  }

  generateAppKey(): void {
    this.appKey = this.generateRandomHexString(32);
    console.log('Generated App Key:', this.appKey);
  }

  generateDevAddr(): void {
    this.devAddr = this.generateRandomHexString(8);
    console.log('Generated DevAddr:', this.devAddr);
  }

  generateNwkSKey(): void {
    this.nwkSKey = this.generateRandomHexString(32);
    console.log('Generated NwkSKey:', this.nwkSKey);
  }

  generateAppSKey(): void {
    this.appSKey = this.generateRandomHexString(32);
    console.log('Generated AppSKey:', this.appSKey);
  }

 /**
   * Generates a random string consisting of only lowercase letters.
   * @param length The desired length of the string.
   */
 private generateRandomLetters(length: number): string {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Generates a random string consisting of only numbers.
 * @param length The desired length of the string.
 */
private generateRandomNumbers(length: number): string {
  return Array.from({ length: length }, () => Math.floor(Math.random() * 10)).join('');
}

/**
 * Generates a random Asset ID in the format "abc-def-12345" (letters-letters-numbers).
 */
generateAssetId(): void {
  // Part 1: 3 letters
  const part1 = this.generateRandomLetters(3);
  // Part 2: 3 letters
  const part2 = this.generateRandomLetters(3);
  // Part 3: 5 numbers
  const part3 = this.generateRandomNumbers(5);
  
  this.SystemCfg.AssetId = `${part1}-${part2}-${part3}`;
  console.log('Generated Asset ID:', this.SystemCfg.AssetId);
}

  private generateRandomHexString(length: number): string {
    let result = '';
    const characters = '0123456789ABCDEF';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  toggleAppKeyVisibility(): void {
    this.showAppKey = !this.showAppKey;
  }

  toggleNwkSKeyVisibility(): void {
    this.showNwkSKey = !this.showNwkSKey;
  }

  toggleAppSKeyVisibility(): void {
    this.showAppSKey = !this.showAppSKey;
  }
}