'use strict';

const Homey = require('homey');
const { Driver } = require('homey');
const Axios = require('axios');

class MeaterProbeDriver extends Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Meater Probe driver has been initialized');

    this._measureInternalChanged = this.homey.flow.getDeviceTriggerCard("measure_internal_changed");
    this._measureAmbientChanged = this.homey.flow.getDeviceTriggerCard("measure_ambient_changed");
    this._measureTargetChanged = this.homey.flow.getDeviceTriggerCard("measure_target_changed");
    this._measurePeakChanged = this.homey.flow.getDeviceTriggerCard("measure_peak_changed");
    this._cookNameConfigured = this.homey.flow.getDeviceTriggerCard("cook_name_configured");
    this._timeElapsedChanged = this.homey.flow.getDeviceTriggerCard("time_elapsed_changed");
    this._timeRemainingChanged = this.homey.flow.getDeviceTriggerCard("time_remaining_changed");
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async getApiDevices() {
    this.log("Requesting list of existing devices");

    let axiosInstance = Axios.create({
      baseURL: 'https://public-api.cloud.meater.com/v1/',
      headers: {
        'Authorization': 'Bearer ' + this.homey.settings.get('token')
      }
    });

    try {
      const resp = await axiosInstance.get('/devices');
      this.log("Successfully fetched list of meater probes");
      const j = resp.data;

      // Create list of probes to be returned
      var r = [];
      j.data.devices.forEach(e => {
        this.log("Found device id " + e.id);
        var p = {};
        p.name = this.homey.__('names.meaterprobe');
        p.data = {};
        p.data.id = e.id;
        r.push(p);
      });

      return r;
    } catch (error) {
      this.log(error);
    }
  }

  async onPair(session) {
    const devices = this.getApiDevices();

    session.setHandler("showView", async (viewId) => {
      if (viewId === "check_auth" && this.homey.settings.get('token') !== null) {
        await session.emit("auth_ok");
      }
    });

    session.setHandler("list_devices", async function () {
      return devices;
    })
  }

  triggerMeasureInternalChanged(device, tokens, state) {
    this._measureInternalChanged
      .trigger(device, tokens, state)
      .then(this.log("Successfully triggered measure_internal_changed"))
      .catch(this.error());
  }

  triggerMeasureAmbientChanged(device, tokens, state) {
    this._measureAmbientChanged
      .trigger(device, tokens, state)
      .then(this.log("Successfully triggered measure_ambient_changed"))
      .catch(this.error());
  }

  triggerMeasureTargetChanged(device, tokens, state) {
    this._measureTargetChanged
      .trigger(device, tokens, state)
      .then(this.log("Successfully triggered measure_target_changed"))
      .catch(this.error());
  }

  triggerMeasurePeakChanged(device, tokens, state) {
    this._measurePeakChanged
      .trigger(device, tokens, state)
      .then(this.log("Successfully triggered measure_peak_changed"))
      .catch(this.error());
  }

  triggerCookNameConfigured(device, tokens, state) {
    this._cookNameConfigured
      .trigger(device, tokens, state)
      .then(this.log("Successfully triggered cook_name_configured"))
      .catch(this.error());
  }

  triggerTimeElapsedChanged(device, tokens, state) {
    this._timeElapsedChanged
      .trigger(device, tokens, state)
      .then(this.log("Successfully triggered time_elapsed_changed"))
      .catch(this.error());
  }

  triggerTimeRemainingChanged(device, tokens, state) {
    this._timeRemainingChanged
      .trigger(device, tokens, state)
      .then(this.log("Successfully triggered time_remaining_changed"))
      .catch(this.error());
  }
}

module.exports = MeaterProbeDriver;
