import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { AppService } from '../../../app.service';

// Assume this service is created in a separate file (e.g., device-cache.service.ts)
// This service stores temporary data.
import { DeviceCacheService } from '../device-cache.sevice';


interface Sensor {
  id: string | null;
  name: string | null;
  sensorType: string;
  scale: string;
  precision: number | null;
  value: number | null;
  operStatusType: string;
  unitsDisplay: string | null;
  valueTimeStamp: string | null;
  valueUpdateRate: number | null;
}

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss']
})
export class AddDeviceComponent implements OnInit, AfterViewInit, OnDestroy {

  activeVerticalTab: 'General' | 'SCTE283' | 'LoRaWAN' = 'General';
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

  // SCTE283 Settings
  amplifierType: string = '1';
  redundancyMode: string = '1';
  currentTime: string = new Date().toLocaleString();
  sensorType: string = '1';
  scale: string = '1';
  operStatusType: string = '1';
  type: string = '1';
  evPriorityType: string = '1';
  neType: string = 'scte279amp';
  ipAddressOriginType: string = '1'
  eventThrottleAdminStateType: string = '1'
  threshold: number = 10;
  interval: number = 10;
  evReportingType: string = '1';
  fileType: string = '1';
  // fileStatus: string = '1';
  protocol: string = '1';
  rfSpectrumCapture: string = '0';
  rfLevelControlType: string = '1';
  agcType: string = '1';
  usDsType: string = '1';
  location: string = '1';
  universalPluginDescr: string = 'Not Populated';
  rfLevelControl: string = '1';
  dsAgcPilotLossProtection: string = '1';
  adminStatusType: string = '1';
  state: string = '1';
  attenuation: number = 0;
  pnmType: string = '0';
  measStatusType: string = '1';
  direction: string = '1';
  inactivityTimeout: number = 300;
  segmentFrequencySpan: number = 0;
  numBinsPerSegment: number = 256;
  equivalentNoiseBandwidth: number = 150;
  numAverages: number = 1;
  windowFunction: string = '0';

  system_capabilities: {
    amplifier_type: string;
    supports_power_supply_redundancy: boolean;
    power_supply_redundancy_mode: string;
    supports_power_saving_mode: boolean;
    supports_rf_config_file: boolean;
    supports_debug_file: boolean;
    supports_rf_spectrum_capture: boolean;
  } = {
      amplifier_type: '1',
      supports_power_supply_redundancy: false,
      power_supply_redundancy_mode: '1',
      supports_power_saving_mode: false,
      supports_rf_config_file: false,
      supports_debug_file: false,
      supports_rf_spectrum_capture: false,
    };

  systemStatus: {
    unique_id: string;
    current_date_time: string;
    up_time: string;
  } = {
      unique_id: '',
      current_date_time: '',
      up_time: '',
    };
  identification: {
    model_number: string;
    serial_number: string;
    device_alias: string;
    device_description: string;
  } = {
      model_number: '',
      serial_number: '',
      device_alias: '',
      device_description: ''
    };
  vendor: {
    name: string;
    oui: string;
  } = {
      name: '',
      oui: ''
    };
  versionSummary: {
    current_sw_version: string;
    boot_rom_version: string;
    hw_version: string;
  } = {
      current_sw_version: '',
      boot_rom_version: '',
      hw_version: ''
    };
  enclosure: {
    is_open: boolean;
  } = {
      is_open: false
    };
  powerSupply: {
    id: number | null;
    description: string;
    oper_status: string;
    input_voltage: number | null;
    input_current: number | null;
  } = {
      id: null,
      description: '',
      oper_status: '1',
      input_voltage: null,
      input_current: null
    };
  outputRail: {
    id: number | null;
    description: string;
    oper_status: string;
    voltage: number | null;
    current: number | null;
  } = {
      id: null,
      description: '',
      oper_status: '1',
      voltage: null,
      current: null
    };

  sensors: {
    id: number | null;
    name: string | null;
    sensor_type: string | '1';
    scale: string | '1';
    precision: number | null;
    value: number | null;
    oper_status: string | '1';
    units_display: string | null;
    value_time_stamp: string | null;
    value_update_rate: number | null;
  }[] = [];

