import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { AppService } from '../../../app.service';

@Component({
  selector: 'app-add-device',
  templateUrl: './add-device.component.html',
  styleUrls: ['./add-device.component.scss']
})
export class AddDeviceComponent implements OnInit, AfterViewInit, OnDestroy {
  
  activeVerticalTab: 'General' | 'SCTE283' | 'LoRaWAN' = 'General';
  activeSettingTab: string = 'Activation';
  private loRaWANTabSequence: string[] = ['Activation', 'Class', 'Frame settings', 'Features', 'Location', 'Payload'];
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

  amplifierType: string = '1';
  redundancyMode: string = '1';
  currentTime: string = new Date().toLocaleString();
  sensorType: string = '1';
  scale: string = '1';
  operStatusType: string = '1';
  type: string = '1';
  evPriorityType: string = '1';
  neType: string = 'scte279amp';
  ipAddressOriginType: string = '1';
  eventThrottleAdminStateType: string = '1'
  threshold: number = 10;
  interval: number = 10;
  evReportingType: string = '1';
  fileType: string = '1';
  fileStatus: string = '1';
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

  // Replaced message and isError with a single config object
  modalConfig = {
    show: false,
    message: '',
    isError: false,
    showCancelButton: false, // Simple alerts don't need a cancel button
  };

  // activeSettingTab: string = 'General';
  // private tabSequence: string[] = ['General', 'Activation', 'Class', 'Frame settings', 'Features', 'Location', 'Payload'];

  private deviceCreatedForSession: boolean = false;

  expandedSCTESystemRow: string | null = null;

  constructor(private router: Router, private appService: AppService, private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const deviceType = params.get('deviceType');
      if (deviceType === 'SCTE283') {
          this.isScte283 = true;
          this.activeVerticalTab = 'General';
          this.activeSettingTab = 'System';
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
        // Using the new modal method for API errors
        // this.showModal('Failed to fetch gateways. Please try again.', true);
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

  /**
   * Private helper to encapsulate the save/update API call logic.
   * @returns The Observable from the service call.
   */
  private _saveDevice() {
    const newDeviceData = {
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
      base64Encoded: this.base64Encoded,
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
        altitude: this.altitude
      }
    };

    console.log('Attempting to save/update device:', newDeviceData);

    // Call either create or update based on the flag
    if (!this.deviceCreatedForSession) {
      return this.appService.createDevice(newDeviceData);
    } else {
      return this.appService.updateDevice(this.devEUI, newDeviceData);
    }
  }

  /**
   * Saves the current tab's data and navigates to the next tab.
   */
  
  /*
  saveAndNext(): void {
    if (!this.name || !this.devEUI || !this.selectedGateway || !this.region) {
      console.warn('Please fill in Name, DevEUI, Gateway, and Region in the General tab before proceeding.');
      this.showModal('Please fill in Name, DevEUI, Gateway, and Region in the General tab before proceeding.', true);
      this.activeSettingTab = 'General';
      return;
    }

    this._saveDevice().subscribe({
      next: (response) => {
        console.log('Device saved successfully!', response);
        this.deviceCreatedForSession = true;
        const currentIndex = this.tabSequence.indexOf(this.activeSettingTab);
        if (currentIndex < this.tabSequence.length - 1) {
          const nextTab = this.tabSequence[currentIndex + 1];
          this.setActiveTab(nextTab);
        }
      },
      error: (error) => {
        console.error('Error saving device:', error);
        this.showModal('Failed to save device. Check console for details.', true);
      }
    });
  }
    */


  saveAndNext(): void {
    if (this.activeVerticalTab === 'General') {
      // Check if General tab fields are filled
      if (!this.name || !this.devEUI || !this.selectedGateway || !this.region) {
        this.showModal('Please fill in Name, DevEUI, Gateway, and Region in the General tab before proceeding.', true);
        return; // Stay on the General tab
      }

      this._saveDevice().subscribe({
        next: (response) => {
          console.log('General settings saved successfully!', response);
          this.deviceCreatedForSession = true;
          // Switch to the LoRaWAN vertical tab and activate the first horizontal tab
          this.setActiveVerticalTab('LoRaWAN');
        },
        error: (error) => {
          console.error('Error saving general settings:', error);
          this.showModal('Failed to save general settings. Check console for details.', true);
        }
      });

    } else if (this.activeVerticalTab === 'LoRaWAN') {
      if (!this.name || !this.devEUI || !this.selectedGateway || !this.region) {
        console.warn('Please fill in Name, DevEUI, Gateway, and Region in the General tab before proceeding.');
        this.showModal('Please fill in Name, DevEUI, Gateway, and Region in the General tab before proceeding.', true);
        this.activeVerticalTab = 'General';
        return;
      }
      // Logic for navigating between horizontal tabs
      this._saveDevice().subscribe({
        next: (response) => {
          console.log('LoRaWAN settings saved successfully!', response);
          const currentIndex = this.loRaWANTabSequence.indexOf(this.activeSettingTab);
          if (currentIndex < this.loRaWANTabSequence.length - 1) {
            const nextTab = this.loRaWANTabSequence[currentIndex + 1];
            this.setActiveLoRaWANTab(nextTab);
          }
        },
        error: (error) => {
          console.error('Error saving LoRaWAN settings:', error);
          this.showModal('Failed to save device settings. Check console for details.', true);
        }
      });
    }
  }

  /**
   * Saves the device and navigates to the device list page.
   */
  saveAndClose(): void {
    this._saveDevice().subscribe({
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
   * Saves the device and then resets the form to add a new one.
   */
  saveAndNew(): void {
    this._saveDevice().subscribe({
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
    // this.setActiveTab('General');
    this.activeVerticalTab = 'General';
    this.setActiveLoRaWANTab('Activation');
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