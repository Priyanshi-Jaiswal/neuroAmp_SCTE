import { Component, EventEmitter, Output } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AppService } from '../../app.service';

interface ActionButtonParams extends ICellRendererParams {
  statusUpdated: () => void;
  type: 'device' | 'gateway';
  onViewLogs: (devEui: string) => void;
}

@Component({
  selector: 'app-action-button',
  templateUrl: './action-button.component.html',
  styleUrls: ['./action-button.component.scss']
})
export class ActionButtonComponent implements ICellRendererAngularComp {
  private params!: ActionButtonParams;

  // New: A single object to manage the state of the modal
  modalConfig = {
    show: false,
    message: '',
    isError: false,
    showCancelButton: false,
  };

  constructor(private appService: AppService) { }

  // New: Method to show the modal with a simple message
  private showModal(msg: string, isErr: boolean): void {
    this.modalConfig.message = msg;
    this.modalConfig.isError = isErr;
    this.modalConfig.show = true;
  }

  // New: Method to close the modal, triggered by the 'confirm' event
  onModalClose(): void {
    this.modalConfig.show = false;
  }

  get isStarted(): boolean {
    return this.params?.data?.currentStatus === 'playing';
  }

  get isUplinkRunning(): boolean {
    return this.params?.data?.uplinkStatus === 'running';
  }

  get isDevice(): boolean {
    return this.params.type === 'device';
  }

  agInit(params: ActionButtonParams): void {
    this.params = params as ActionButtonParams;
  }

  refresh(params: ActionButtonParams): boolean {
    this.params = params as ActionButtonParams;
    return true;
  }

  onStartClick(): void {
    if (this.params.type === 'device') {
      const devEui = this.params.data.devEUI;
      console.log('Starting simulator for device:', devEui);

      if (devEui) {
        this.appService.startDevice([devEui]).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateStatus('playing');
          },
          error: (err) => {
            console.error('Failed to start simulator:', err);
            this.showModal(`Failed to start simulator for ${devEui}.`, true);
          }
        });
      } else {
        console.error('Device EUI is undefined or null, cannot call API.');
      }
    } else if (this.params.type === 'gateway') {
      const gatewayId = this.params.data._id.$oid;
      console.log('Starting gateway with ID:', gatewayId);

      if (gatewayId) {
        this.appService.startGateway(gatewayId).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateStatus('playing');
          },
          error: (err) => {
            console.error('Failed to start gateway:', err);
            this.showModal(`Failed to start gateway for ${gatewayId}.`, true);
          }
        });
      } else {
        console.error('gatewayId is undefined or null, cannot call API.');
      }
    }
  }

  onStopClick(): void {
    if (this.params.type === 'device') {
      const devEui = this.params.data.devEUI;
      console.log('Stopping simulator for device:', devEui);

      if (devEui) {
        this.appService.stopDevice([devEui]).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateStatus('paused');
          },
          error: (err) => {
            console.error('Failed to stop simulator:', err);
            this.showModal(`Failed to stop simulator for ${devEui}.`, true);
          }
        });
      } else {
        console.error('Device EUI is undefined or null, cannot call API.');
      }
    } else if (this.params.type === 'gateway') {
      const gatewayId = this.params.data._id.$oid;
      console.log('Stopping gateway with ID:', gatewayId);

      if (gatewayId) {
        this.appService.stopGateway(gatewayId).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateStatus('paused');
          },
          error: (err) => {
            console.error('Failed to stop gateway:', err);
            this.showModal(`Failed to stop gateway for ${gatewayId}.`, true);
          }
        });
      } else {
        console.error('gatewayId is undefined or null, cannot call API.');
      }
    }
  }

  onStartUplink(): void {
    if (this.params.type === 'device') {
      const devEui = this.params.data.devEUI;
      console.log('Starting uplink for device:', devEui);

      if (devEui) {
        this.appService.startDeviceUplink([devEui]).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateUplinkStatus('running');
          },
          error: (err) => {
            console.error('Failed to start uplink:', err);
            this.showModal(`Failed to start uplink for ${devEui}.`, true);
          }
        });
      } else {
        console.error('Device EUI is undefined or null, cannot call API.');
      }
    } else if (this.params.type === 'gateway') {
      const gatewayId = this.params.data._id.$oid;
      console.log('Starting uplink for gateway:', gatewayId);

      if (gatewayId) {
        this.appService.startGatewayUplink(gatewayId).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateUplinkStatus('running');
          },
          error: (err) => {
            console.error('Failed to start uplink:', err);
            this.showModal(`Failed to start uplink for ${gatewayId}.`, true);
          }
        });
      } else {
        console.error('gatewayId is undefined or null, cannot call API.');
      }
    }
  }

  onStopUplink() {
    if (this.params.type === 'device') {
      const devEui = this.params.data.devEUI;
      console.log('Stopping uplink for device:', devEui);

      if (devEui) {
        this.appService.stopDeviceUplink([devEui]).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateUplinkStatus('stopped');
          },
          error: (err) => {
            console.error('Failed to stop simulator:', err);
            this.showModal(`Failed to stop uplink for ${devEui}.`, true);
          }
        });
      } else {
        console.error('Device EUI is undefined or null, cannot call API.');
      }
    } else if (this.params.type === 'gateway') {
      const gatewayId = this.params.data._id.$oid;
      console.log('Stopping uplink for gateway:', gatewayId);

      if (gatewayId) {
        this.appService.stopGatewayUplink(gatewayId).subscribe({
          next: (response) => {
            console.log('API call successful. Backend response:', response);
            this.updateUplinkStatus('stopped');
          },
          error: (err) => {
            console.error('Failed to stop uplink:', err);
            this.showModal(`Failed to stop uplink for ${gatewayId}.`, true);
          }
        });
      } else {
        console.error('gatewayId is undefined or null, cannot call API.');
      }
    }
  }

  onViewLogs(): void {
    console.log('View logs clicked for:', this.params.data.devEUI);
    this.params.onViewLogs(this.params.data.devEUI);
  }

  private updateStatus(newStatus: 'playing' | 'paused'): void {
    if (this.params.node) {
      this.params.node.data.currentStatus = newStatus;
      this.params.api.refreshCells({ rowNodes: [this.params.node], force: true });
    }
  }

  private updateUplinkStatus(newStatus: 'running' | 'stopped'): void {
    if (this.params.node) {
      this.params.node.data.uplinkStatus = newStatus;
      this.params.api.refreshCells({ rowNodes: [this.params.node], force: true });
    }
  }
}