  systemCfg: {
    hostname: string;
    asset_id: string;
    description: string;
    cascade_position: number | null
  } = {
      hostname: '',
      asset_id: '',
      description: '',
      cascade_position: null
    }

  locationscte: {
    description: string;
    latitude: string;
    longitude: string;
  } = {
      description: '',
      latitude: '',
      longitude: ''
    }

  resetCapabilities: {
    reset_types_supported: string;
    reset_history_size: number | null
  } = {
      reset_types_supported: '1',
      reset_history_size: null
    }

  resetHistoryStatus: {
    index: number | null;
    reset_timestamp: string;
    type: string;
    reason: string;
    event_id_ref: number | null;
    recovery_time: number | null
  } = {
      index: null,
      reset_timestamp: '',
      type: '1',
      reason: '',
      event_id_ref: null,
      recovery_time: null
    }

  eventCapabilities: {
    local_event_log_max_size: number | null;
  } = {
      local_event_log_max_size: null,
    };

  eventStatus: {
    throttle_threshold_exceeded: boolean;
  } = {
      throttle_threshold_exceeded: false,
    };

  event: {
    index: number | null;
    first_time: string;
    last_time: string;
    level: string;
    id: string;
    text: string;
  } = {
      index: null,
      first_time: '',
      last_time: '',
      level: '1',
      id: '',
      text: '',
    };

  syslog: {
    level: string;
    timestamp: string;
    hostname: string;
    ne_type: string;
    vendor: string;
    event_id: string;
    text: string;
    vendor_specific_text: string;
  } = {
      level: '',
      timestamp: '',
      hostname: '',
      ne_type: '',
      vendor: '',
      event_id: '',
      text: '',
      vendor_specific_text: '',
    };

  eventSyslogStatus: {
    index: number | null;
    server_address: string;
    address_origin: string;
  } = {
      index: null,
      server_address: '',
      address_origin: '1',
    };

  eventThrottleCfg: {
    admin_state: string;
    threshold: number | null;
    interval: number | null;
  } = {
      admin_state: '1',
      threshold: null,
      interval: null
    };

  eventReportingCfg: {
    priority: string;
    reporting: boolean;
  } = {
      priority: '1',
      reporting: false
    };

  syslogServerCfg: {
    index: number | null;
    server_address: string;
    admin_state: string;
  } = {
      index: null,
      server_address: '',
      admin_state: '1'
    };

  fileCapabilities: {
    num_debug_files_supported: number | null;
    num_rf_cfg_files_supported: number | null;
    num_rf_spectrum_capture_files_supported: number | null;
  } = {
      num_debug_files_supported: null,
      num_rf_cfg_files_supported: null,
      num_rf_spectrum_capture_files_supported: null
    };

  fileStatus: {
    filename: string;
    file_type: string;
    file_status: string;
    date_created: string;
  } = {
      filename: '',
      file_type: '1',
      file_status: '1',
      date_created: ''
    };

