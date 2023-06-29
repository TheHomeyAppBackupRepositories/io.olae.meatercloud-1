'use strict';

const { Device } = require('homey');

class MeaterProbeDevice extends Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('Meater Probe has been initialized');

    this.cookId = null;
    this.cookName = null;
    this.timeElapsed = null;
    this.timeRemaining = null;
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('Meater Probe has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Meater Probe settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('Meater Probe was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('Meater Probe has been deleted');
  }

  formatTime(inTime) {
    if( inTime < 60 ) {
      return inTime + " seconds";
    }

    let s = "";
    if( inTime > 3600 ) {
      s = Math.floor(inTime / 3600) + "h";
      inTime = inTime % 3600;
    }

    if( inTime > 60 ) {
      s += (s.length > 0 ? " " : "" ) + Math.floor(inTime / 60) + "m";
    }

    return s;
  }

  async setOffline() {
    this.removeCook();

    this.setCapabilityValue('measure_internal', null);
    this.setCapabilityValue('measure_ambient', null);
  }

  async createCook(id) {
    if( this.cookId !== null ) {
      return;
    }

    this.cookId = id;
    this.timeElapsed = null;
    this.timeRemaining = null;
    this.setCookName(null);
    this.setTargetTemperature(0);
    this.setPeakTemperature(0);
  }

  async removeCook() {
    if( this.cookId === null ) {
      return;
    }

    this.cookId = null;
    this.timeElapsed = null;
    this.timeRemaining = null;
    this.setCapabilityValue("cook_name", null);
    this.setCapabilityValue('measure_target', null);
    this.setCapabilityValue('measure_peak', null);
  }

  async setInternalTemperature(newTemperature) {
    if( newTemperature === this.getCapabilityValue('measure_internal') ) {
      return;
    }

    // Do some logging
    if( this.getCapabilityValue('measure_internal') !== null ) {
      this.log("Internal temperature updated from: " + this.getCapabilityValue('internal_ambient') + " to " + newTemperature);
    } else {
      this.log("Internal temperature set to " + newTemperature);
    }

    // Update value
    this.setCapabilityValue('measure_internal', newTemperature);

    // Trigger
    let device = this;
    let tokens = { "temperature": newTemperature };
    let state = {};

    this.driver.ready().then(() => {
          this.driver.triggerMeasureInternalChanged(device, tokens, state);
    });
  }

  async setAmbientTemperature(newTemperature) {
    if( newTemperature === this.getCapabilityValue('measure_ambient') ) {
      return;
    }

    // Do some logging
    if( this.getCapabilityValue('measure_ambient') !== null ) {
      this.log("Ambient temperature updated from: " + this.getCapabilityValue('measure_ambient') + " to " + newTemperature);
    } else {
      this.log("Ambient temperature set to " + newTemperature);
    }

    // Update value
    this.setCapabilityValue('measure_ambient', newTemperature);

    // Trigger
    let device = this;
    let tokens = { "temperature": newTemperature };
    let state = {};

    this.driver.ready().then(() => {
          this.driver.triggerMeasureAmbientChanged(device, tokens, state);
    });
  }

  async setTargetTemperature(newTemperature) {
    if( newTemperature === this.getCapabilityValue('measure_target') ) {
      return;
    }

    // Do some logging
    if( this.getCapabilityValue('measure_target') !== null ) {
      this.log("Target temperature updated from: " + this.getCapabilityValue('measure_target') + " to " + newTemperature);
    } else {
      this.log("Target temperature set to " + newTemperature);
    }

    // Update value
    this.setCapabilityValue('measure_target', newTemperature);

    // Trigger
    let device = this;
    let tokens = { "temperature": newTemperature };
    let state = {};

    this.driver.ready().then(() => {
          this.driver.triggerMeasureTargetChanged(device, tokens, state);
    });
  }

  async setPeakTemperature(newTemperature) {
    if( newTemperature === this.getCapabilityValue('measure_peak') ) {
      return;
    }

    // Do some logging
    if( this.getCapabilityValue('measure_peak') !== null ) {
      this.log("Peak temperature updated from: " + this.getCapabilityValue('measure_peak') + " to " + newTemperature);
    } else {
      this.log("Peak temperature set to " + newTemperature);
    }

    // Update value
    this.setCapabilityValue('measure_peak', newTemperature);

    // Trigger
    let device = this;
    let tokens = { "temperature": newTemperature };
    let state = {};

    this.driver.ready().then(() => {
          this.driver.triggerMeasurePeakChanged(device, tokens, state);
    });
  }

  async setCookName(name) {
    if( name === this.getCapabilityValue('cook_name') ) {
      return;
    }

    // Do some logging
    if( this.getCapabilityValue('cook_name') !== null ) {
      this.log("Cook name updated from: " + this.getCapabilityValue('cook_name') + " to " + name);
    } else {
      this.log("Cook name set to " + name);
    }

    // Update value
    this.setCapabilityValue('cook_name', name);

    // Trigger
    let device = this;
    let tokens = { "name": name };
    let state = {};

    this.driver.ready().then(() => {
          this.driver.triggerCookNameConfigured(device, tokens, state);
    });
  }

  async setElapsedTime(newTime) {
    if( newTime === null || newTime === this.elapsedTime ) {
      return;
    }

    this.elapsedTime = newTime;

    // Do some logging
    if( this.getCapabilityValue('time_elapsed') !== null ) {
      this.log("Elapsed time updated from: " + this.getCapabilityValue('time_elapsed') + " to " + newTime);
    } else {
      this.log("Elapsed time set to " + newTime);
    }

    // Update value
    this.setCapabilityValue('time_elapsed', this.formatTime(newTime));

    // Trigger
    let device = this;
    let tokens = {
      "seconds": newTime,
      "minutes": Math.floor(newTime / 60),
      "time_as_text": this.formatTime(newTime)
    };
    let state = {};

    this.driver.ready().then(() => {
          this.driver.triggerTimeElapsedChanged(device, tokens, state);
    });
  }

  async setRemainingTime(newTime) {
    if( newTime === null || newTime === this.remainingTime ) {
      return;
    }

    this.remainingTime = newTime;

    // Do some logging
    if( this.getCapabilityValue('time_remaining') !== null ) {
      this.log("Remaining time updated from: " + this.getCapabilityValue('time_remaining') + " to " + newTime);
    } else {
      this.log("Remaining time set to " + newTime);
    }

    // Update value
    this.setCapabilityValue('time_remaining', this.formatTime(newTime));

    // Trigger
    let device = this;
    let tokens = {
      "seconds": newTime,
      "minutes": Math.floor(newTime / 60),
      "time_as_text": this.formatTime(newTime)
    };
    let state = {};

    this.driver.ready().then(() => {
          this.driver.triggerTimeRemainingChanged(device, tokens, state);
    });
  }
}

module.exports = MeaterProbeDevice;