  dataTransferCfg: {
    remote_server_index: number | null;
    remote_server_host: string;
    remote_server_port: number | null;
    remot_server_base_uri: string;
    protocol: string;
    local_store: boolean;
  } = {
      remote_server_index: null,
      remote_server_host: '',
      remote_server_port: null,
      remot_server_base_uri: '',
      protocol: '1',
      local_store: false
    };


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
        this.activeSettingTab = 'System';
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
    if (this.sensors.length > 0) {
      const firstSensor = this.sensors[0];
      // Check for a value in any of the primary fields.
      // This is more robust than checking just one field.
      if (firstSensor.id || firstSensor.name || firstSensor.units_display) {
        return true;
      }
    }
    return false;
  }

  setActiveVerticalTab(tabName: 'General' | 'SCTE283' | 'LoRaWAN'): void {
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
    this.sensors.push({
      id: null,
      name: null,
      sensor_type: '1', // Default value
      scale: '1',     // Default value
      precision: null,
      value: null,
      oper_status: '1', // Default value
      units_display: null,
      value_time_stamp: null,
      value_update_rate: null
    });
  }

  removeSensor(index: number): void {
    this.sensors.splice(index, 1);
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
      system_grp: {
        SystemCapabilitiesGrp: {
          system_capabilities: this.system_capabilities,
        },
        system_status_grp: {
          SystemStatus: this.systemStatus,
          Identification: this.identification,
          Vendor: this.vendor,
          VersionSummary: this.versionSummary,
          Enclosure: this.enclosure,
          Sensor: this.sensors.map(s => ({
            Id: s.id,
            Name: s.name,
            SensorType: s.sensor_type,
            Scale: s.scale,
            Precision: s.precision,
            Value: s.value,
            OperStatus: s.oper_status,
            UnitsDisplay: s.units_display,
            ValueTimeStamp: s.value_time_stamp,
            ValueUpdateRate: s.value_update_rate
          })),
          PowerSupply: this.powerSupply,
          OutputRail: this.outputRail
        },
        system_cfg_grp: {
          systemCfg: this.systemCfg,
          locationscte: this.locationscte
        },
        reset_status_grp: {
          resetCapabilities: this.resetCapabilities,
          resetHistoryStatus: this.resetHistoryStatus
        },
        event_status_grp: {
          event_status_grp: {
            event_capabilities: this.eventCapabilities,
            event_status: this.eventStatus,
            event: this.event,
            syslog: this.syslog,
            event_syslog_status: this.eventSyslogStatus
          },
        },
        event_cfg_grp: {
          event_throttle_cfg: this.eventThrottleCfg,
          event_reporting_cfg: this.eventReportingCfg,
          syslog_server_cfg: this.syslogServerCfg
        },
        file_management: {
          file_capabilities: this.fileCapabilities,
          file_status: this.fileStatus,
          data_transfer_cfg: this.dataTransferCfg
        }
      },
      rf_grp: {
        rf_capabilities_grp: {},
        rf_status_grp: {},
        rf_cfg_group: {}
      },
      networking_grp: {},
      pnm_grp: {},
    //}
    };

    // Build the final payload by merging the collected data
   // const finalPayload = {
     // ...(this.isScte283 ? { Scte279Amplifier: scte283Data } : { lorawan: lorawanData }),
     // sensors: this.sensors
   // };

    const finalPayload = {
       lorawan: lorawanData,
       ...(this.isScte283 && { Scte279Amplifier: scte283Data })
    }

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

    // Capture and cache the data from the current tab
    // Note: The data is saved to component properties, which acts as a cache.
    // The final payload is built in createFinalDevicePayload().

    // Logic for navigation based on the active vertical tab
    if (this.activeVerticalTab === 'General') {
      if (this.isScte283) {
        this.setActiveVerticalTab('SCTE283');
        this.setActiveSCTETab(this.scte283TabSequence[0]);
      } else {
        this.setActiveVerticalTab('LoRaWAN');
        this.setActiveLoRaWANTab(this.loRaWANTabSequence[0]);
      }
    } else if (this.activeVerticalTab === 'SCTE283') {
      const currentIndex = this.scte283TabSequence.indexOf(this.activeSettingTab);
      if (currentIndex < this.scte283TabSequence.length - 1) {
        this.setActiveSCTETab(this.scte283TabSequence[currentIndex + 1]);
      } else {
        this.setActiveVerticalTab('LoRaWAN');
        this.setActiveLoRaWANTab(this.loRaWANTabSequence[0]);
      }
    } else if (this.activeVerticalTab === 'LoRaWAN') {
      const currentIndex = this.loRaWANTabSequence.indexOf(this.activeSettingTab);
      if (currentIndex < this.loRaWANTabSequence.length - 1) {
        this.setActiveLoRaWANTab(this.loRaWANTabSequence[currentIndex + 1]);
      }
    }
    console.log('Data cached, moving to the next tab.');
  }

  /**
   * Builds the final device payload from all component data and sends it to the API.
   * On success, navigates to the devices list page.
   */
  saveAndClose(): void {
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
    this.uplinkInterval = '';
    this.payloadExceedsAction = 'fragments';
    this.mType = 'ConfirmedDataUp';
    this.payloadContent = '';
    this.base64Encoded = false;
    this.latitude = 1;
    this.longitude = 1;
    this.locationAddress = 'Device Location';
    this.deviceCreatedForSession = false;
    this.activeVerticalTab = 'General';
    this.setActiveLoRaWANTab('Activation');

    this.sensors = [];
    this.addSensor();
  }

  // NOTE: The methods below are unchanged from the original file.

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
    console.log('Generated DevEUI:', this.devEUI);
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
